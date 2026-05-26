/**
 * app/api/children/[id]/progress/route.ts — GET progression de l'enfant
 *
 * Retourne la progression de l'enfant avec les détails de l'item associé (contenu_ar, type).
 * Sécurité : Vérifie que le parent authentifié est le propriétaire du profil de l'enfant.
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()

    // 1. Vérification de l'authentification
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const parentId = session.user.id
    const childId = params.id

    // 2. Vérification de la sécurité : l'enfant appartient bien au parent
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id')
      .eq('id', childId)
      .eq('parent_id', parentId)
      .single()

    if (childError || !child) {
      return NextResponse.json({ error: 'Enfant introuvable ou accès refusé.' }, { status: 403 })
    }

    // 3. Récupération de la progression de l'enfant en joignant content_items
    const { data: progressData, error: progressError } = await supabase
      .from('progress')
      .select(`
        id,
        score,
        step,
        next_review,
        mastered,
        attempts,
        correct_answers,
        content_items (
          id,
          type,
          contenu_ar
        )
      `)
      .eq('child_id', childId)

    if (progressError) {
      console.error('[Child Progress API] Erreur de récupération de la progression :', progressError)
      return NextResponse.json({ error: 'Erreur lors de la récupération de la progression.' }, { status: 500 })
    }

    interface ProgressItemRow {
      id: string
      score: number
      step: number
      next_review: string
      mastered: boolean
      attempts: number
      correct_answers: number
      content_items: {
        id: string
        type: string
        contenu_ar: string
      } | null
    }

    // 4. Aplatir le résultat pour simplifier le mapping côté client
    const progressList = ((progressData as unknown as ProgressItemRow[]) ?? []).map((p) => ({
      id: p.id,
      score: p.score,
      step: p.step,
      next_review: p.next_review,
      mastered: p.mastered,
      attempts: p.attempts,
      correct_answers: p.correct_answers,
      itemId: p.content_items?.id ?? '',
      type: p.content_items?.type ?? '',
      contenu_ar: p.content_items?.contenu_ar ?? '',
    }))

    return NextResponse.json({ progress: progressList })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('GET /api/children/[id]/progress:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
