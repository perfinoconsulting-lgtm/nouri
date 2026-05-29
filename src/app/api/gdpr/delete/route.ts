import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { createHash } from 'crypto'

// Client Supabase admin (bypasse la RLS — nécessaire pour supprimer l'utilisateur auth)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Configuration Supabase admin manquante.')
  }

  return createClient(url, key)
}

export async function DELETE() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const parentId = session.user.id
    const supabaseAdmin = getSupabaseAdmin()

    // ── Étape 1 : Annuler les abonnements Stripe actifs ──────────────────────
    // On continue même si Stripe est indisponible
    try {
      const { data: subscriptions } = await supabaseAdmin
        .from('subscriptions')
        .select('stripe_subscription_id, status')
        .eq('parent_id', parentId)
        .in('status', ['active', 'trialing', 'past_due'])

      if (subscriptions && subscriptions.length > 0) {
        await Promise.all(
          subscriptions.map(async (sub) => {
            if (!sub.stripe_subscription_id) return
            try {
              await stripe.subscriptions.cancel(sub.stripe_subscription_id as string)
            } catch (stripeErr: unknown) {
              const msg = stripeErr instanceof Error ? stripeErr.message : 'erreur Stripe'
              console.error(`Stripe annulation échouée pour ${sub.stripe_subscription_id}: ${msg}`)
              // On continue — la suppression des données doit avoir lieu même si Stripe échoue
            }
          })
        )
      }
    } catch (stripeErr: unknown) {
      const msg = stripeErr instanceof Error ? stripeErr.message : 'erreur Stripe'
      console.error('Erreur récupération abonnements Stripe:', msg)
      // On continue la suppression en base
    }

    // ── Étape 2 : Supprimer les fichiers Storage Supabase (dessins enfants) ──
    try {
      const { data: files } = await supabaseAdmin
        .storage
        .from('drawings')
        .list(parentId)

      if (files && files.length > 0) {
        const paths = files.map((f) => `${parentId}/${f.name}`)
        await supabaseAdmin.storage.from('drawings').remove(paths)
      }
    } catch (storageErr: unknown) {
      const msg = storageErr instanceof Error ? storageErr.message : 'erreur storage'
      console.error('Erreur suppression Storage:', msg)
      // Non bloquant
    }

    // ── Étape 3 : Supprimer le parent en base (cascade sur children, progress, sessions) ──
    const { error: deleteParentError } = await supabaseAdmin
      .from('parents')
      .delete()
      .eq('id', parentId)

    if (deleteParentError) {
      console.error('Erreur suppression parent en base:', deleteParentError.message)
      return NextResponse.json({ error: 'Erreur lors de la suppression des données.' }, { status: 500 })
    }

    // ── Étape 4 : Supprimer l'utilisateur Supabase Auth ──────────────────────
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(parentId)

    if (deleteAuthError) {
      console.error('Erreur suppression utilisateur auth:', deleteAuthError.message)
      // Les données en base sont déjà supprimées — on loggue mais on retourne succès
    }

    // ── Étape 5 : Insérer un log d'audit RGPD (hash de l'ID, pas l'email) ───
    // Conservation 3 ans conformément au skill RGPD
    try {
      const userIdHash = createHash('sha256').update(parentId).digest('hex')

      await supabaseAdmin
        .from('deletion_log')
        .insert({
          user_id_hash: userIdHash,
          deleted_at: new Date().toISOString(),
        })
    } catch (logErr: unknown) {
      const msg = logErr instanceof Error ? logErr.message : 'erreur log'
      console.error('Erreur log suppression RGPD:', msg)
      // Non bloquant — la suppression est déjà effectuée
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('DELETE /api/gdpr/delete:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
