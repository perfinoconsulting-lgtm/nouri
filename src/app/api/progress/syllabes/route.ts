/**
 * app/api/progress/syllabes/route.ts — Progression dédiée aux syllabes arabes
 *
 * Enregistre le résultat d'un exercice sur une syllabe identifiée par son format
 * "syllabe_ba", "syllabe_bi", etc. Applique l'algorithme SM-2 simplifié identique
 * à /api/progress/route.ts.
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Schéma de validation strict
const syllabeProgressSchema = z.object({
  childId: z.string().uuid('ID enfant invalide'),
  syllabeId: z
    .string()
    .regex(/^syllabe_/, 'Format syllabeId invalide — exemple attendu : syllabe_ba'),
  wasCorrect: z.boolean(),
  responseTimeMs: z.number().int().min(0),
})

// Calcule le streak de jours consécutifs d'un enfant
function calculateStreak(startedAts: string[]): number {
  if (!startedAts.length) return 0

  const uniqueDays = Array.from(
    new Set(startedAts.map((s) => new Date(s).toISOString().split('T')[0])),
  )
    .sort()
    .reverse()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const mostRecent = uniqueDays[0]
  if (mostRecent !== todayStr && mostRecent !== yesterdayStr) return 0

  let streak = 0
  let cursor = mostRecent
  for (const day of uniqueDays) {
    if (day === cursor) {
      streak++
      const d = new Date(cursor)
      d.setDate(d.getDate() - 1)
      cursor = d.toISOString().split('T')[0]
    } else {
      break
    }
  }

  return streak
}

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabaseClient()

    // 1. Authentification
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }
    const parentId = session.user.id

    // 2. Validation du body
    const body: unknown = await req.json()
    const parsed = syllabeProgressSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      )
    }

    const { childId, syllabeId, wasCorrect, responseTimeMs } = parsed.data

    // 3. Vérification ownership : l'enfant appartient bien à ce parent
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id')
      .eq('id', childId)
      .eq('parent_id', parentId)
      .single()

    if (childError || !child) {
      return NextResponse.json(
        { error: 'Enfant introuvable ou accès refusé.' },
        { status: 403 },
      )
    }

    // 4. Résolution de la syllabe dans content_items
    // Le format "syllabe_ba" → contenu_ar = "ba" dans la table content_items (type = 'syllabe')
    const contenuAr = syllabeId.replace('syllabe_', '')
    const { data: item } = await supabase
      .from('content_items')
      .select('id')
      .eq('type', 'syllabe')
      .eq('contenu_ar', contenuAr)
      .maybeSingle()

    if (!item) {
      return NextResponse.json(
        { error: `Syllabe "${contenuAr}" introuvable dans le catalogue.` },
        { status: 404 },
      )
    }

    const itemUuid: string = item.id

    // 5. Lecture de la progression actuelle
    const { data: currentProgress } = await supabase
      .from('progress')
      .select('*')
      .eq('child_id', childId)
      .eq('item_id', itemUuid)
      .maybeSingle()

    // 6. Calcul du nouveau score (SM-2 simplifié)
    const oldScore: number = currentProgress?.score ?? 0
    let newScore = oldScore

    if (wasCorrect) {
      if (responseTimeMs < 3_000) {
        newScore = Math.min(100, oldScore + 20)
      } else if (responseTimeMs < 10_000) {
        newScore = Math.min(100, oldScore + 10)
      } else {
        newScore = Math.min(100, oldScore + 5)
      }
    } else {
      newScore = Math.max(0, oldScore - 15)
    }

    // 7. Calcul de l'étape et de la prochaine révision (répétition espacée)
    const now = new Date()
    let newStep = 0
    let mastered = false
    let nextReview = new Date(now.getTime() + 1 * 60 * 60 * 1000) // +1h par défaut

    if (wasCorrect) {
      const currentStep: number = currentProgress?.step ?? -1
      newStep = Math.min(4, currentStep + 1)

      if (newStep === 0) {
        nextReview = new Date(now.getTime() + 1 * 60 * 60 * 1000)       // +1h
      } else if (newStep === 1) {
        nextReview = new Date(now.getTime() + 6 * 60 * 60 * 1000)       // +6h
      } else if (newStep === 2) {
        nextReview = new Date(now.getTime() + 24 * 60 * 60 * 1000)      // +24h
      } else if (newStep === 3) {
        nextReview = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)  // +3 jours
      } else {
        nextReview = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)  // +7 jours
        mastered = true
      }
    } else {
      newStep = 0
      mastered = false
      nextReview = new Date(now.getTime() + 1 * 60 * 60 * 1000)
    }

    // 8. Calcul du streak pour l'attribution des étoiles
    const { data: sessions } = await supabase
      .from('sessions')
      .select('started_at')
      .eq('child_id', childId)
      .order('started_at', { ascending: false })

    const startedAts = sessions
      ? (sessions as { started_at: string }[]).map((s) => s.started_at)
      : []
    const streak = calculateStreak(startedAts)

    // 9. Attribution des étoiles
    let earnedStars = 0
    if (wasCorrect) {
      if (responseTimeMs < 3_000 && streak >= 5) {
        earnedStars = 3
      } else if (responseTimeMs < 3_000) {
        earnedStars = 2
      } else {
        earnedStars = 1
      }
    }

    // 10. Compteurs de tentatives
    const attempts: number = (currentProgress?.attempts ?? 0) + 1
    const correctAnswersCount: number =
      (currentProgress?.correct_answers ?? 0) + (wasCorrect ? 1 : 0)

    // 11. Upsert dans la table progress
    const { error: upsertError } = await supabase.from('progress').upsert({
      id: currentProgress?.id,
      child_id: childId,
      item_id: itemUuid,
      score: newScore,
      step: newStep,
      next_review: nextReview.toISOString(),
      mastered,
      attempts,
      correct_answers: correctAnswersCount,
      last_seen: now.toISOString(),
    })

    if (upsertError) {
      console.error('[Progress Syllabes API] Erreur upsert :', upsertError)
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde de la progression.' },
        { status: 500 },
      )
    }

    // 12. Mise à jour last_active de l'enfant
    await supabase
      .from('children')
      .update({ last_active: now.toISOString() })
      .eq('id', childId)

    // Recalcul du niveau de l'enfant
    await supabase.rpc('calculate_level', { target_child_id: childId })

    // 13. Réponse
    return NextResponse.json({
      newScore,
      step: newStep,
      nextReview: nextReview.toISOString(),
      mastered,
      earnedStars,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('POST /api/progress/syllabes:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
