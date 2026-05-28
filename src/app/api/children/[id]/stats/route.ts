/**
 * app/api/children/[id]/stats/route.ts -- Stats d'activite pour le calendrier GitHub
 *
 * Retourne les 84 derniers jours de sessions pour l'enfant
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 })

    // Securite : verifier appartenance
    const { data: child, error: ownerError } = await supabase
      .from('children')
      .select('id')
      .eq('id', id)
      .eq('parent_id', session.user.id)
      .single()

    if (ownerError || !child) {
      return NextResponse.json({ error: 'Acces refuse.' }, { status: 403 })
    }

    // 84 jours en arriere
    const since = new Date()
    since.setDate(since.getDate() - 84)

    const { data: sessionsData, error } = await supabase
      .from('sessions')
      .select('started_at, duration_seconds, correct_answers, items_reviewed')
      .eq('child_id', id)
      .gte('started_at', since.toISOString())
      .order('started_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la recuperation des stats.' }, { status: 500 })
    }

    // Agreger par jour
    const dayMap: Record<string, { duration_seconds: number; correct_answers: number; items_reviewed: number }> = {}

    ;(sessionsData ?? []).forEach((s) => {
      const day = new Date(s.started_at).toISOString().split('T')[0]
      if (!dayMap[day]) {
        dayMap[day] = { duration_seconds: 0, correct_answers: 0, items_reviewed: 0 }
      }
      dayMap[day].duration_seconds += s.duration_seconds ?? 0
      dayMap[day].items_reviewed += s.items_reviewed ?? 0
      dayMap[day].correct_answers += s.correct_answers ?? 0
    })

    const sessions = Object.entries(dayMap).map(([date, stats]) => ({
      date,
      ...stats,
    }))

    return NextResponse.json({ sessions })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
