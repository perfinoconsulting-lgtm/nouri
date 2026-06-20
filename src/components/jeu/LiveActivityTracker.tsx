'use client'

import { useCallback, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { LIVE_ACTIVITY_EVENT } from '@/lib/live-activity'
import type { LiveActivityDetail } from '@/types/live-activity'

const HEARTBEAT_INTERVAL_MS = 10_000

const MODULE_LABELS: Record<string, string> = {
  accueil: 'Choisit une activité',
  alphabet: "Explore l'alphabet",
  syllabes: 'Travaille les syllabes',
  mots: 'Apprend des mots',
  sourates: 'Étudie une sourate',
  reviser: 'Fait ses révisions',
}

interface LiveActivityTrackerProps {
  childId: string
}

function getModuleSlug(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean)
  return parts[2] ?? 'accueil'
}

export default function LiveActivityTracker({
  childId,
}: LiveActivityTrackerProps) {
  const pathname = usePathname()
  const moduleSlug = getModuleSlug(pathname)
  const detailRef = useRef<LiveActivityDetail>({
    label: MODULE_LABELS[moduleSlug] ?? 'Joue sur Lisani',
  })

  const sendActivity = useCallback(
    async (isActive: boolean, useBeacon = false) => {
      const body = JSON.stringify({
        childId,
        moduleSlug,
        activityLabel:
          detailRef.current.label ?? MODULE_LABELS[moduleSlug] ?? 'Joue sur Lisani',
        activityAr: detailRef.current.arabicText ?? null,
        viewName: detailRef.current.viewName ?? null,
        progressPercent: detailRef.current.progressPercent ?? null,
        isActive,
      })

      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/activity',
          new Blob([body], { type: 'application/json' })
        )
        return
      }

      try {
        await fetch('/api/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: !isActive,
        })
      } catch {
        // Le prochain heartbeat réessaiera automatiquement.
      }
    },
    [childId, moduleSlug]
  )

  useEffect(() => {
    detailRef.current = {
      label: MODULE_LABELS[moduleSlug] ?? 'Joue sur Lisani',
    }
    void sendActivity(true)

    const handleDetail = (event: Event) => {
      const customEvent = event as CustomEvent<LiveActivityDetail>
      detailRef.current = {
        ...detailRef.current,
        ...customEvent.detail,
      }
      void sendActivity(true)
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void sendActivity(true)
      }
    }

    const handlePageHide = () => {
      void sendActivity(false, true)
    }

    window.addEventListener(LIVE_ACTIVITY_EVENT, handleDetail)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pagehide', handlePageHide)

    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void sendActivity(true)
      }
    }, HEARTBEAT_INTERVAL_MS)

    return () => {
      window.clearInterval(heartbeat)
      window.removeEventListener(LIVE_ACTIVITY_EVENT, handleDetail)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pagehide', handlePageHide)
      void sendActivity(false, true)
    }
  }, [moduleSlug, sendActivity])

  return null
}

