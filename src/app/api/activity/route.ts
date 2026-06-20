import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const activitySchema = z.object({
  childId: z.string().uuid('ID enfant invalide'),
  moduleSlug: z.string().min(1).max(50),
  activityLabel: z.string().max(120).nullable().optional(),
  activityAr: z.string().max(200).nullable().optional(),
  viewName: z.string().max(50).nullable().optional(),
  progressPercent: z.number().int().min(0).max(100).nullable().optional(),
  isActive: z.boolean().default(true),
})

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const parsed = activitySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Données invalides.' },
        { status: 400 }
      )
    }

    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id')
      .eq('id', parsed.data.childId)
      .eq('parent_id', session.user.id)
      .single()

    if (childError || !child) {
      return NextResponse.json(
        { error: 'Enfant introuvable ou accès refusé.' },
        { status: 403 }
      )
    }

    const { error } = await supabase.from('child_live_activity').upsert(
      {
        child_id: parsed.data.childId,
        parent_id: session.user.id,
        module_slug: parsed.data.moduleSlug,
        activity_label: parsed.data.activityLabel ?? null,
        activity_ar: parsed.data.activityAr ?? null,
        view_name: parsed.data.viewName ?? null,
        progress_percent: parsed.data.progressPercent ?? null,
        is_active: parsed.data.isActive,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'child_id' }
    )

    if (error) {
      console.error('[Activité enfant] Échec de mise à jour :', error)
      return NextResponse.json(
        { error: "Impossible d'enregistrer l'activité." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('POST /api/activity :', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

