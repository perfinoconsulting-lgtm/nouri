import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

// ─── createOrGetCustomer ──────────────────────────────────────────────────────
// Crée ou récupère un Customer Stripe et persiste l'ID dans la table `parents`.
export async function createOrGetCustomer(
  parentId: string,
  email: string,
  prenom: string | null
): Promise<Stripe.Customer> {
  const supabase = createServerSupabaseClient()

  const { data: parent, error: fetchError } = await supabase
    .from('parents')
    .select('stripe_customer_id')
    .eq('id', parentId)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Erreur lors de la récupération du parent : ${fetchError.message}`)
  }

  if (parent?.stripe_customer_id) {
    const existing = await stripe.customers.retrieve(parent.stripe_customer_id)
    if ((existing as Stripe.DeletedCustomer).deleted) {
      throw new Error('Le compte Stripe associé a été supprimé. Contactez le support.')
    }
    return existing as Stripe.Customer
  }

  const customer = await stripe.customers.create({
    email,
    name: prenom ?? 'Parent NourAl',
    metadata: { parentId },
  })

  const { error: updateError } = await supabase
    .from('parents')
    .update({ stripe_customer_id: customer.id })
    .eq('id', parentId)

  if (updateError) {
    throw new Error(`Erreur lors de la sauvegarde du Customer Stripe : ${updateError.message}`)
  }

  return customer
}

// ─── createCheckoutSession ────────────────────────────────────────────────────
// Crée une session Stripe Checkout pour un abonnement 2€/mois/enfant.
export async function createCheckoutSession(
  customerId: string,
  childId: string,
  parentId: string,
  priceId: string
): Promise<{ url: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
      metadata: { parentId, childId },
    },
    allow_promotion_codes: true,
    metadata: { parentId, childId },
    success_url: `${appUrl}/abonnement?success=true`,
    cancel_url: `${appUrl}/abonnement`,
  })

  if (!session.url) {
    throw new Error("Stripe n'a pas retourné d'URL de paiement.")
  }

  return { url: session.url }
}

// ─── createPortalSession ──────────────────────────────────────────────────────
// Crée une session Customer Portal Stripe pour gérer ou résilier l'abonnement.
export async function createPortalSession(
  customerId: string,
  returnUrl?: string
): Promise<{ url: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl ?? `${appUrl}/abonnement`,
  })

  return { url: portalSession.url }
}

// ─── SubscriptionStatus ───────────────────────────────────────────────────────

export interface SubscriptionStatus {
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

// ─── getSubscriptionStatus ────────────────────────────────────────────────────
// Lit la table `subscriptions` Supabase et enrichit avec cancelAtPeriodEnd
// depuis Stripe si l'abonnement est actif ou en essai.
export async function getSubscriptionStatus(childId: string): Promise<SubscriptionStatus> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, current_period_end, stripe_subscription_id')
    .eq('child_id', childId)
    .maybeSingle()

  if (error || !data) {
    return { status: 'inactive', currentPeriodEnd: null, cancelAtPeriodEnd: false }
  }

  let cancelAtPeriodEnd = false

  const isLive = data.status === 'active' || data.status === 'trialing'
  if (isLive && data.stripe_subscription_id) {
    try {
      const sub = await stripe.subscriptions.retrieve(data.stripe_subscription_id)
      cancelAtPeriodEnd = sub.cancel_at_period_end
    } catch {
      // Stripe injoignable — on retourne false par défaut
    }
  }

  return {
    status: data.status as string,
    currentPeriodEnd: (data.current_period_end as string | null) ?? null,
    cancelAtPeriodEnd,
  }
}
