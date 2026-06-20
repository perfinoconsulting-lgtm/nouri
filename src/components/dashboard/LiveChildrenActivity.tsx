'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, Radio } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ChildLiveActivity } from '@/types/live-activity'

const ACTIVE_THRESHOLD_MS = 30_000
const FALLBACK_REFRESH_MS = 20_000

interface ChildIdentity {
  id: string
  prenom: string
  avatar: string
}

interface LiveChildrenActivityProps {
  childProfiles: ChildIdentity[]
  initialActivity: ChildLiveActivity[]
  focusChildId?: string
}

function formatElapsed(updatedAt: string, now: number): string {
  const seconds = Math.max(
    0,
    Math.floor((now - new Date(updatedAt).getTime()) / 1000)
  )

  if (seconds < 5) return "à l'instant"
  if (seconds < 60) return `il y a ${seconds} s`

  const minutes = Math.floor(seconds / 60)
  return `il y a ${minutes} min`
}

export default function LiveChildrenActivity({
  childProfiles,
  initialActivity,
  focusChildId,
}: LiveChildrenActivityProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [activityByChild, setActivityByChild] = useState(
    () => new Map(initialActivity.map((activity) => [activity.child_id, activity]))
  )
  const [now, setNow] = useState(() => Date.now())

  const refreshProgress = useCallback(() => {
    router.refresh()
  }, [router])

  useEffect(() => {
    setActivityByChild(
      new Map(initialActivity.map((activity) => [activity.child_id, activity]))
    )
  }, [initialActivity])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000)
    const fallback = window.setInterval(refreshProgress, FALLBACK_REFRESH_MS)

    const activityChannel = supabase
      .channel(`parent-live-activity-${focusChildId ?? 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'child_live_activity',
          ...(focusChildId ? { filter: `child_id=eq.${focusChildId}` } : {}),
        },
        (payload) => {
          const nextActivity = payload.new as ChildLiveActivity
          if (!nextActivity.child_id) return

          setActivityByChild((current) => {
            const next = new Map(current)
            next.set(nextActivity.child_id, nextActivity)
            return next
          })
          setNow(Date.now())
        }
      )
      .subscribe()

    const progressChannel = supabase
      .channel(`parent-live-progress-${focusChildId ?? 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'progress',
          ...(focusChildId ? { filter: `child_id=eq.${focusChildId}` } : {}),
        },
        refreshProgress
      )
      .subscribe()

    return () => {
      window.clearInterval(timer)
      window.clearInterval(fallback)
      void supabase.removeChannel(activityChannel)
      void supabase.removeChannel(progressChannel)
    }
  }, [focusChildId, refreshProgress, supabase])

  const visibleChildren = focusChildId
    ? childProfiles.filter((child) => child.id === focusChildId)
    : childProfiles

  if (visibleChildren.length === 0) return null

  return (
    <section
      className="rounded-3xl border border-[#00C9B1]/20 bg-gradient-to-br from-[#E9FFFB] to-white p-5 shadow-sm md:p-6"
      aria-labelledby="live-activity-title"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="text-[#00A894]" size={20} aria-hidden="true" />
            <h2
              id="live-activity-title"
              className="text-lg font-bold text-[#1A3A5C]"
            >
              Activité en direct
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Mise à jour automatique pendant les exercices.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#008978] shadow-sm">
          Temps réel
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {visibleChildren.map((child) => {
          const activity = activityByChild.get(child.id)
          const updatedAt = activity?.updated_at
          const isActive = Boolean(
            activity?.is_active &&
              updatedAt &&
              now - new Date(updatedAt).getTime() <= ACTIVE_THRESHOLD_MS
          )

          return (
            <article
              key={child.id}
              className="flex min-h-[96px] items-center gap-4 rounded-2xl border border-white bg-white/90 p-4 shadow-sm"
            >
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#1A3A5C]/5 text-3xl">
                {child.avatar}
                <span
                  className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                    isActive ? 'animate-pulse bg-[#27AE60]' : 'bg-slate-300'
                  }`}
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-[#1A3A5C]">{child.prenom}</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      isActive
                        ? 'bg-[#27AE60]/10 text-[#1F8A4C]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isActive ? 'En train de jouer' : 'Hors ligne'}
                  </span>
                </div>

                {isActive && activity ? (
                  <div className="mt-1">
                    <p className="text-sm font-semibold text-slate-700">
                      {activity.activity_label ?? activity.module_slug}
                    </p>
                    {activity.activity_ar && (
                      <span
                        dir="rtl"
                        className="mt-1 block w-fit font-arabic text-2xl leading-none text-[#F5A623]"
                        style={{ fontFamily: "'Noto Naskh Arabic', serif" }}
                      >
                        {activity.activity_ar}
                      </span>
                    )}
                    {activity.progress_percent !== null && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#00C9B1] transition-all duration-500"
                            style={{ width: `${activity.progress_percent}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#008978]">
                          {activity.progress_percent} %
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">
                    Aucune activité en cours
                  </p>
                )}

                {updatedAt && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                    <Activity size={13} aria-hidden="true" />
                    Actif {formatElapsed(updatedAt, now)}
                  </p>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
