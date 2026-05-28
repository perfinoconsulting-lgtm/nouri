/**
 * app/(dashboard)/enfants/[id]/page.tsx — Détail profil enfant
 * Server Component — toutes les données chargées côté serveur
 */

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ProgressGrid from '@/components/dashboard/ProgressGrid'
import ChildDetailActions from '@/components/dashboard/ChildDetailActions'
import type { ChildWithStats, ChildStats, SubscriptionInfo, SessionData } from '@/types/dashboard'
import { ArrowLeft, Flame, Star, BookOpen, Clock } from 'lucide-react'

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
    } else break
  }
  return streak
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

function formatDateFr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ChildDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/connexion')

  // Vérification ownership dans la même requête
  const { data: childRaw } = await supabase
    .from('children')
    .select('id, parent_id, prenom, age, avatar, niveau, created_at, last_active')
    .eq('id', id)
    .eq('parent_id', session.user.id)
    .single()

  if (!childRaw) notFound()

  const [progressResult, sessionsResult, subResult] = await Promise.all([
    supabase
      .from('progress')
      .select('item_id, score, updated_at')
      .eq('child_id', id),
    supabase
      .from('sessions')
      .select('id, started_at, ended_at, duration_seconds, module_slug')
      .eq('child_id', id)
      .order('started_at', { ascending: false })
      .limit(20),
    supabase
      .from('subscriptions')
      .select('status, current_period_end, cancel_at_period_end')
      .eq('child_id', id)
      .single(),
  ])

  const allProgress = progressResult.data ?? []
  const allSessions = sessionsResult.data ?? []
  const subData = subResult.data

  const lettersLearned = allProgress.filter((p) => (p.score as number) >= 80).length
  const lettersInProgress = allProgress.filter(
    (p) => (p.score as number) > 0 && (p.score as number) < 80
  ).length
  const avgScore =
    allProgress.length > 0
      ? Math.round(
          allProgress.reduce((s, p) => s + (p.score as number), 0) / allProgress.length
        )
      : 0
  const totalSeconds = allSessions.reduce(
    (s, sess) => s + ((sess.duration_seconds as number) ?? 0),
    0
  )

  const stats: ChildStats = {
    lettersLearned,
    lettersInProgress,
    lettersNeverSeen: Math.max(0, 28 - lettersLearned - lettersInProgress),
    avgScore,
    totalSessions: allSessions.length,
    totalMinutes: Math.floor(totalSeconds / 60),
    currentStreak: calculateStreak(allSessions.map((s) => s.started_at as string)),
    lastSessionDate: (allSessions[0]?.started_at as string | undefined) ?? null,
  }

  const subscription: SubscriptionInfo = {
    status: (subData?.status as SubscriptionInfo['status']) ?? 'inactive',
    currentPeriodEnd: (subData?.current_period_end as string | null) ?? null,
    cancelAtPeriodEnd: (subData?.cancel_at_period_end as boolean | null) ?? false,
  }

  const child: ChildWithStats = {
    id: childRaw.id as string,
    parent_id: childRaw.parent_id as string,
    prenom: childRaw.prenom as string,
    age: childRaw.age as number,
    avatar: (childRaw.avatar as string) ?? '🌙',
    niveau: (childRaw.niveau as number) ?? 1,
    created_at: childRaw.created_at as string,
    last_active: (childRaw.last_active as string | null) ?? null,
    stats,
    subscription,
  }

  const recentSessions: SessionData[] = allSessions.slice(0, 10).map((s) => ({
    id: s.id as string,
    started_at: s.started_at as string,
    ended_at: (s.ended_at as string | null) ?? null,
    duration_seconds: (s.duration_seconds as number) ?? 0,
    module_slug: (s.module_slug as string) ?? '—',
    items_reviewed: 0,
    correct_answers: 0,
  }))

  const progressData = allProgress.map((p) => ({
    item_id: p.item_id as string,
    score: p.score as number,
    updated_at: (p.updated_at as string | undefined) ?? undefined,
  }))

  const levelColors: Record<number, string> = {
    1: '#94a3b8',
    2: '#3b82f6',
    3: '#F5A623',
    4: '#9B59B6',
    5: '#00C9B1',
  }
  const levelColor = levelColors[child.niveau] ?? '#94a3b8'

  return (
    <div className="space-y-8">

      {/* Retour */}
      <Link
        href="/enfants"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-[#1A3A5C] font-semibold text-sm transition"
      >
        <ArrowLeft size={16} />
        Retour à mes enfants
      </Link>

      {/* ── En-tête profil ── */}
      <div
        className="bg-[#1A3A5C] rounded-3xl p-6 md:p-8 text-white overflow-hidden"
        style={{ borderLeft: `6px solid ${levelColor}` }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-4xl shrink-0 shadow-lg">
            {child.avatar}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{child.prenom}</h1>
            <p className="text-white/60 mt-1">
              {child.age} ans · Niveau {child.niveau} · Inscrit le {formatDateFr(child.created_at)}
            </p>
            {subscription.status === 'active' && (
              <span className="inline-flex mt-2 px-3 py-1 bg-[#27AE60]/20 text-[#27AE60] text-xs font-bold rounded-full">
                ✨ Premium actif
              </span>
            )}
            {subscription.status === 'trialing' && (
              <span className="inline-flex mt-2 px-3 py-1 bg-[#F5A623]/20 text-[#F5A623] text-xs font-bold rounded-full">
                🎁 Essai gratuit
              </span>
            )}
            {(subscription.status === 'inactive' || subscription.status === 'canceled') && (
              <span className="inline-flex mt-2 px-3 py-1 bg-white/10 text-white/50 text-xs font-bold rounded-full">
                Gratuit
              </span>
            )}
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-[#F5A623] mb-1">
              <Flame size={16} />
              <span className="text-2xl font-bold">{stats.currentStreak}</span>
            </div>
            <p className="text-white/50 text-xs">Jours de suite</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-[#27AE60] mb-1">
              <Star size={16} />
              <span className="text-2xl font-bold">{stats.avgScore}%</span>
            </div>
            <p className="text-white/50 text-xs">Score moyen</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-[#00C9B1] mb-1">
              <BookOpen size={16} />
              <span className="text-2xl font-bold">{stats.lettersLearned}</span>
            </div>
            <p className="text-white/50 text-xs">Lettres maîtrisées</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-white/70 mb-1">
              <Clock size={16} />
              <span className="text-2xl font-bold">{formatDuration(totalSeconds)}</span>
            </div>
            <p className="text-white/50 text-xs">Temps total</p>
          </div>
        </div>
      </div>

      {/* ── Grille des lettres ── */}
      <ProgressGrid progressData={progressData} />

      {/* ── Sessions récentes ── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1A3A5C]">Sessions récentes</h2>
          <span className="text-sm text-gray-400">{stats.totalSessions} au total</span>
        </div>

        {recentSessions.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <p className="text-lg mb-1">Aucune session pour l&apos;instant</p>
            <p className="text-sm">Les sessions apparaîtront ici après la première connexion.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 font-semibold text-gray-500">Date</th>
                  <th className="px-6 py-3 font-semibold text-gray-500">Module</th>
                  <th className="px-6 py-3 font-semibold text-gray-500 text-right">Durée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentSessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 text-[#1A3A5C] font-medium">
                      {formatDateFr(sess.started_at)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 capitalize">
                      {sess.module_slug.replace(/-/g, ' ')}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-right font-mono">
                      {formatDuration(sess.duration_seconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-[#1A3A5C] mb-4">Gérer le profil</h2>
        <ChildDetailActions child={child} />
      </div>

    </div>
  )
}
