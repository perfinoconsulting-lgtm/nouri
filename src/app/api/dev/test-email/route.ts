/**
 * Route de test emails — DÉVELOPPEMENT UNIQUEMENT
 * Jamais déployée en production (guard NODE_ENV)
 *
 * Usage :
 *   GET /api/dev/test-email?type=welcome
 *   GET /api/dev/test-email?type=weekly
 *   GET /api/dev/test-email?type=milestone&milestone=5_letters
 *   GET /api/dev/test-email?type=subscription
 *   GET /api/dev/test-email?type=payment_failed
 *   GET /api/dev/test-email?type=cancelled
 */

import { NextResponse } from 'next/server'
import {
  sendWelcomeEmail,
  sendWeeklyProgressEmail,
  sendMilestoneEmail,
  sendSubscriptionConfirmedEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCancelledEmail,
} from '@/lib/email-service'
import type { MilestoneType } from '@/lib/email-service'

// Données factices pour les tests
const PARENT_TEST = {
  email: process.env.TEST_EMAIL ?? 'test@example.com',
  prenom: 'Fatima',
}

const CHILD_TEST = { prenom: 'Youssef', avatar: '🦁' }

const CHILDREN_STATS_TEST = [
  {
    prenom: 'Youssef',
    avatar: '🦁',
    isActive: true,
    lettersSeenThisWeek: 12,
    lettersMasteredTotal: 8,
    sessionsCount: 5,
    totalMinutes: 23,
    bestStreak: 4,
    topLetter: 'ب',
  },
  {
    prenom: 'Amira',
    avatar: '🌸',
    isActive: false,
    lettersSeenThisWeek: 0,
    lettersMasteredTotal: 3,
    sessionsCount: 0,
    totalMinutes: 0,
    bestStreak: 0,
    topLetter: '',
  },
]

export async function GET(request: Request): Promise<Response> {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Non disponible en production' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const milestone = (searchParams.get('milestone') ?? '5_letters') as MilestoneType

  if (!PARENT_TEST.email || PARENT_TEST.email === 'test@example.com') {
    return NextResponse.json(
      { error: 'Ajouter TEST_EMAIL=ton@email.com dans .env.local' },
      { status: 400 }
    )
  }

  switch (type) {
    case 'welcome':
      sendWelcomeEmail(PARENT_TEST)
      break

    case 'weekly':
      sendWeeklyProgressEmail(PARENT_TEST, CHILDREN_STATS_TEST)
      break

    case 'milestone':
      sendMilestoneEmail(PARENT_TEST, CHILD_TEST, milestone)
      break

    case 'subscription':
      sendSubscriptionConfirmedEmail(
        PARENT_TEST,
        CHILD_TEST,
        200,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      )
      break

    case 'payment_failed':
      sendPaymentFailedEmail(PARENT_TEST, CHILD_TEST, 7)
      break

    case 'cancelled':
      sendSubscriptionCancelledEmail(
        PARENT_TEST,
        CHILD_TEST,
        new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      )
      break

    default:
      return NextResponse.json(
        {
          error: 'type manquant',
          types_disponibles: ['welcome', 'weekly', 'milestone', 'subscription', 'payment_failed', 'cancelled'],
          exemple_milestone: '/api/dev/test-email?type=milestone&milestone=10_letters',
          milestones: ['5_letters', '10_letters', '20_letters', '28_letters', 'streak_7', 'first_sourate'],
        },
        { status: 400 }
      )
  }

  return NextResponse.json({ sent: true, to: PARENT_TEST.email, type, milestone: type === 'milestone' ? milestone : undefined })
}
