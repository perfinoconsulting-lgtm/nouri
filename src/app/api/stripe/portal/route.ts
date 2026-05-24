/**
 * app/api/stripe/portal/route.ts — Accès au Customer Portal Stripe
 *
 * Variables d'environnement requises :
 *   STRIPE_SECRET_KEY
 *   NEXT_PUBLIC_APP_URL
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createPortalSession } from '@/lib/stripe'

export async function POST() {
  try {
    // 1. Vérifier l'authentification Supabase
    const supabase = createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder au portail.' },
        { status: 401 }
      )
    }

    // 2. Récupérer le stripe_customer_id du parent
    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single()

    if (parentError || !parent) {
      return NextResponse.json(
        { error: 'Profil parent introuvable.' },
        { status: 404 }
      )
    }

    if (!parent.stripe_customer_id) {
      return NextResponse.json(
        {
          error:
            "Aucun abonnement trouvé. Veuillez d'abord souscrire à un abonnement.",
        },
        { status: 400 }
      )
    }

    // 3. Créer la session Customer Portal
    const portalUrl = await createPortalSession(parent.stripe_customer_id)

    // 4. Retourner l'URL (le client fait la redirection)
    return NextResponse.json({ url: portalUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('❌ Portal API Error:', message)
    return NextResponse.json(
      { error: `Une erreur est survenue : ${message}` },
      { status: 500 }
    )
  }
}
