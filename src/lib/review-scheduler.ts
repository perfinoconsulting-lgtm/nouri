// Planification des sessions de révision — sélection et enrichissement des items
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { LETTERS, LEARNING_ORDER } from '@/lib/data/letters'
import { SYLLABES } from '@/lib/data/syllabes'
import { MOTS } from '@/lib/data/mots'
import { SOURATES } from '@/lib/data/sourates'
import type { ReviewItem } from '@/lib/spaced-repetition'

export interface ReviewStats {
  dueNow: number
  dueToday: number
  masteredTotal: number
  inProgress: number
  neverSeen: number
  nextReviewAt: Date | null
}

export interface ReviewSession {
  items: ReviewItem[]
  totalDue: number
  newItems: number
  reviewItems: number
  estimatedMinutes: number
}

// Ligne de progression retournée par Supabase
interface ProgressRow {
  item_id: string
  item_type: 'lettre' | 'syllabe' | 'mot' | 'verset'
  score: number
  step: number
  next_review: string
  mastered: boolean
  last_seen: string | null
  attempts: number
}

type ItemType = ReviewItem['itemType']
type ItemCandidate = { itemId: string; itemType: ItemType }
type ItemData = { ar: string; fr: string; emoji?: string } | null

// Récupère les données textuelles d'un item depuis les fichiers de données statiques
function lookupItemData(itemType: ItemType, itemId: string): ItemData {
  switch (itemType) {
    case 'lettre': {
      const letter = LETTERS.find((l) => l.index === parseInt(itemId, 10))
      if (!letter) return null
      return { ar: letter.ar, fr: letter.nom, emoji: letter.emoji }
    }
    case 'syllabe': {
      const syllabe = SYLLABES.find((s) => s.id === itemId)
      if (!syllabe) return null
      return { ar: syllabe.ar, fr: syllabe.transliteration }
    }
    case 'mot': {
      const mot = MOTS.find((m) => m.id === itemId)
      if (!mot) return null
      return { ar: mot.ar, fr: mot.fr, emoji: mot.emoji }
    }
    case 'verset': {
      // itemId format : "slug-sourate:numeroVerset", ex : "al-ikhlas:1"
      const colonIdx = itemId.indexOf(':')
      const sourateSlug = itemId.slice(0, colonIdx)
      const versetNumero = parseInt(itemId.slice(colonIdx + 1), 10)
      const sourate = SOURATES.find((s) => s.slug === sourateSlug)
      if (!sourate) return null
      const verset = sourate.versets.find((v) => v.numero === versetNumero)
      if (!verset) return null
      return { ar: verset.ar, fr: verset.fr }
    }
  }
}

// Transforme une ligne de progression DB en ReviewItem enrichi
function enrichProgressRow(row: ProgressRow): ReviewItem | null {
  const data = lookupItemData(row.item_type, row.item_id)
  if (!data) return null
  return {
    itemId: row.item_id,
    itemType: row.item_type,
    ar: data.ar,
    fr: data.fr,
    emoji: data.emoji,
    score: row.score,
    step: row.step,
    nextReview: new Date(row.next_review),
    mastered: row.mastered,
    lastSeen: row.last_seen ? new Date(row.last_seen) : new Date(0),
  }
}

// Construit un ReviewItem vierge pour un item jamais vu
function buildNewReviewItem(candidate: ItemCandidate): ReviewItem | null {
  const data = lookupItemData(candidate.itemType, candidate.itemId)
  if (!data) return null
  return {
    itemId: candidate.itemId,
    itemType: candidate.itemType,
    ar: data.ar,
    fr: data.fr,
    emoji: data.emoji,
    score: 0,
    step: 0,
    nextReview: new Date(),
    mastered: false,
    lastSeen: new Date(0),
  }
}

// Mélange Fisher-Yates en place
function fisherYatesShuffle<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

