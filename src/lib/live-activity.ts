import type { LiveActivityDetail } from '@/types/live-activity'

export const LIVE_ACTIVITY_EVENT = 'lisani:live-activity'

export function reportLiveActivity(detail: LiveActivityDetail): void {
  if (typeof window === 'undefined') return

  window.dispatchEvent(
    new CustomEvent<LiveActivityDetail>(LIVE_ACTIVITY_EVENT, { detail })
  )
}

