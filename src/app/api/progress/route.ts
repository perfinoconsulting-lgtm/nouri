/**
 * app/api/progress/route.ts — Enregistrement de la progression et de la récurrence espacée (SM-2 simplifié)
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { LETTERS } from '@/lib/data/letters'
import { z } from 'zod'
import { type SupabaseClient } from '@supabase/supabase-js'

// Schéma de validation pour le corps de la requête
const progressSchema = z.object({
  childId: z.string().uuid('ID enfant invalide'),
  itemId: z.string().min(1, 'ID item requis'),
  wasCorrect: z.boolean(),
  responseTimeMs: z.number().int().min(0),
})

/**
 * Résout l'identifiant symbolique de l'item en UUID réel dans la base de données
 */
async function resolveItemUuid(supabase: SupabaseClient, itemId: string): Promise<string | null> {
  // Format attendu pour les lettres : "lettre_X"
  if (itemId.startsWith('lettre_')) {
    const idx = parseInt(itemId.replace('lettre_', ''), 10)
    if (isNaN(idx)) return null

    const letter = LETTERS.find((l) => l.index === idx)
    if (!letter) return null

    // Utilisation de la forme isolée comme clé de recherche
    const letterChar = letter.formes?.isol || letter.ar

    const { data, error } = await supabase
      .from('content_items')
      .select('id')
      .eq('type', 'lettre')
      .eq('contenu_ar', letterChar)
      .maybeSingle()

    if (error || !data) {
      console.warn(`[Progress API] Item non trouvé dans la base pour la lettre ${letterChar}:`, error)
      return null
    }

    return data.id
  }

  // Autres formats possibles, ex: "syllabe_ba"
  if (itemId.startsWith('syllabe_')) {
    const contenuAr = itemId.replace('syllabe_', '')
    const { data } = await supabase
      .from('content_items')
      .select('id')
      .eq('type', 'syllabe')
      .eq('contenu_ar', contenuAr)
      .maybeSingle()

    return data?.id || null
  }

  // Autres formats possibles, ex: "mot_pere"
  if (itemId.startsWith('mot_')) {
    const contenuAr = itemId.replace('mot_', '')
    const { data } = await supabase
      .from('content_items')
      .select('id')
      .eq('type', 'mot')
      .eq('contenu_ar', contenuAr)
      .maybeSingle()

    return data?.id || null
  }

  // Si itemId est déjà un UUID valide
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(itemId)) {
    return itemId
  }

  return null
}

/**
 * Calcule le streak d'activité d'un enfant en jours consécutifs
 */
function calculateStreak(startedAts: string[]): number {
  if (!startedAts.length) return 0

  const uniqueDays = Array.from(
    new Set(startedAts.map((s) => new Date(s).toISOString().split('T')[0]))
  ).sort().reverse()

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
    const supabase = await createServerSupabaseClient()

    // 1. Authentification
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const parentId = session.user.id

    // 2. Validation du body
    const body: unknown = await req.json()
    const parsed = progressSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { childId, itemId, wasCorrect, responseTimeMs } = parsed.data

    // 3. Vérification de la sécurité : l'enfant appartient bien au parent
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id')
      .eq('id', childId)
      .eq('parent_id', parentId)
      .single()

    if (childError || !child) {
      return NextResponse.json({ error: 'Enfant introuvable ou accès refusé.' }, { status: 403 })
    }

    // 4. Résolution de l'item ID
    const itemUuid = await resolveItemUuid(supabase, itemId)
    if (!itemUuid) {
      return NextResponse.json({ error: "Item introuvable dans le catalogue." }, { status: 404 })
    }

    // 5. Lecture de l'entrée de progression actuelle
    const { data: currentProgress } = await supabase
      .from('progress')
      .select('*')
      .eq('child_id', childId)
      .eq('item_id', itemUuid)
      .maybeSingle()

    // 6. Calcul du nouveau score
    const oldScore = currentProgress?.score ?? 0
    let newScore = oldScore

    if (wasCorrect) {
      if (responseTimeMs < 3000) {
        newScore = Math.min(100, oldScore + 20)
      } else if (responseTimeMs < 10000) {
        newScore = Math.min(100, oldScore + 10)
      } else {
        newScore = Math.min(100, oldScore + 5)
      }
    } else {
      newScore = Math.max(0, oldScore - 15)
    }

    // 7. Calcul du step et du nextReview (Répétition Espacée)
    let newStep = 0
    let mastered = false
    const now = new Date()
    let nextReview = new Date(now.getTime() + 1 * 60 * 60 * 1000) // Par défaut : +1h

    if (wasCorrect) {
      const currentStep = currentProgress ? (currentProgress.step ?? 0) : -1
      newStep = Math.min(4, currentStep + 1)

      if (newStep === 0) {
        nextReview = new Date(now.getTime() + 1 * 60 * 60 * 1000) // +1h
      } else if (newStep === 1) {
        nextReview = new Date(now.getTime() + 6 * 60 * 60 * 1000) // +6h
      } else if (newStep === 2) {
        nextReview = new Date(now.getTime() + 24 * 60 * 60 * 1000) // +24h
      } else if (newStep === 3) {
        nextReview = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // +3 jours
      } else {
        nextReview = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // +7 jours
        mastered = true
      }
    } else {
      newStep = 0
      mastered = false
      nextReview = new Date(now.getTime() + 1 * 60 * 60 * 1000) // +1h si erreur
    }

    // 8. Calcul du streak de l'enfant pour attribuer les étoiles
    const { data: sessions } = await supabase
      .from('sessions')
      .select('started_at')
      .eq('child_id', childId)
      .order('started_at', { ascending: false })

    const startedAts = sessions ? (sessions as { started_at: string }[]).map((s) => s.started_at) : []
    const streak = calculateStreak(startedAts)

    // 9. Attribution des étoiles
    let earnedStars = 0
    if (wasCorrect) {
      if (responseTimeMs < 3000 && streak >= 5) {
        earnedStars = 3
      } else if (responseTimeMs < 3000) {
        earnedStars = 2
      } else {
        earnedStars = 1
      }
    } else {
      earnedStars = 0
    }

    // 10. Incrémenter les compteurs de tentatives
    const attempts = (currentProgress?.attempts ?? 0) + 1
    const correctAnswersCount = (currentProgress?.correct_answers ?? 0) + (wasCorrect ? 1 : 0)

    // 11. Upsert dans la table progress
    const { error: upsertError } = await supabase
      .from('progress')
      .upsert({
        id: currentProgress?.id || undefined, // si l'entrée existe déjà, on l'écrase
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
      console.error('[Progress API] Erreur lors de l\'upsert :', upsertError)
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde de la progression.' }, { status: 500 })
    }

    // 12. Mettre à jour last_active de l'enfant
    await supabase
      .from('children')
      .update({ last_active: now.toISOString() })
      .eq('id', childId)

    // Recalculer le niveau de l'enfant
    await supabase.rpc('calculate_level', { target_child_id: childId })

    // 13. Retourner la réponse
    return NextResponse.json({
      newScore,
      step: newStep,
      nextReview: nextReview.toISOString(),
      mastered,
      earnedStars,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('POST /api/progress:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
