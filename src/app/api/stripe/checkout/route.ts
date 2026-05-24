/**
 * app/api/stripe/checkout/route.ts — Création de session Stripe Checkout
 *
 * Variables d'environnement requises :
 *   STRIPE_SECRET_KEY
 *   STRIPE_PRICE_ID        → ID du tarif 2€/mois
 *   NEXT_PUBLIC_APP_URL
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createOrGetCustomer, createCheckoutSession } from '@/lib/stripe'

export async function POST(req: Request) {
  try {
    // 1. Vérifier l'authentification Supabase
    const supabase = createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour souscrire un abonnement.' },
        { status: 401 }
      )
    }

    // 2. Valider le body
    let body: { childId?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Corps de la requête invalide.' }, { status: 400 })
    }

    const { childId } = body
    if (!childId) {
      return NextResponse.json(
        { error: "L'identifiant de l'enfant est requis." },
        { status: 400 }
      )
    }

    // 3. Vérifier que l'enfant appartient bien à ce parent (sécurité RLS)
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id, prenom')
      .eq('id', childId)
      .eq('parent_id', session.user.id)
      .single()

    if (childError || !child) {
      return NextResponse.json(
        { error: 'Enfant introuvable ou accès non autorisé.' },
        { status: 403 }
      )
    }

    // 4. Récupérer les infos du parent
    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .select('email, prenom')
      .eq('id', session.user.id)
      .single()

    if (parentError || !parent) {
      return NextResponse.json(
        { error: 'Profil parent introuvable.' },
        { status: 404 }
      )
    }

    // 5. Vérifier la config Stripe
    const priceId = process.env.STRIPE_PRICE_ID
    if (!priceId) {
      return NextResponse.json(
        { error: 'Configuration Stripe incomplète. Contactez le support.' },
        { status: 500 }
      )
    }

    // 6. Créer ou récupérer le Customer Stripe
    const customerId = await createOrGetCustomer(
      session.user.id,
      parent.email,
      parent.prenom
    )

    // 7. Créer la session Checkout
    const checkoutUrl = await createCheckoutSession(
      customerId,
      childId,
      session.user.id,
      priceId
    )

    // 8. Retourner l'URL (le client fait la redirection)
    return NextResponse.json({ url: checkoutUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('❌ Checkout API Error:', message)
    return NextResponse.json(
      { error: `Une erreur est survenue : ${message}` },
      { status: 500 }
    )
  }
}
