/**
 * lib/stripe.ts — Fonctions utilitaires Stripe pour NourAl
 *
 * Variables d'environnement requises :
 *   STRIPE_SECRET_KEY               → Clé secrète Stripe (sk_test_...)
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY → Clé publique Stripe (pk_test_...)
 *   STRIPE_WEBHOOK_SECRET           → Secret du webhook (whsec_...)
 *   STRIPE_PRICE_ID                 → ID du tarif 2€/mois (price_...)
 *   NEXT_PUBLIC_APP_URL             → URL de base (ex: http://localhost:3000)
 */

import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// --- Initialisation du client Stripe ---
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  console.warn('⚠️  STRIPE_SECRET_KEY manquant — certaines fonctions Stripe ne fonctionneront pas.')
}

export const stripe = new Stripe(stripeSecretKey ?? 'sk_test_placeholder', {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore — version dahlia spécifique, non encore dans les types SDK
  apiVersion: '2026-04-22.dahlia',
  appInfo: {
    name: 'NourAl App',
    version: '0.1.0',
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// createOrGetCustomer
// Crée ou récupère un client Stripe pour le parent donné.
// Sauvegarde le stripe_customer_id dans la table `parents` de Supabase.
// ─────────────────────────────────────────────────────────────────────────────
export async function createOrGetCustomer(
  parentId: string,
  email: string,
  prenom: string | null
): Promise<string> {
  const supabase = createServerSupabaseClient()

  // 1. Vérifier si un Customer ID existe déjà en base
  const { data: parent, error: fetchError } = await supabase
    .from('parents')
    .select('stripe_customer_id')
    .eq('id', parentId)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Erreur Supabase lors de la récupération du parent : ${fetchError.message}`)
  }

  if (parent?.stripe_customer_id) {
    return parent.stripe_customer_id
  }

  // 2. Créer un nouveau Customer dans Stripe
  const customer = await stripe.customers.create({
    email,
    name: prenom ?? 'Parent NourAl',
    metadata: { parentId },
  })

  // 3. Persister le Customer ID dans Supabase
  const { error: updateError } = await supabase
    .from('parents')
    .update({ stripe_customer_id: customer.id })
    .eq('id', parentId)

  if (updateError) {
    throw new Error(`Erreur Supabase lors de la sauvegarde du Customer Stripe : ${updateError.message}`)
  }

  return customer.id
}

// ─────────────────────────────────────────────────────────────────────────────
// createCheckoutSession
// Crée une session Stripe Checkout pour un abonnement 2€/mois par enfant.
// ─────────────────────────────────────────────────────────────────────────────
export async function createCheckoutSession(
  customerId: string,
  childId: string,
  parentId: string,
  priceId: string
): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    // Codes promotionnels activés
    allow_promotion_codes: true,
    subscription_data: {
      // 7 jours d'essai gratuit
      trial_period_days: 7,
      metadata: { parentId, childId },
    },
    // Métadonnées accessibles depuis le webhook
    metadata: { parentId, childId },
    success_url: `${appUrl}/abonnement?success=true`,
    cancel_url: `${appUrl}/tarifs`,
  })

  if (!session.url) {
    throw new Error('Stripe n\'a pas retourné d\'URL de paiement.')
  }

  return session.url
}

// ─────────────────────────────────────────────────────────────────────────────
// createPortalSession
// Crée une session Customer Portal Stripe pour que le parent gère/résilie.
// ─────────────────────────────────────────────────────────────────────────────
export async function createPortalSession(customerId: string): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/abonnement`,
  })

  return portalSession.url
}

// ─────────────────────────────────────────────────────────────────────────────
// getSubscriptionStatus
// Lit la table `subscriptions` Supabase pour un enfant et retourne son statut.
// ─────────────────────────────────────────────────────────────────────────────
export async function getSubscriptionStatus(childId: string): Promise<string> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('child_id', childId)
    .single()

  if (error || !data) {
    return 'inactive'
  }

  return data.status as string
}
