/**
 * app/api/children/[id]/route.ts -- GET detail | PUT modification | DELETE suppression
 *
 * Securite : verifie toujours que l'enfant appartient au parent connecte
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateChildSchema = z.object({
  prenom: z.string().min(1).max(30).optional(),
  age: z.number().int().min(4).max(14).optional(),
  avatar: z.string().optional(),
  niveau: z.number().int().min(1).max(5).optional(),
})

// Helper : verifie que l'enfant appartient au parent connecte
async function verifyChildOwnership(childId: string, parentId: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('children')
    .select('id')
    .eq('id', childId)
    .eq('parent_id', parentId)
    .single()

  return !error && !!data
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 })

    const isOwner = await verifyChildOwnership(params.id, session.user.id)
    if (!isOwner) return NextResponse.json({ error: 'Acces refuse.' }, { status: 403 })

    // Recuperer l'enfant avec ses progres
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('*')
      .eq('id', params.id)
      .single()

    if (childError || !child) {
      return NextResponse.json({ error: 'Enfant introuvable.' }, { status: 404 })
    }

    const { data: progressData } = await supabase
      .from('progress')
      .select('item_id, score, updated_at')
      .eq('child_id', params.id)

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, current_period_start')
      .eq('child_id', params.id)
      .single()

    const lettersLearned = progressData?.filter((p) => p.score >= 80).length ?? 0
    const avgScore =
      progressData && progressData.length > 0
        ? Math.round(progressData.reduce((sum, p) => sum + p.score, 0) / progressData.length)
        : 0

    return NextResponse.json({
      child: {
        ...child,
        stats: {
          lettersLearned,
          avgScore,
          lettersInProgress: progressData?.filter((p) => p.score > 0 && p.score < 80).length ?? 0,
        },
        progress: progressData ?? [],
        subscription: subscription ?? { status: 'inactive', currentPeriodStart: null },
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 })

    const isOwner = await verifyChildOwnership(params.id, session.user.id)
    if (!isOwner) return NextResponse.json({ error: 'Acces refuse.' }, { status: 403 })

    const body = await req.json()
    const parsed = updateChildSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { data: updated, error: updateError } = await supabase
      .from('children')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Erreur lors de la mise a jour.' }, { status: 500 })
    }

    return NextResponse.json({ child: updated })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 })

    const isOwner = await verifyChildOwnership(params.id, session.user.id)
    if (!isOwner) return NextResponse.json({ error: 'Acces refuse.' }, { status: 403 })

    // La suppression en cascade est geree par Supabase (ON DELETE CASCADE)
    const { error: deleteError } = await supabase
      .from('children')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
