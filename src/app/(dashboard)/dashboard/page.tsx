/**
 * app/(dashboard)/dashboard/page.tsx — Tableau de bord principal du parent
 * Server Component — données chargées côté serveur via Supabase
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import ChildCard from '@/components/dashboard/ChildCard'
import StatsCard from '@/components/dashboard/StatsCard'
import AddChildButton from '@/components/dashboard/AddChildButton'
import LiveChildrenActivity from '@/components/dashboard/LiveChildrenActivity'
import Link from 'next/link'
import type { ChildWithStats, ChildStats, SubscriptionInfo } from '@/types/dashboard'
import type { ChildLiveActivity } from '@/types/live-activity'

function formatDateFr(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

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
    } else break
  }
  return streak
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: parent } = await supabase
    .from('parents')
    .select('prenom, onboarding_completed')
    .eq('id', session.user.id)
    .single()

  const { data: children } = await supabase
    .from('children')
    .select('id, parent_id, prenom, age, avatar, niveau, created_at, last_active')
    .eq('parent_id', session.user.id)
    .order('created_at', { ascending: true })

  const childrenList = children ?? []
  const childIds = childrenList.map((c) => c.id as string)

  // Toutes les données agrégées en parallèle
  const [progressResult, sessionsResult, subsResult, weeklyResult, activityResult] =
    childIds.length > 0
      ? await Promise.all([
          supabase.from('progress').select('child_id, score').in('child_id', childIds),
          supabase
            .from('sessions')
            .select('child_id, started_at, duration_seconds')
            .in('child_id', childIds)
            .order('started_at', { ascending: false }),
          supabase
            .from('subscriptions')
            .select('child_id, status, current_period_end, cancel_at_period_end')
            .in('child_id', childIds),
          supabase
            .from('sessions')
            .select('child_id, duration_seconds')
            .in('child_id', childIds)
            .gte('started_at', new Date(Date.now() - 7 * 864e5).toISOString()),
          supabase
            .from('child_live_activity')
            .select(
              'child_id, parent_id, module_slug, activity_label, activity_ar, view_name, is_active, progress_percent, updated_at'
            )
            .in('child_id', childIds),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }]

  const allProgress = progressResult.data ?? []
  const allSessions = sessionsResult.data ?? []
  const allSubs = subsResult.data ?? []
  const weeklySessions = weeklyResult.data ?? []
  const liveActivity = (activityResult.data ?? []) as ChildLiveActivity[]

  // Stats globales pour la barre du haut
  const totalLettersMastered = allProgress.filter((p) => (p.score as number) >= 80).length
  const activeChildrenCount = childrenList.filter((c) => {
    if (!c.last_active) return false
    return Date.now() - new Date(c.last_active as string).getTime() < 7 * 864e5
  }).length
  const sessionsThisWeek = weeklySessions.length
  const totalSeconds = weeklySessions.reduce((s, w) => s + ((w.duration_seconds as number) ?? 0), 0)
  const totalHours = Math.floor(totalSeconds / 3600)
  const totalMin = Math.floor((totalSeconds % 3600) / 60)
  const tempsLabel = totalHours > 0 ? `${totalHours}h ${totalMin}min` : `${totalMin}min`

  // Construction des ChildWithStats pour chaque enfant
  const enrichedChildren: ChildWithStats[] = childrenList.map((child) => {
    const id = child.id as string
    const childProgress = allProgress.filter((p) => p.child_id === id)
    const childSessions = allSessions.filter((s) => s.child_id === id)
    const childSub = allSubs.find((s) => s.child_id === id)

    const lettersLearned = childProgress.filter((p) => (p.score as number) >= 80).length
    const lettersInProgress = childProgress.filter(
      (p) => (p.score as number) > 0 && (p.score as number) < 80
    ).length
    const avgScore =
      childProgress.length > 0
        ? Math.round(childProgress.reduce((s, p) => s + (p.score as number), 0) / childProgress.length)
        : 0
    const totalMinutes = Math.floor(
      childSessions.reduce((s, sess) => s + ((sess.duration_seconds as number) ?? 0), 0) / 60
    )

    const stats: ChildStats = {
      lettersLearned,
      lettersInProgress,
      lettersNeverSeen: Math.max(0, 28 - lettersLearned - lettersInProgress),
      avgScore,
      totalSessions: childSessions.length,
      totalMinutes,
      currentStreak: calculateStreak(childSessions.map((s) => s.started_at as string)),
      lastSessionDate:
        (childSessions[0]?.started_at as string | undefined) ??
        (child.last_active as string | null) ??
        null,
    }

    const subscription: SubscriptionInfo = {
      status: (childSub?.status as SubscriptionInfo['status']) ?? 'inactive',
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

  return (
    <div className="space-y-10">

      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1A3A5C]">
            Bonjour {parent?.prenom ?? 'Parent'} 👋
          </h1>
          <p className="text-gray-400 mt-1 capitalize">{formatDateFr()}</p>
        </div>
        {childrenList.length > 0 && (
          <Link
            href="/enfants"
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-[#1A3A5C] font-bold rounded-xl hover:bg-gray-50 transition shadow-sm text-sm min-h-[48px]"
          >
            Gérer les enfants
          </Link>
        )}
      </div>

      {/* Banner onboarding */}
      {!parent?.onboarding_completed && childrenList.length === 0 && (
        <div className="bg-gradient-to-r from-[#1A3A5C] to-blue-900 text-white p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F5A623]/20 rounded-2xl flex items-center justify-center text-2xl shrink-0">
              🌙
            </div>
            <div>
              <h3 className="font-bold text-lg">Bienvenue sur Lisani !</h3>
              <p className="text-blue-200 text-sm mt-0.5">
                Créez le profil de votre premier enfant pour commencer l&apos;aventure.
              </p>
            </div>
          </div>
          <Link
            href="/enfants"
            className="px-6 py-3 bg-[#F5A623] text-[#1A3A5C] font-bold rounded-xl hover:bg-[#e09520] transition whitespace-nowrap shadow-md min-h-[48px] flex items-center"
          >
            Créer un profil enfant →
          </Link>
        </div>
      )}

      {childrenList.length > 0 && (
        <LiveChildrenActivity
          childProfiles={childrenList.map((child) => ({
            id: child.id as string,
            prenom: child.prenom as string,
            avatar: (child.avatar as string) ?? '🌙',
          }))}
          initialActivity={liveActivity}
        />
      )}

      {/* Stats globales */}
      {childrenList.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard icon="📖" label="Lettres maîtrisées" value={totalLettersMastered} color="#27AE60" />
          <StatsCard
            icon="👦"
            label="Enfants actifs (7j)"
            value={`${activeChildrenCount}/${childrenList.length}`}
            color="#3b82f6"
          />
          <StatsCard icon="📅" label="Sessions cette semaine" value={sessionsThisWeek} color="#F5A623" />
          <StatsCard icon="⏱️" label="Temps total (7j)" value={tempsLabel} color="#9B59B6" />
        </div>
      )}

      {/* Cartes enfants */}
      {enrichedChildren.length > 0 ? (
        <div>
          <h2 className="text-xl font-bold text-[#1A3A5C] mb-5">Mes enfants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrichedChildren.map((child) => (
              <ChildCard key={child.id} child={child} />
            ))}

            {enrichedChildren.length < 5 && <AddChildButton />}
          </div>
        </div>
      ) : (
        /* État vide */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg width="160" height="140" viewBox="0 0 160 140" fill="none" className="mb-8">
            <circle cx="80" cy="70" r="50" fill="#EFF6FF" />
            <path d="M95 50C95 65.464 82.464 78 67 78C60.83 78 55.118 75.96 50.5 72.5C54.132 83.302 64.384 91 76.5 91C91.964 91 104.5 78.464 104.5 63C104.5 56.508 102.402 50.512 98.826 45.7C96.654 47.017 95 48.9 95 50Z" fill="#F5A623" opacity="0.8"/>
            <circle cx="40" cy="30" r="4" fill="#F5A623" opacity="0.6"/>
            <circle cx="120" cy="25" r="3" fill="#F5A623" opacity="0.5"/>
            <circle cx="130" cy="60" r="2.5" fill="#F5A623" opacity="0.4"/>
            <rect x="60" y="75" width="40" height="30" rx="4" fill="#1A3A5C" opacity="0.8"/>
            <rect x="58" y="73" width="44" height="4" rx="2" fill="#1A3A5C"/>
            <line x1="80" y1="77" x2="80" y2="105" stroke="white" strokeWidth="1.5" opacity="0.4"/>
          </svg>
          <h2 className="text-2xl font-bold text-[#1A3A5C] mb-3">
            Vous n&apos;avez pas encore créé de profil enfant
          </h2>
          <p className="text-gray-500 max-w-sm mb-8">
            Commencez l&apos;aventure Lisani en créant le premier profil. Cela prend moins d&apos;une minute !
          </p>
          <Link
            href="/enfants"
            className="px-8 py-4 bg-[#F5A623] text-[#1A3A5C] font-bold rounded-2xl hover:bg-[#e09520] transition shadow-lg text-lg min-h-[56px] flex items-center"
          >
            + Créer le premier profil
          </Link>
        </div>
      )}
    </div>
  )
}
