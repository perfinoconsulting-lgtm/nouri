'use client'

import { createContext, useContext } from 'react'

export type RewardIntensity = 'light' | 'full'

export interface RewardContextValue {
  triggerConfetti: (intensity?: RewardIntensity) => void
  showToast: (message: string, stars: number) => void
  showMilestone: (title: string, subtitle: string) => void
  playCorrect: () => void
  playWrong: () => void
  playMilestone: () => void
}

export const RewardContext = createContext<RewardContextValue | undefined>(undefined)

export function useRewards(): RewardContextValue {
  const context = useContext(RewardContext)
  if (!context) {
    throw new Error('useRewards doit être utilisé à l’intérieur de RewardSystemProvider')
  }
  return context
}
