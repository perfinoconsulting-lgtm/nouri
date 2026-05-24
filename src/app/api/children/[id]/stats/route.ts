/**
 * app/api/children/[id]/stats/route.ts -- Stats d'activite pour le calendrier GitHub
 *
 * Retourne les 84 derniers jours de sessions pour l'enfant
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 })

    // Securite : verifier appartenance
    const { data: child, error: ownerError } = await supabase
      .from('children')
      .select('id')
      .eq('id', params.id)
      .eq('parent_id', session.user.id)
      .single()

    if (ownerError || !child) {
      return NextResponse.json({ error: 'Acces refuse.' }, { status: 403 })
    }

    // 84 jours en arriere
    const since = new Date()
    since.setDate(since.getDate() - 84)

    const { data: progress, error } = await supabase
      .from('progress')
      .select('updated_at, score')
      .eq('child_id', params.id)
      .gte('updated_at', since.toISOString())
      .order('updated_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la recuperation des stats.' }, { status: 500 })
    }

    // Agreger par jour (approximation : chaque entree de progres = ~2 min de travail)
    const dayMap: Record<string, { duration_seconds: number; correct_answers: number; items_reviewed: number }> = {}

    ;(progress ?? []).forEach((p) => {
      const day = new Date(p.updated_at).toISOString().split('T')[0]
      if (!dayMap[day]) {
        dayMap[day] = { duration_seconds: 0, correct_answers: 0, items_reviewed: 0 }
      }
      dayMap[day].duration_seconds += 120 // 2 min par entree de progres (estimation)
      dayMap[day].items_reviewed += 1
      if (p.score >= 80) dayMap[day].correct_answers += 1
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
