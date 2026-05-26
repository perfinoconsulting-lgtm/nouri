/**
 * app/api/children/[id]/route.ts — GET détail | PUT modification | DELETE suppression
 *
 * Sécurité : ownership vérifié sur chaque opération via parent_id dans la requête
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { ChildWithStats, ChildStats, SubscriptionInfo, SessionData } from '@/types/dashboard'

const updateChildSchema = z.object({
  prenom: z.string().min(1).max(30).optional(),
  age: z.number().int().min(4).max(14).optional(),
  avatar: z.string().optional(),
  niveau: z.number().int().min(1).max(5).optional(),
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

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    // Ownership vérifié directement dans le SELECT (parent_id + id)
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id, parent_id, prenom, age, avatar, niveau, created_at, last_active')
      .eq('id', params.id)
      .eq('parent_id', session.user.id)
      .single()

    if (childError || !child) {
      return NextResponse.json({ error: 'Enfant introuvable ou accès refusé.' }, { status: 403 })
    }

    // Requêtes parallèles pour minimiser la latence
    const [progressResult, sessionsResult, subResult] = await Promise.all([
      supabase
        .from('progress')
        .select('score')
        .eq('child_id', params.id),
      supabase
        .from('sessions')
        .select('id, started_at, ended_at, duration_seconds, module_slug, items_reviewed, correct_answers')
        .eq('child_id', params.id)
        .order('started_at', { ascending: false }),
      supabase
        .from('subscriptions')
        .select('status, current_period_end, cancel_at_period_end')
        .eq('child_id', params.id)
        .maybeSingle(),
    ])

    const progressData = progressResult.data ?? []
    const allSessions = sessionsResult.data ?? []
    const sub = subResult.data

    // Calcul des stats
    const lettersLearned = progressData.filter((p) => (p.score as number) >= 80).length
    const lettersInProgress = progressData.filter(
      (p) => (p.score as number) > 0 && (p.score as number) < 80
    ).length
    const avgScore =
      progressData.length > 0
        ? Math.round(
            progressData.reduce((sum, p) => sum + (p.score as number), 0) / progressData.length
          )
        : 0
    const totalMinutes = Math.floor(
      allSessions.reduce((sum, s) => sum + ((s.duration_seconds as number) ?? 0), 0) / 60
    )

    const stats: ChildStats = {
      lettersLearned,
      lettersInProgress,
      lettersNeverSeen: Math.max(0, 28 - lettersLearned - lettersInProgress),
      avgScore,
      totalSessions: allSessions.length,
      totalMinutes,
      currentStreak: calculateStreak(allSessions.map((s) => s.started_at as string)),
      lastSessionDate:
        (allSessions[0]?.started_at as string | undefined) ??
        (child.last_active as string | null) ??
        null,
    }

    const subscription: SubscriptionInfo = {
      status: (sub?.status as SubscriptionInfo['status']) ?? 'inactive',
      currentPeriodEnd: (sub?.current_period_end as string | null) ?? null,
      cancelAtPeriodEnd: (sub?.cancel_at_period_end as boolean | null) ?? false,
    }

    const childWithStats: ChildWithStats = {
      id: child.id as string,
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

    // 10 sessions les plus récentes
    const recentSessions: SessionData[] = allSessions.slice(0, 10).map((s) => ({
      id: s.id as string,
      started_at: s.started_at as string,
      ended_at: (s.ended_at as string | null) ?? null,
      duration_seconds: (s.duration_seconds as number) ?? 0,
      module_slug: (s.module_slug as string) ?? '',
      items_reviewed: (s.items_reviewed as number) ?? 0,
      correct_answers: (s.correct_answers as number) ?? 0,
    }))

    return NextResponse.json({ child: childWithStats, recentSessions })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const body: unknown = await req.json()
    const parsed = updateChildSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour.' }, { status: 400 })
    }

    // Ownership vérifié dans le WHERE de l'UPDATE
    const { data: updated, error: updateError } = await supabase
      .from('children')
      .update(parsed.data)
      .eq('id', params.id)
      .eq('parent_id', session.user.id)
      .select()
      .single()

    if (updateError || !updated) {
      return NextResponse.json(
        { error: 'Enfant introuvable ou accès refusé.' },
        { status: 403 }
      )
    }

    return NextResponse.json({ child: updated })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    // Ownership vérifié dans le WHERE du DELETE
    const { error: deleteError, count } = await supabase
      .from('children')
      .delete({ count: 'exact' })
      .eq('id', params.id)
      .eq('parent_id', session.user.id)

    if (deleteError) {
      return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 })
    }

    if (count === 0) {
      return NextResponse.json({ error: 'Enfant introuvable ou accès refusé.' }, { status: 403 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
