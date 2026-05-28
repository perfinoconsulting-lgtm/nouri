/**
 * app/api/cron/milestone-check/route.ts — Vérification des milestones chaque soir à 18h
 *
 * Schedule Vercel : "0 18 * * *" (UTC)
 * Variable requise : CRON_SECRET
 *
 * PRÉREQUIS — exécuter dans le SQL Editor Supabase avant le premier déploiement :
 *
 * CREATE TABLE milestone_notifications (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   child_id UUID REFERENCES children(id) ON DELETE CASCADE,
 *   milestone_type TEXT NOT NULL,
 *   notified_at TIMESTAMPTZ DEFAULT NOW(),
 *   UNIQUE(child_id, milestone_type)
 * );
 * ALTER TABLE milestone_notifications ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "parent_own" ON milestone_notifications
 *   FOR ALL USING (
 *     EXISTS (SELECT 1 FROM children WHERE id = child_id AND parent_id = auth.uid())
 *   );
 * CREATE INDEX idx_milestone_child_id ON milestone_notifications(child_id);
 */

import { NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { sendMilestoneEmail } from '@/lib/email-service'
import type { MilestoneType } from '@/lib/email-service'

export const runtime = 'nodejs'

type ContentItemPartial = { type?: string }

// Seuils lettres maîtrisées déclenchant un milestone
const LETTER_THRESHOLDS: Array<{ type: MilestoneType; min: number }> = [
  { type: '5_letters', min: 5 },
  { type: '10_letters', min: 10 },
  { type: '20_letters', min: 20 },
  { type: '28_letters', min: 28 },
]

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Configuration Supabase admin manquante')
  return createClient(url, key)
}

function isWithinSendWindow(): boolean {
  const hour = new Date().getUTCHours()
  return hour >= 8 && hour < 21
}

export async function GET(request: Request): Promise<Response> {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  if (!isWithinSendWindow()) {
    return NextResponse.json({ skipped: true, reason: 'Hors plage horaire (8h-21h UTC)' })
  }

  const supabase = getSupabaseAdmin()

  // Début de journée UTC pour filtrer les enfants actifs aujourd'hui
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  const { data: children, error } = await supabase
    .from('children')
    .select('id, prenom, avatar, parent_id, parents(id, email, prenom)')
    .gte('last_active', todayStart.toISOString())

  if (error) {
    console.error('cron_milestone_error', error.message)
    return NextResponse.json({ error: 'Erreur Supabase' }, { status: 500 })
  }

  let sent = 0
  let failed = 0

  for (const child of children) {
    const parent = child.parents as { id: string; email: string; prenom: string | null } | null
    if (!parent) continue

    try {
      // Récupérer tous les items maîtrisés avec leur type en une seule requête
      const { data: masteredItems } = await supabase
        .from('progress')
        .select('content_items(type)')
        .eq('child_id', child.id)
        .eq('mastered', true)

      const lettersMastered = (masteredItems ?? []).filter(
        (p) => (p.content_items as ContentItemPartial | null)?.type === 'lettre'
      ).length

      const hasSourate = (masteredItems ?? []).some(
        (p) => (p.content_items as ContentItemPartial | null)?.type === 'sourate'
      )

      // Sessions des 8 derniers jours pour calculer le streak
      const { data: recentSessions } = await supabase
        .from('sessions')
        .select('started_at')
        .eq('child_id', child.id)
        .gte('started_at', new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString())

      const streak = calcStreak(recentSessions?.map((s) => s.started_at as string) ?? [])

      const parentInfo = { email: parent.email, prenom: parent.prenom ?? '' }
      const childInfo = { prenom: child.prenom as string, avatar: (child.avatar as string) ?? '' }

      // Vérifier les seuils lettres
      for (const threshold of LETTER_THRESHOLDS) {
        if (lettersMastered >= threshold.min) {
          const notified = await tryNotify(supabase, child.id as string, threshold.type)
          if (notified) {
            // Fire-and-forget
            sendMilestoneEmail(parentInfo, childInfo, threshold.type)
            sent++
          }
        }
      }

      // Vérifier streak 7 jours
      if (streak >= 7) {
        const notified = await tryNotify(supabase, child.id as string, 'streak_7')
        if (notified) {
          sendMilestoneEmail(parentInfo, childInfo, 'streak_7')
          sent++
        }
      }

      // Vérifier première sourate maîtrisée
      if (hasSourate) {
        const notified = await tryNotify(supabase, child.id as string, 'first_sourate')
        if (notified) {
          sendMilestoneEmail(parentInfo, childInfo, 'first_sourate')
          sent++
        }
      }
    } catch (err: unknown) {
      console.error('cron_milestone_child_error', err instanceof Error ? err.message : err)
      failed++
    }
  }

  console.log(JSON.stringify({ event: 'cron_milestone_check', sent, failed, checked: children.length }))
  return NextResponse.json({ sent, failed, checked: children.length })
}

/**
 * Tente d'insérer une notification — retourne true si c'est la première fois.
 * La contrainte UNIQUE(child_id, milestone_type) garantit l'idempotence.
 */
async function tryNotify(
  supabase: SupabaseClient,
  childId: string,
  milestoneType: MilestoneType,
): Promise<boolean> {
  const { error } = await supabase
    .from('milestone_notifications')
    .insert({ child_id: childId, milestone_type: milestoneType })

  if (!error) return true
  // Code PostgreSQL 23505 = violation contrainte UNIQUE → déjà notifié, pas d'erreur à remonter
  if (error.code === '23505') return false
  throw error
}

function calcStreak(startedAts: string[]): number {
  if (startedAts.length === 0) return 0

  const uniqueDays = [...new Set(startedAts.map((s) => s.slice(0, 10)))].sort().reverse()

  let streak = 0
  const cursor = new Date()
  cursor.setUTCHours(0, 0, 0, 0)

  for (const day of uniqueDays) {
    const expected = cursor.toISOString().slice(0, 10)
    if (day === expected) {
      streak++
      cursor.setUTCDate(cursor.getUTCDate() - 1)
    } else {
      break
    }
  }

  return streak
}
