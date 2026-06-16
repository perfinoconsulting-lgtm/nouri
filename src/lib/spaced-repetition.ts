// Répétition espacée (algorithme SRS) — cœur du moteur d'apprentissage Lisani
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface ReviewItem {
  itemId: string
  itemType: 'lettre' | 'syllabe' | 'mot' | 'verset'
  ar: string
  fr: string
  emoji?: string
  score: number
  step: number
  nextReview: Date
  mastered: boolean
  lastSeen: Date
}

export interface AnswerResult {
  newScore: number
  newStep: number
  nextReview: Date
  mastered: boolean
  earnedStars: number
  feedback: string
}

// Intervalles de révision en millisecondes, indexés par étape (0-5)
const INTERVALS: Record<number, number> = {
  0: 60 * 60 * 1000,            // 1 heure
  1: 6 * 60 * 60 * 1000,        // 6 heures
  2: 24 * 60 * 60 * 1000,       // 1 jour
  3: 3 * 24 * 60 * 60 * 1000,   // 3 jours
  4: 7 * 24 * 60 * 60 * 1000,   // 7 jours → maîtrisé
  5: 30 * 24 * 60 * 60 * 1000,  // 30 jours (maintenance)
}

export function calculateNextReview(
  currentStep: number,
  wasCorrect: boolean
): { newStep: number; nextReview: Date; mastered: boolean } {
  if (wasCorrect) {
    const newStep = Math.min(currentStep + 1, 5)
    const mastered = newStep >= 5
    const nextReview = new Date(Date.now() + INTERVALS[newStep])
    return { newStep, nextReview, mastered }
  }
  return {
    newStep: 0,
    nextReview: new Date(Date.now() + INTERVALS[0]),
    mastered: false,
  }
}

export function calculateNewScore(score: number, wasCorrect: boolean, ms: number): number {
  if (wasCorrect && ms < 3000) return Math.min(100, score + 20)
  if (wasCorrect && ms < 10000) return Math.min(100, score + 10)
  if (wasCorrect) return Math.min(100, score + 5)
  return Math.max(0, score - 15)
}

export function calculateEarnedStars(wasCorrect: boolean, ms: number, streak: number): number {
  if (wasCorrect && ms < 3000 && streak >= 5) return 3
  if (wasCorrect && ms < 3000) return 2
  if (wasCorrect) return 1
  return 0
}

export function getFeedbackMessage(wasCorrect: boolean, ms: number): string {
  if (wasCorrect && ms < 3000) return 'Excellent ! Tu le sais par cœur ! 🌟'
  if (wasCorrect && ms < 10000) return 'Bravo ! Continue comme ça ! ⭐'
  if (wasCorrect) return 'Bien ! Tu y es arrivé(e) ! 💪'
  return 'Pas grave ! On va réviser ensemble 🔄'
}

interface ProcessAnswerParams {
  childId: string
  itemId: string
  itemType: 'lettre' | 'syllabe' | 'mot' | 'verset'
  wasCorrect: boolean
  responseTimeMs: number
  streak: number
}

interface ExistingProgressRow {
  score: number
  step: number
  attempts: number
}

export async function processAnswer(params: ProcessAnswerParams): Promise<AnswerResult> {
  const { childId, itemId, itemType, wasCorrect, responseTimeMs, streak } = params
  const supabase = await createServerSupabaseClient()

  // Récupérer la progression existante pour cet item
  const { data } = await supabase
    .from('progress')
    .select('score, step, attempts')
    .eq('child_id', childId)
    .eq('item_id', itemId)
    .eq('item_type', itemType)
    .maybeSingle()

  const existing = data as ExistingProgressRow | null
  const currentScore = existing?.score ?? 0
  const currentStep = existing?.step ?? 0
  const attempts = (existing?.attempts ?? 0) + 1

  const newScore = calculateNewScore(currentScore, wasCorrect, responseTimeMs)
  const { newStep, nextReview, mastered } = calculateNextReview(currentStep, wasCorrect)
  const earnedStars = calculateEarnedStars(wasCorrect, responseTimeMs, streak)
  const feedback = getFeedbackMessage(wasCorrect, responseTimeMs)

  // Sauvegarder en UTC — upsert sur la contrainte unique (child_id, item_id, item_type)
  await supabase.from('progress').upsert(
    {
      child_id: childId,
      item_id: itemId,
      item_type: itemType,
      score: newScore,
      step: newStep,
      next_review: nextReview.toISOString(),
      mastered,
      last_seen: new Date().toISOString(),
      attempts,
    },
    { onConflict: 'child_id,item_id,item_type' }
  )

  // Mettre à jour la dernière activité de l'enfant
  await supabase
    .from('children')
    .update({ last_active: new Date().toISOString() })
    .eq('id', childId)

  return { newScore, newStep, nextReview, mastered, earnedStars, feedback }
}
