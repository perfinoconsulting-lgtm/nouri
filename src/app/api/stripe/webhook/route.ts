/**
 * app/api/stripe/webhook/route.ts — Réception des événements Stripe
 *
 * Variables d'environnement requises :
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET            → whsec_... (fourni par la CLI Stripe)
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY        → Clé service Supabase (bypasse la RLS)
 *
 * Pour tester en local :
 *   stripe listen --forward-to localhost:3000/api/stripe/webhook
 */

import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import {
  sendSubscriptionConfirmedEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCancelledEmail,
} from '@/lib/email-service'

// Client Supabase avec la clé service (contourne la RLS pour les webhooks serveur)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Configuration Supabase admin manquante (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)'
    )
  }

  return createClient(url, key)
}

// Désactiver le body parsing automatique de Next.js — obligatoire pour la
// vérification de signature Stripe
export const runtime = 'nodejs'

export async function POST(request: Request) {
  // 1. Lire le corps brut — ne JAMAIS utiliser request.json()
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  // 2. Vérifier la signature Stripe
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // 3. Traiter l'événement — toujours retourner 200 même si le traitement échoue
  // Un 4xx/5xx provoquerait des retrys inutiles côté Stripe
  try {
    switch (event.type) {
      // ── Paiement initial réussi → création de l'abonnement ─────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode !== 'subscription' || !session.subscription) break

        const parentId = session.metadata?.parentId
        const childId = session.metadata?.childId

        if (!parentId || !childId) {
          console.error('❌ Métadonnées parentId/childId manquantes dans la session checkout')
          break
        }

        // Récupérer les détails complets de l'abonnement Stripe
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        // Accès via cast — current_period_* sont dépréciés dans les types Stripe récents
        const subRaw = subscription as unknown as Record<string, unknown>
        const currentPeriodEnd = typeof subRaw.current_period_end === 'number'
          ? new Date(subRaw.current_period_end * 1000).toISOString()
          : null
        const currentPeriodStart = typeof subRaw.current_period_start === 'number'
          ? new Date(subRaw.current_period_start * 1000).toISOString()
          : new Date().toISOString()

        const customerId = typeof session.customer === 'string'
          ? session.customer
          : (session.customer as Stripe.Customer | null)?.id ?? null

        // Upsert idempotent : si l'événement arrive deux fois, on écrase sans doublon
        const { error } = await supabase.from('subscriptions').upsert(
          {
            parent_id: parentId,
            child_id: childId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId,
            status: 'active',
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
          },
          { onConflict: 'stripe_subscription_id' }
        )

        if (error) {
          console.error('❌ Erreur Supabase création abonnement :', error)
        } else {
          console.log(JSON.stringify({ event: 'subscription_created', childId }))

          // Envoyer l'email de confirmation d'abonnement
          const [{ data: parentData }, { data: childData }] = await Promise.all([
            supabase.from('parents').select('email, prenom').eq('id', parentId).single(),
            supabase.from('children').select('prenom, avatar').eq('id', childId).single(),
          ])

          if (parentData && childData) {
            const amount = typeof session.amount_total === 'number' ? session.amount_total : 200
            const renewalDate = currentPeriodEnd ? new Date(currentPeriodEnd) : new Date()
            sendSubscriptionConfirmedEmail(
              { email: parentData.email, prenom: parentData.prenom ?? '' },
              { prenom: childData.prenom, avatar: childData.avatar ?? '' },
              amount,
              renewalDate,
            )
          }
        }
        break
      }

      // ── Abonnement modifié (renouvellement, annulation programmée, etc.) ────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const subRaw = subscription as unknown as Record<string, unknown>

        const currentPeriodEnd = typeof subRaw.current_period_end === 'number'
          ? new Date(subRaw.current_period_end * 1000).toISOString()
          : null

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('❌ Erreur Supabase mise à jour abonnement :', error)
        }
        break
      }

      // ── Abonnement annulé définitivement ─────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error("❌ Erreur Supabase annulation abonnement :", error)
        }

        // Envoyer l'email de résiliation — même si la mise à jour DB a échoué
        // car Stripe a confirmé l'annulation
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('parent_id, child_id, current_period_end')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (subData) {
          const [{ data: parentData }, { data: childData }] = await Promise.all([
            supabase.from('parents').select('email, prenom').eq('id', subData.parent_id).single(),
            supabase.from('children').select('prenom, avatar').eq('id', subData.child_id).single(),
          ])

          if (parentData && childData) {
            const endDate = subData.current_period_end
              ? new Date(subData.current_period_end as string)
              : new Date()
            sendSubscriptionCancelledEmail(
              { email: parentData.email, prenom: parentData.prenom ?? '' },
              { prenom: childData.prenom, avatar: childData.avatar ?? '' },
              endDate,
            )
          }
        }
        break
      }

      // ── Paiement échoué ───────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const invRaw = invoice as unknown as Record<string, unknown>

        const customerId = typeof invRaw.customer === 'string' ? invRaw.customer : null
        if (!customerId) break

        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('❌ Erreur Supabase paiement échoué :', error)
        } else {
          const amount = typeof invRaw.amount_due === 'number' ? invRaw.amount_due : 0
          const reason =
            typeof invRaw.last_finalization_error === 'object' &&
            invRaw.last_finalization_error !== null
              ? String((invRaw.last_finalization_error as Record<string, unknown>).message ?? 'inconnu')
              : 'inconnu'
          console.log(JSON.stringify({ event: 'payment_failed', amount, reason }))

          // Envoyer l'email d'échec de paiement avec le nombre de jours restants
          const { data: subData } = await supabase
            .from('subscriptions')
            .select('parent_id, child_id, current_period_end')
            .eq('stripe_customer_id', customerId)
            .single()

          if (subData) {
            const [{ data: parentData }, { data: childData }] = await Promise.all([
              supabase.from('parents').select('email, prenom').eq('id', subData.parent_id).single(),
              supabase.from('children').select('prenom, avatar').eq('id', subData.child_id).single(),
            ])

            if (parentData && childData) {
              const daysRemaining = subData.current_period_end
                ? Math.max(
                    0,
                    Math.round(
                      (new Date(subData.current_period_end as string).getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24)
                    )
                  )
                : 0
              sendPaymentFailedEmail(
                { email: parentData.email, prenom: parentData.prenom ?? '' },
                { prenom: childData.prenom, avatar: childData.avatar ?? '' },
                daysRemaining,
              )
            }
          }
        }
        break
      }

      // ── Paiement réussi (renouvellement mensuel) ──────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const invRaw = invoice as unknown as Record<string, unknown>

        // Ignorer l'événement de la création initiale — déjà géré par checkout.session.completed
        if (invRaw.billing_reason === 'subscription_create') break

        const customerId = typeof invRaw.customer === 'string' ? invRaw.customer : null
        if (!customerId) break

        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('❌ Erreur Supabase renouvellement réussi :', error)
        }
        break
      }

      default:
        break
    }
  } catch (err: unknown) {
    // Loguer l'erreur interne mais ne pas retourner d'erreur HTTP
    // → Stripe retentera l'envoi si on répond autre chose que 200
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('❌ Erreur interne Webhook :', message)
  }

  // Toujours retourner 200 — même si le traitement a échoué
  return NextResponse.json({ received: true })
}
