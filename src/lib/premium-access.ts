import { createServerSupabaseClient } from '@/lib/supabase/server'

const PREMIUM_STATUSES = new Set(['active', 'trialing'])

export type PremiumAccessDenialReason =
  | 'unauthenticated'
  | 'forbidden'
  | 'premium_required'

export type PremiumAccessResult =
  | { allowed: true }
  | { allowed: false; reason: PremiumAccessDenialReason }

export interface PremiumAccessError {
  status: 401 | 403
  error: string
}

interface SubscriptionRow {
  status: string | null
  current_period_end: string | null
}

function isPremiumSubscription(subscription: SubscriptionRow | null): boolean {
  if (!subscription?.status || !PREMIUM_STATUSES.has(subscription.status)) {
    return false
  }

  if (!subscription.current_period_end) {
    return true
  }

  return new Date(subscription.current_period_end).getTime() > Date.now()
}

export async function getPremiumChildAccess(childId: string): Promise<PremiumAccessResult> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { allowed: false, reason: 'unauthenticated' }
  }

  // La clause parent_id garantit qu'un parent ne peut jamais tester l'abonnement d'un autre enfant.
  const { data: child, error: childError } = await supabase
    .from('children')
    .select('id')
    .eq('id', childId)
    .eq('parent_id', session.user.id)
    .maybeSingle()

  if (childError || !child) {
    return { allowed: false, reason: 'forbidden' }
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('child_id', childId)
    .eq('parent_id', session.user.id)
    .in('status', Array.from(PREMIUM_STATUSES))
    .order('current_period_end', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (!isPremiumSubscription(subscription as SubscriptionRow | null)) {
    return { allowed: false, reason: 'premium_required' }
  }

  return { allowed: true }
}

export function getPremiumAccessError(reason: PremiumAccessDenialReason): PremiumAccessError {
  if (reason === 'unauthenticated') {
    return { status: 401, error: 'Non authentifié.' }
  }

  if (reason === 'forbidden') {
    return { status: 403, error: 'Enfant introuvable ou accès refusé.' }
  }

  return { status: 403, error: 'Abonnement premium requis pour ce module.' }
}
