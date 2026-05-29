import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateParentSchema = z.object({
  prenom: z.string().min(1, 'Le prénom est requis').max(50, 'Prénom trop long'),
})

export async function PATCH(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const body: unknown = await req.json()
    const parsed = updateParentSchema.safeParse(body)

    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join(', ')
      return NextResponse.json({ error: messages }, { status: 400 })
    }

    const { error } = await supabase
      .from('parents')
      .update({ prenom: parsed.data.prenom })
      .eq('id', session.user.id)

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('PATCH /api/parents/me:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
