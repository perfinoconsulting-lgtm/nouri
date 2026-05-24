/**
 * app/api/children/route.ts -- GET liste enfants + stats | POST creation enfant
 *
 * Variables d'environnement requises :
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Schema de validation Zod pour la creation d'un enfant
const createChildSchema = z.object({
  prenom: z.string().min(1, 'Le prenom est requis').max(30, 'Prenom trop long'),
  age: z.number().int().min(4, 'Age minimum : 4 ans').max(14, 'Age maximum : 14 ans'),
  avatar: z.string().optional().default('🌙'),
  niveau: z.number().int().min(1).max(5).optional().default(1),
})

// Calcule le nombre de jours consecutifs avec au moins une session
function calculateStreak(sessions: Array<{ created_at: string }>): number {
  if (!sessions.length) return 0

  const uniqueDays = Array.from(new Set(
    sessions.map((s) => new Date(s.created_at).toISOString().split('T')[0])
  )).sort().reverse()

  if (!uniqueDays.length) return 0

  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  let currentDay = today

  for (const day of uniqueDays) {
    if (day === currentDay) {
      streak++
      const d = new Date(currentDay)
      d.setDate(d.getDate() - 1)
      currentDay = d.toISOString().split('T')[0]
    } else {
      break
    }
  }

  return streak
}

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 })
    }

    // Recuperer les enfants du parent
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', session.user.id)
      .order('created_at', { ascending: true })

    if (childrenError) {
      return NextResponse.json({ error: 'Erreur lors de la recuperation des enfants.' }, { status: 500 })
    }

    if (!children || children.length === 0) {
      return NextResponse.json({ children: [] })
    }

    const childIds = children.map((c) => c.id)

    // Recuperer les progres de tous les enfants
    const { data: progressData } = await supabase
      .from('progress')
      .select('child_id, score')
      .in('child_id', childIds)

    // Recuperer les abonnements actifs
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('child_id, status, current_period_start')
      .in('child_id', childIds)

    // Assembler les stats pour chaque enfant
    const enrichedChildren = children.map((child) => {
      const childProgress = progressData?.filter((p) => p.child_id === child.id) ?? []
      const childSub = subscriptions?.find((s) => s.child_id === child.id)

      const lettersLearned = childProgress.filter((p) => p.score >= 80).length
      const lettersInProgress = childProgress.filter((p) => p.score > 0 && p.score < 80).length
      const avgScore =
        childProgress.length > 0
          ? Math.round(childProgress.reduce((sum, p) => sum + p.score, 0) / childProgress.length)
          : 0

      return {
        id: child.id,
        prenom: child.prenom,
        age: child.age,
        avatar: child.avatar,
        niveau: child.niveau,
        created_at: child.created_at,
        last_active: child.last_active,
        stats: {
          lettersLearned,
          lettersInProgress,
          avgScore,
          totalSessions: 0,
          totalMinutes: 0,
          currentStreak: 0,
          lastSessionDate: child.last_active,
        },
        subscription: {
          status: childSub?.status ?? 'inactive',
          currentPeriodStart: childSub?.current_period_start ?? null,
        },
      }
    })

    return NextResponse.json({ children: enrichedChildren })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('GET /api/children error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = createChildSchema.safeParse(body)

    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message).join(', ')
      return NextResponse.json({ error: messages }, { status: 400 })
    }

    const { prenom, age, avatar, niveau } = parsed.data

    const { data: newChild, error: insertError } = await supabase
      .from('children')
      .insert({
        parent_id: session.user.id,
        prenom,
        age,
        avatar,
        niveau,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Erreur lors de la creation du profil.' }, { status: 500 })
    }

    // Marquer l'onboarding comme complete si c'est le premier enfant
    await supabase
      .from('parents')
      .update({ onboarding_completed: true })
      .eq('id', session.user.id)

    return NextResponse.json({ child: newChild }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('POST /api/children error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
