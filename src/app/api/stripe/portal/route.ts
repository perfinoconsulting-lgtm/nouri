import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createPortalSession } from '@/lib/stripe'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder au portail.' },
        { status: 401 }
      )
    }

    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single()

    if (parentError || !parent) {
      return NextResponse.json({ error: 'Profil parent introuvable.' }, { status: 404 })
    }

    if (!parent.stripe_customer_id) {
      return NextResponse.json(
        { error: "Aucun abonnement trouvé. Veuillez d'abord souscrire à un abonnement." },
        { status: 400 }
      )
    }

    const { url } = await createPortalSession(parent.stripe_customer_id)

    return NextResponse.json({ url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('Portal API error:', message)
    return NextResponse.json(
      { error: `Une erreur est survenue : ${message}` },
      { status: 500 }
    )
  }
}
