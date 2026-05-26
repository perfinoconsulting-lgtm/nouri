/**
 * app/api/sessions/route.ts — Gestion des sessions de jeu (démarrage et clôture)
 *
 * POST : Démarre une session d'apprentissage pour un enfant.
 * PATCH : Termine la session de jeu et enregistre les statistiques (durée, questions revues, etc.).
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

const startSessionSchema = z.object({
  childId: z.string().uuid('ID enfant invalide'),
  moduleSlug: z.string().min(1, 'Slug du module requis'),
})

const endSessionSchema = z.object({
  sessionId: z.string().uuid('ID session invalide'),
  itemsReviewed: z.number().int().min(0, 'Le nombre d’items doit être >= 0'),
  correctAnswers: z.number().int().min(0, 'Le nombre de réponses correctes doit être >= 0'),
})

// POST : démarrer une session
export async function POST(req: Request) {
  try {
    const supabase = createServerSupabaseClient()

    // 1. Authentification
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const parentId = session.user.id

    // 2. Validation du body
    const body: unknown = await req.json()
    const parsed = startSessionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { childId, moduleSlug } = parsed.data

    // 3. Sécurité : vérifier que l'enfant appartient bien au parent
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id')
      .eq('id', childId)
      .eq('parent_id', parentId)
      .single()

    if (childError || !child) {
      return NextResponse.json({ error: 'Enfant introuvable ou accès refusé.' }, { status: 403 })
    }

    // 4. Création de la session
    const { data: newSession, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        child_id: childId,
        module_slug: moduleSlug,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (sessionError || !newSession) {
      console.error('[Sessions API] Erreur de création de session :', sessionError)
      return NextResponse.json({ error: 'Erreur lors de la création de la session.' }, { status: 500 })
    }

    return NextResponse.json({ sessionId: newSession.id })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('POST /api/sessions:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH : terminer une session
export async function PATCH(req: Request) {
  try {
    const supabase = createServerSupabaseClient()

    // 1. Authentification
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const parentId = session.user.id

    // 2. Validation du body
    const body: unknown = await req.json()
    const parsed = endSessionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { sessionId, itemsReviewed, correctAnswers } = parsed.data

    // 3. Lire la session actuelle
    const { data: sessionData, error: fetchError } = await supabase
      .from('sessions')
      .select('child_id, started_at')
      .eq('id', sessionId)
      .single()

    if (fetchError || !sessionData) {
      return NextResponse.json({ error: 'Session introuvable.' }, { status: 404 })
    }

    // 4. Sécurité : vérifier que l'enfant de la session appartient bien au parent authentifié
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id')
      .eq('id', sessionData.child_id)
      .eq('parent_id', parentId)
      .single()

    if (childError || !child) {
      return NextResponse.json({ error: 'Enfant introuvable ou accès refusé.' }, { status: 403 })
    }

    // 5. Calcul de la durée en secondes
    const endedAt = new Date()
    const startedAt = new Date(sessionData.started_at)
    const durationSeconds = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000))

    // 6. Mise à jour de la session
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
        items_reviewed: itemsReviewed,
        correct_answers: correctAnswers,
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('[Sessions API] Erreur de mise à jour de session :', updateError)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour de la session.' }, { status: 500 })
    }

    // 7. Mettre à jour last_active de l'enfant
    await supabase
      .from('children')
      .update({ last_active: endedAt.toISOString() })
      .eq('id', sessionData.child_id)

    // 8. Retourner le résumé de la session
    const score = itemsReviewed > 0 ? Math.round((correctAnswers / itemsReviewed) * 100) : 0

    return NextResponse.json({
      summary: {
        duration: durationSeconds,
        score,
        itemsReviewed,
      },
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('PATCH /api/sessions:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
