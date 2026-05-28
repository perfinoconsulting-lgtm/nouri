// Route API révisions — stats et session pour l'enfant connecté
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getReviewStats, buildReviewSession } from '@/lib/review-scheduler'

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const childId = searchParams.get('childId')
    const wantStats = searchParams.get('stats') === 'true'

    if (!childId) {
      return NextResponse.json({ error: 'childId requis.' }, { status: 400 })
    }

    // Vérification ownership : l'enfant appartient bien à ce parent
    const { data: child, error: ownerError } = await supabase
      .from('children')
      .select('id')
      .eq('id', childId)
      .eq('parent_id', session.user.id)
      .single()

    if (ownerError || !child) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    if (wantStats) {
      const stats = await getReviewStats(childId)
      return NextResponse.json(stats)
    }

    const reviewSession = await buildReviewSession(childId)
    return NextResponse.json(reviewSession)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
