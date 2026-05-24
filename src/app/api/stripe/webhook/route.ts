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

// Désactiver le body parsing de Next.js — on doit lire le corps brut pour
// la vérification de signature Stripe
export const runtime = 'nodejs'

export async function POST(req: Request) {
  // 1. Lire le corps brut (IMPORTANT : ne pas utiliser req.json())
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    console.error('❌ Webhook : signature ou secret manquant')
    return NextResponse.json(
      { error: 'Signature Stripe ou secret webhook manquant.' },
      { status: 400 }
    )
  }

  // 2. Vérifier la signature Stripe
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error(`❌ Webhook signature invalide : ${message}`)
    return NextResponse.json(
      { error: `Signature invalide : ${message}` },
      { status: 400 }
    )
  }

  const supabase = getSupabaseAdmin()

  try {
    switch (event.type) {
      // ── Paiement initial réussi → création de l'abonnement ─────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode !== 'subscription' || !session.subscription) break

        // Récupérer les détails de l'abonnement Stripe
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        const parentId = subscription.metadata.parentId
        const childId = subscription.metadata.childId

        if (!parentId || !childId) {
          console.error('❌ Métadonnées parentId/childId manquantes dans le subscription')
          break
        }

        // Insérer ou mettre à jour dans la table subscriptions
        // current_period_start : champ renommé dans les API Stripe récentes
        const sub = subscription as unknown as Record<string, unknown>
        const periodStart = typeof sub.current_period_start === 'number'
          ? new Date(sub.current_period_start * 1000).toISOString()
          : new Date().toISOString()

        const { error } = await supabase.from('subscriptions').upsert(
          {
            parent_id: parentId,
            child_id: childId,
            stripe_subscription_id: subscription.id,
            stripe_price_id: subscription.items.data[0].price.id,
            status: subscription.status,
            current_period_start: periodStart,
          },
          { onConflict: 'stripe_subscription_id' }
        )

        if (error) {
          console.error('❌ Erreur Supabase lors de la création abonnement :', error)
        } else {
          console.log(
            `✅ Abonnement activé pour l'enfant ${childId} (parent ${parentId})`
          )
          // TODO : Envoyer l'email de bienvenue via Resend
          console.log(`📧 Email de bienvenue à envoyer au parent ${parentId}`)
        }
        break
      }

      // ── Abonnement modifié ────────────────────────────────────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const subRaw = subscription as unknown as Record<string, unknown>
        const updatedPeriodStart = typeof subRaw.current_period_start === 'number'
          ? new Date(subRaw.current_period_start * 1000).toISOString()
          : new Date().toISOString()

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            stripe_price_id: subscription.items.data[0].price.id,
            current_period_start: updatedPeriodStart,
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('❌ Erreur Supabase lors de la mise à jour abonnement :', error)
        } else {
          console.log(
            `🔄 Abonnement mis à jour : ${subscription.id} → statut : ${subscription.status}`
          )
        }
        break
      }

      // ── Abonnement annulé ─────────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('❌ Erreur Supabase lors de l\'annulation :', error)
        } else {
          console.log(`❌ Abonnement annulé : ${subscription.id}`)
        }
        break
      }

      // ── Paiement échoué ───────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        // invoice.subscription renommé dans les API Stripe récentes
        const invRaw = invoice as unknown as Record<string, unknown>
        const failedSubId = invRaw.subscription as string | null

        if (!failedSubId) break

        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', failedSubId)

        if (error) {
          console.error('❌ Erreur Supabase paiement échoué :', error)
        } else {
          console.error(`⚠️  Paiement échoué pour l'abonnement ${failedSubId} — statut : past_due`)
          // TODO : Envoyer un email d'alerte au parent via Resend
        }
        break
      }

      // ── Paiement réussi (renouvellement mensuel) ──────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const invSuccessRaw = invoice as unknown as Record<string, unknown>
        const successSubId = invSuccessRaw.subscription as string | null
        const billingReason = invSuccessRaw.billing_reason as string | null

        if (!successSubId || billingReason === 'subscription_create') break

        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('stripe_subscription_id', successSubId)

        if (error) {
          console.error('❌ Erreur Supabase paiement réussi :', error)
        } else {
          console.log(`💰 Paiement renouvellement réussi : ${successSubId}`)
        }
        break
      }

      default:
        // Événements non gérés — aucune action
        console.log(`ℹ️  Événement Stripe non géré : ${event.type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('❌ Erreur interne Webhook :', message)
    return NextResponse.json(
      { error: `Erreur interne : ${message}` },
      { status: 500 }
    )
  }
}
