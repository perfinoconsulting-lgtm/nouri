/**
 * app/api/cron/weekly-email/route.ts — Résumé hebdomadaire envoyé chaque lundi à 9h
 *
 * Schedule Vercel : "0 9 * * 1" (UTC — adapter si besoin selon fuseau)
 * Variable requise : CRON_SECRET
 */

import { NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { sendWeeklyProgressEmail } from '@/lib/email-service'
import type { ChildWeeklyStats } from '@/lib/email-service'

export const runtime = 'nodejs'

const BATCH_SIZE = 10

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Configuration Supabase admin manquante')
  return createClient(url, key)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Protection anti-spam : aucun envoi entre 21h et 8h (heure serveur UTC)
function isWithinSendWindow(): boolean {
  const hour = new Date().getUTCHours()
  return hour >= 8 && hour < 21
}

export async function GET(request: Request): Promise<Response> {
  // Vercel envoie l'en-tête Authorization: Bearer CRON_SECRET sur les cron jobs
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  if (!isWithinSendWindow()) {
    return NextResponse.json({ skipped: true, reason: 'Hors plage horaire (8h-21h UTC)' })
  }

  const supabase = getSupabaseAdmin()
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // !inner → INNER JOIN : exclut les parents sans enfant
  const { data: parents, error: parentsError } = await supabase
    .from('parents')
    .select('id, email, prenom, children!inner(id, prenom, avatar)')

  if (parentsError) {
    console.error('cron_weekly_error', parentsError.message)
    return NextResponse.json({ error: 'Erreur Supabase' }, { status: 500 })
  }

  const results = { sent: 0, failed: 0, skipped: 0 }

  for (let i = 0; i < parents.length; i += BATCH_SIZE) {
    const batch = parents.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async (parent) => {
        const children = parent.children as Array<{
          id: string
          prenom: string
          avatar: string
        }>

        if (!children || children.length === 0) {
          results.skipped++
          return
        }

        try {
          const childrenStats = await Promise.all(
            children.map((child) => buildChildWeeklyStats(supabase, child, since))
          )

          // Fire-and-forget — ne jamais await dans un cron pour éviter les timeouts
          sendWeeklyProgressEmail(
            { email: parent.email, prenom: parent.prenom ?? '' },
            childrenStats,
          )
          results.sent++
        } catch (err: unknown) {
          console.error('cron_weekly_child_error', err instanceof Error ? err.message : err)
          results.failed++
        }
      })
    )

    // Pause entre batchs — rate limiting Resend gratuit (max 100/jour)
    if (i + BATCH_SIZE < parents.length) {
      await sleep(100)
    }
  }

  console.log(JSON.stringify({ event: 'cron_weekly_email', ...results }))
  return NextResponse.json(results)
}

async function buildChildWeeklyStats(
  supabase: SupabaseClient,
  child: { id: string; prenom: string; avatar: string },
  since: string,
): Promise<ChildWeeklyStats> {
  // Requêtes en parallèle pour limiter la latence
  const [sessionsResult, masteredResult, nextReviewResult] = await Promise.all([
    // Sessions de la semaine
    supabase
      .from('sessions')
      .select('started_at, duration_seconds, items_reviewed')
      .eq('child_id', child.id)
      .gte('started_at', since),
    // Items maîtrisés avec leur type pour filtrer les lettres
    supabase
      .from('progress')
      .select('content_items(type)')
      .eq('child_id', child.id)
      .eq('mastered', true),
    // Prochaine lettre en révision (lettre la plus travaillée récemment)
    supabase
      .from('progress')
      .select('content_items(contenu_ar)')
      .eq('child_id', child.id)
      .eq('mastered', false)
      .order('next_review', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  const sessions = sessionsResult.data ?? []
  const sessionsCount = sessions.length
  const totalSeconds = sessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0)
  const totalMinutes = Math.round(totalSeconds / 60)
  // items_reviewed = nombre d'items vus dans la session (meilleur proxy pour lettersSeenThisWeek)
  const lettersSeenThisWeek = sessions.reduce((sum, s) => sum + (s.items_reviewed ?? 0), 0)

  type ContentItemPartial = { type?: string }
  const lettersMasteredTotal = (masteredResult.data ?? []).filter(
    (p) => (p.content_items as ContentItemPartial | null)?.type === 'lettre'
  ).length

  const topLetter =
    (nextReviewResult.data?.content_items as { contenu_ar?: string } | null)?.contenu_ar ?? ''

  return {
    prenom: child.prenom,
    avatar: child.avatar ?? '',
    isActive: sessionsCount > 0,
    lettersSeenThisWeek,
    lettersMasteredTotal,
    sessionsCount,
    totalMinutes,
    bestStreak: calcStreak(sessions.map((s) => s.started_at as string)),
    topLetter,
  }
}

// Nombre de jours consécutifs depuis aujourd'hui (inclus) dans un tableau de timestamps
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