// Liste globale de tous les items dans l'ordre pédagogique
// Lettres (par LEARNING_ORDER) → syllabes → mots → versets
function getAllItemsOrdered(): ItemCandidate[] {
  const lettresOrdered = LEARNING_ORDER.map((idx) => ({
    itemId: idx.toString(),
    itemType: 'lettre' as const,
  }))
  const syllabes = SYLLABES.map((s) => ({
    itemId: s.id,
    itemType: 'syllabe' as const,
  }))
  const mots = MOTS.map((m) => ({
    itemId: m.id,
    itemType: 'mot' as const,
  }))
  const versets = SOURATES.flatMap((s) =>
    s.versets.map((v) => ({
      itemId: `${s.slug}:${v.numero}`,
      itemType: 'verset' as const,
    }))
  )
  return [...lettresOrdered, ...syllabes, ...mots, ...versets]
}

export async function getItemsDueForReview(
  childId: string,
  limit = 10
): Promise<ReviewItem[]> {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('progress')
    .select('item_id, item_type, score, step, next_review, mastered, last_seen, attempts')
    .eq('child_id', childId)
    .eq('mastered', false)
    .lte('next_review', new Date().toISOString())
    .order('next_review', { ascending: true })
    .limit(limit)

  const rows = (data ?? []) as ProgressRow[]
  return rows.map(enrichProgressRow).filter((item): item is ReviewItem => item !== null)
}

export async function getReviewStats(childId: string): Promise<ReviewStats> {
  const supabase = await createServerSupabaseClient()

  const now = new Date()
  const endOfDay = new Date(now)
  endOfDay.setUTCHours(23, 59, 59, 999)

  const { data } = await supabase
    .from('progress')
    .select('mastered, next_review, attempts')
    .eq('child_id', childId)

  const rows = (data ?? []) as Array<{
    mastered: boolean
    next_review: string
    attempts: number
  }>

  const dueNow = rows.filter(
    (r) => !r.mastered && new Date(r.next_review) <= now
  ).length

  const dueToday = rows.filter(
    (r) => !r.mastered && new Date(r.next_review) <= endOfDay
  ).length

  const masteredTotal = rows.filter((r) => r.mastered).length

  // Items commencés mais pas encore maîtrisés
  const inProgress = rows.filter((r) => !r.mastered && r.attempts > 0).length

  const totalItems =
    LETTERS.length +
    SYLLABES.length +
    MOTS.length +
    SOURATES.reduce((acc, s) => acc + s.versets.length, 0)

  // Items jamais vus = total − lignes existantes en DB
  const neverSeen = Math.max(0, totalItems - rows.length)

  const futureReviews = rows
    .filter((r) => !r.mastered && new Date(r.next_review) > now)
    .map((r) => new Date(r.next_review))

  const nextReviewAt =
    futureReviews.length > 0
      ? futureReviews.reduce((min, d) => (d < min ? d : min))
      : null

  return { dueNow, dueToday, masteredTotal, inProgress, neverSeen, nextReviewAt }
}

export async function buildReviewSession(childId: string): Promise<ReviewSession> {
  const supabase = await createServerSupabaseClient()

  const reviewItems = await getItemsDueForReview(childId, 10)

  let newItems: ReviewItem[] = []

  if (reviewItems.length < 5) {
    // Compléter avec des items jamais vus, dans l'ordre pédagogique
    const { data: seenData } = await supabase
      .from('progress')
      .select('item_id, item_type')
      .eq('child_id', childId)

    const seen = new Set(
      ((seenData ?? []) as Array<{ item_id: string; item_type: string }>).map(
        (r) => `${r.item_type}:${r.item_id}`
      )
    )

    const needed = 10 - reviewItems.length
    const candidates = getAllItemsOrdered()
      .filter((c) => !seen.has(`${c.itemType}:${c.itemId}`))
      .slice(0, needed)

    newItems = candidates
      .map(buildNewReviewItem)
      .filter((item): item is ReviewItem => item !== null)
  }

  const allItems = [...reviewItems, ...newItems]
  fisherYatesShuffle(allItems)

  return {
    items: allItems,
    totalDue: reviewItems.length,
    newItems: newItems.length,
    reviewItems: reviewItems.length,
    estimatedMinutes: Math.ceil(allItems.length * 40 / 60),
  }
}
