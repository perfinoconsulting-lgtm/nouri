/**
 * app/api/children/route.ts — GET liste enfants + stats | POST création enfant
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { ChildWithStats, ChildStats, SubscriptionInfo } from '@/types/dashboard'

// Validation Zod pour la création d'un enfant
const createChildSchema = z.object({
  prenom: z.string().min(1, 'Le prénom est requis').max(30, 'Prénom trop long'),
  age: z.number().int().min(4, 'Âge minimum : 4 ans').max(14, 'Âge maximum : 14 ans'),
  avatar: z.string().optional().default('🌙'),
  niveau: z.number().int().min(1).max(5).optional().default(1),
})

// Calcule les jours consécutifs de sessions (série active si aujourd'hui ou hier inclus)
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

  // Série brisée si la dernière session date d'avant-hier ou plus
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

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const parentId = session.user.id

    // Récupérer tous les enfants du parent
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('id, parent_id, prenom, age, avatar, niveau, created_at, last_active')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true })

    if (childrenError) {
      return NextResponse.json({ error: 'Erreur lors de la récupération des enfants.' }, { status: 500 })
    }

    if (!children || children.length === 0) {
      return NextResponse.json({ children: [] })
    }

    const childIds = children.map((c) => c.id as string)

    // Requêtes en parallèle pour les données agrégées
    const [progressResult, sessionsResult, subscriptionsResult] = await Promise.all([
      supabase
        .from('progress')
        .select('child_id, score')
        .in('child_id', childIds),
      supabase
        .from('sessions')
        .select('child_id, started_at, duration_seconds')
        .in('child_id', childIds)
        .order('started_at', { ascending: false }),
      supabase
        .from('subscriptions')
        .select('child_id, status, current_period_end, cancel_at_period_end')
        .in('child_id', childIds),
    ])

    const progressData = progressResult.data ?? []
    const sessionsData = sessionsResult.data ?? []
    const subscriptionsData = subscriptionsResult.data ?? []

    // Assembler les stats pour chaque enfant
    const enrichedChildren: ChildWithStats[] = children.map((child) => {
      const id = child.id as string
      const childProgress = progressData.filter((p) => p.child_id === id)
      const childSessions = sessionsData.filter((s) => s.child_id === id)
      const childSub = subscriptionsData.find((s) => s.child_id === id)

      const lettersLearned = childProgress.filter((p) => (p.score as number) >= 80).length
      const lettersInProgress = childProgress.filter(
        (p) => (p.score as number) > 0 && (p.score as number) < 80
      ).length
      const avgScore =
        childProgress.length > 0
          ? Math.round(
              childProgress.reduce((sum, p) => sum + (p.score as number), 0) / childProgress.length
            )
          : 0
      const totalMinutes = Math.floor(
        childSessions.reduce((sum, s) => sum + ((s.duration_seconds as number) ?? 0), 0) / 60
      )

      const stats: ChildStats = {
        lettersLearned,
        lettersInProgress,
        lettersNeverSeen: Math.max(0, 28 - lettersLearned - lettersInProgress),
        avgScore,
        totalSessions: childSessions.length,
        totalMinutes,
        currentStreak: calculateStreak(childSessions.map((s) => s.started_at as string)),
        lastSessionDate: (childSessions[0]?.started_at as string | undefined) ?? (child.last_active as string | null) ?? null,
      }

      const subscription: SubscriptionInfo = {
        status: ((childSub?.status as SubscriptionInfo['status']) ?? 'inactive'),
        currentPeriodEnd: (childSub?.current_period_end as string | null) ?? null,
        cancelAtPeriodEnd: (childSub?.cancel_at_period_end as boolean | null) ?? false,
      }

      return {
        id,
        parent_id: child.parent_id as string,
        prenom: child.prenom as string,
        age: child.age as number,
        avatar: (child.avatar as string) ?? '🌙',
        niveau: (child.niveau as number) ?? 1,
        created_at: child.created_at as string,
        last_active: (child.last_active as string | null) ?? null,
        stats,
        subscription,
      }
    })

    return NextResponse.json({ children: enrichedChildren })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('GET /api/children:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const parentId = session.user.id

    // Vérifier que le parent n'a pas déjà 5 enfants
    const { count } = await supabase
      .from('children')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', parentId)

    if ((count ?? 0) >= 5) {
      return NextResponse.json(
        { error: 'Vous avez atteint le maximum de 5 enfants.' },
        { status: 400 }
      )
    }

    const body: unknown = await req.json()
    const parsed = createChildSchema.safeParse(body)

    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join(', ')
      return NextResponse.json({ error: messages }, { status: 400 })
    }

    const { prenom, age, avatar, niveau } = parsed.data

    const { data: newChild, error: insertError } = await supabase
      .from('children')
      .insert({ parent_id: parentId, prenom, age, avatar, niveau })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Erreur lors de la création du profil.' }, { status: 500 })
    }

    // Marquer l'onboarding complété dès le premier enfant
    await supabase
      .from('parents')
      .update({ onboarding_completed: true })
      .eq('id', parentId)

    return NextResponse.json({ child: newChild }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('POST /api/children:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
