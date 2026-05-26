import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createOrGetCustomer, createCheckoutSession } from '@/lib/stripe'

export async function POST(req: Request) {
  try {
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

    // Vérification ownership — la RLS garantit l'isolation en base
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id')
      .eq('id', childId)
      .eq('parent_id', session.user.id)
      .single()

    if (childError || !child) {
      return NextResponse.json(
        { error: 'Enfant introuvable ou accès non autorisé.' },
        { status: 403 }
      )
    }

    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .select('email, prenom')
      .eq('id', session.user.id)
      .single()

    if (parentError || !parent) {
      return NextResponse.json({ error: 'Profil parent introuvable.' }, { status: 404 })
    }

    const priceId = process.env.STRIPE_PRICE_ID
    if (!priceId) {
      return NextResponse.json(
        { error: 'Configuration Stripe incomplète. Contactez le support.' },
        { status: 500 }
      )
    }

    const customer = await createOrGetCustomer(session.user.id, parent.email, parent.prenom)
    const { url } = await createCheckoutSession(customer.id, childId, session.user.id, priceId)

    return NextResponse.json({ url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('Checkout API error:', message)
    return NextResponse.json(
      { error: `Une erreur est survenue : ${message}` },
      { status: 500 }
    )
  }
}
