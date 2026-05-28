import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Mock du module serveur — évite d'importer next/headers en environnement Node
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

import {
  calculateNextReview,
  calculateNewScore,
  calculateEarnedStars,
} from '@/lib/spaced-repetition'

const NOW = new Date('2026-05-28T10:00:00Z').getTime()
const H = 60 * 60 * 1000   // 1 heure en ms
const D = 24 * H             // 1 jour en ms

describe('calculateNextReview', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('correct step 0 → step 1, nextReview = now+6h', () => {
    const { newStep, nextReview, mastered } = calculateNextReview(0, true)
    expect(newStep).toBe(1)
    expect(nextReview.getTime()).toBe(NOW + 6 * H)
    expect(mastered).toBe(false)
  })

  it('correct step 4 → step 5, mastered = true', () => {
    const { newStep, nextReview, mastered } = calculateNextReview(4, true)
    expect(newStep).toBe(5)
    expect(nextReview.getTime()).toBe(NOW + 30 * D)
    expect(mastered).toBe(true)
  })

  it('incorrect step 3 → step 0, nextReview = now+1h', () => {
    const { newStep, nextReview, mastered } = calculateNextReview(3, false)
    expect(newStep).toBe(0)
    expect(nextReview.getTime()).toBe(NOW + H)
    expect(mastered).toBe(false)
  })

  it('incorrect step 0 → step 0, nextReview = now+1h', () => {
    const { newStep, nextReview, mastered } = calculateNextReview(0, false)
    expect(newStep).toBe(0)
    expect(nextReview.getTime()).toBe(NOW + H)
    expect(mastered).toBe(false)
  })
})

describe('calculateNewScore', () => {
  it('score 50, correct < 3s → 70', () => {
    expect(calculateNewScore(50, true, 2000)).toBe(70)
  })

  it('score 90, correct → 100 plafonné', () => {
    expect(calculateNewScore(90, true, 2000)).toBe(100)
  })

  it('score 10, incorrect → 0 plancher', () => {
    expect(calculateNewScore(10, false, 1000)).toBe(0)
  })

  it('score 50, incorrect → 35', () => {
    expect(calculateNewScore(50, false, 1000)).toBe(35)
  })
})

describe('calculateEarnedStars', () => {
  it('correct rapide + série 6 → 3 étoiles', () => {
    expect(calculateEarnedStars(true, 2000, 6)).toBe(3)
  })

  it('correct normal série 2 → 1 étoile', () => {
    expect(calculateEarnedStars(true, 5000, 2)).toBe(1)
  })

  it('incorrect → 0 étoile', () => {
    expect(calculateEarnedStars(false, 1000, 5)).toBe(0)
  })
})
