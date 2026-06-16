import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const parentId = session.user.id

    // Récupérer toutes les données du parent (sans mot de passe — Supabase ne l'expose pas)
    const [parentResult, childrenResult, subscriptionsResult] = await Promise.all([
      supabase
        .from('parents')
        .select('id, email, prenom, onboarding_completed, created_at')
        .eq('id', parentId)
        .single(),
      supabase
        .from('children')
        .select('id, prenom, age, avatar, niveau, created_at, last_active')
        .eq('parent_id', parentId),
      supabase
        .from('subscriptions')
        .select('id, child_id, status, current_period_end, created_at')
        .eq('parent_id', parentId),
    ])

    const children = childrenResult.data ?? []
    const childIds = children.map((c) => c.id as string)

    // Progression et sessions — requêtes en parallèle si des enfants existent
    let progressData: unknown[] = []
    let sessionsData: unknown[] = []

    if (childIds.length > 0) {
      const [progressResult, sessionsResult] = await Promise.all([
        supabase
          .from('progress')
          .select('id, child_id, item_id, score, step, next_review, mastered, created_at')
          .in('child_id', childIds),
        supabase
          .from('sessions')
          .select('id, child_id, started_at, ended_at, duration_seconds, module_slug')
          .in('child_id', childIds)
          .order('started_at', { ascending: false }),
      ])

      progressData = progressResult.data ?? []
      sessionsData = sessionsResult.data ?? []
    }

    const exportPayload = {
      export_date: new Date().toISOString(),
      export_version: '1.0',
      source: 'Lisani',
      notice: 'Ces données vous appartiennent. Elles sont exportées conformément au RGPD (Art. 20 — droit à la portabilité).',
      compte: parentResult.data ?? null,
      enfants: children,
      abonnements: subscriptionsResult.data ?? [],
      progressions: progressData,
      sessions: sessionsData,
    }

    const json = JSON.stringify(exportPayload, null, 2)

    return new Response(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="Lisani-mes-donnees.json"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('GET /api/gdpr/export:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
