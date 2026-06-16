import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSourateBySlug } from '@/lib/data/sourates'
import { getPremiumAccessError, getPremiumChildAccess } from '@/lib/premium-access'
import { z } from 'zod'

// Schéma de validation
const sourateProgressSchema = z.object({
  childId: z.string().uuid('ID enfant invalide'),
  sourateSlug: z.string().min(1, 'Slug sourate requis'),
  versetNumero: z.number().int().min(1, 'Numéro de verset invalide'),
  wasCorrect: z.boolean(),
  mode: z.enum(['apprentissage', 'qcm', 'recitation']),
})

// Seuil de maîtrise plus élevé que l'alphabet — les sourates demandent plus de répétitions
const SEUIL_MASTERED = 85

function calculateStreak(startedAts: string[]): number {
  if (!startedAts.length) return 0
  const uniqueDays = Array.from(
    new Set(startedAts.map((s) => new Date(s).toISOString().split('T')[0])),
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
    const parsed = sourateProgressSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides' }, { status: 400 })
    }

    const { childId, sourateSlug, versetNumero, wasCorrect, mode } = parsed.data

    // 3. Ownership : l'enfant appartient bien à ce parent
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id')
      .eq('id', childId)
      .eq('parent_id', parentId)
      .single()

    if (childError || !child) {
      return NextResponse.json({ error: 'Enfant introuvable ou accès refusé.' }, { status: 403 })
    }

    const premiumAccess = await getPremiumChildAccess(childId)
    if (!premiumAccess.allowed) {
      const accessError = getPremiumAccessError(premiumAccess.reason)
      return NextResponse.json({ error: accessError.error }, { status: accessError.status })
    }

    // 4. Validation contre les données statiques — jamais de texte coranique inconnu
    const sourate = getSourateBySlug(sourateSlug)
    if (!sourate) {
      return NextResponse.json({ error: `Sourate "${sourateSlug}" introuvable.` }, { status: 404 })
    }

    const verset = sourate.versets.find((v) => v.numero === versetNumero)
    if (!verset) {
      return NextResponse.json(
        { error: `Verset ${versetNumero} introuvable dans la sourate "${sourateSlug}".` },
        { status: 404 },
      )
    }

    // 5. Résolution UUID dans content_items
    // Format : "sourate_al-ikhlas_v1", "sourate_al-fatiha_v3"
    const contenuAr = `sourate_${sourateSlug}_v${versetNumero}`
    const { data: item } = await supabase
      .from('content_items')
      .select('id')
      .eq('type', 'sourate')
      .eq('contenu_ar', contenuAr)
      .maybeSingle()

    if (!item) {
      return NextResponse.json(
        { error: `Contenu introuvable : ${contenuAr}` },
        { status: 404 },
      )
    }

    const itemUuid: string = item.id

    // 6. Progression actuelle
    const { data: currentProgress } = await supabase
      .from('progress')
      .select('*')
      .eq('child_id', childId)
      .eq('item_id', itemUuid)
      .maybeSingle()

    // 7. Calcul du nouveau score
    // Les sourates nécessitent plus de répétitions — progression plus lente
    const oldScore: number = currentProgress?.score ?? 0
    let newScore = oldScore

    if (wasCorrect) {
      // Bonus selon le mode : récitation = maîtrise plus élevée
      const gain = mode === 'recitation' ? 20 : mode === 'apprentissage' ? 15 : 10
      newScore = Math.min(100, oldScore + gain)
    } else {
      // Pénalité modérée — les sourates sont difficiles
      newScore = Math.max(0, oldScore - 10)
    }

    // 8. Étapes de répétition espacée
    const now = new Date()
    let newStep = 0
    let mastered = false
    let nextReview = new Date(now.getTime() + 1 * 60 * 60 * 1000)

    if (wasCorrect) {
      const currentStep: number = currentProgress?.step ?? -1
      newStep = Math.min(4, currentStep + 1)

      if (newStep === 0)      nextReview = new Date(now.getTime() + 1 * 60 * 60 * 1000)
      else if (newStep === 1) nextReview = new Date(now.getTime() + 6 * 60 * 60 * 1000)
      else if (newStep === 2) nextReview = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      else if (newStep === 3) nextReview = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      else                    nextReview = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    } else {
      newStep = 0
      nextReview = new Date(now.getTime() + 1 * 60 * 60 * 1000)
    }

    // Seuil de maîtrise plus élevé que l'alphabet (85 vs 80)
    mastered = newScore >= SEUIL_MASTERED

    // 9. Streak pour les étoiles
    const { data: sessions } = await supabase
      .from('sessions')
      .select('started_at')
      .eq('child_id', childId)
      .order('started_at', { ascending: false })

    const startedAts = sessions
      ? (sessions as { started_at: string }[]).map((s) => s.started_at)
      : []
    const streak = calculateStreak(startedAts)

    // 10. Attribution des étoiles
    let earnedStars = 0
    if (wasCorrect) {
      if (mode === 'recitation' && streak >= 5) earnedStars = 3
      else if (mode === 'recitation') earnedStars = 2
      else earnedStars = 1
    }

    // 11. Compteurs
    const attempts: number = (currentProgress?.attempts ?? 0) + 1
    const correctAnswersCount: number = (currentProgress?.correct_answers ?? 0) + (wasCorrect ? 1 : 0)

    // 12. Upsert progression
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
      console.error('[Progress Sourates API] Erreur upsert :', upsertError)
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde.' }, { status: 500 })
    }

    // 13. Mise à jour last_active + niveau
    await supabase.from('children').update({ last_active: now.toISOString() }).eq('id', childId)
    await supabase.rpc('calculate_level', { target_child_id: childId })

    return NextResponse.json({ newScore, step: newStep, nextReview: nextReview.toISOString(), mastered, earnedStars })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('POST /api/progress/sourates:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
