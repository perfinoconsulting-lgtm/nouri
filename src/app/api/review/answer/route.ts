// Route POST /api/review/answer — enregistre la réponse d'un enfant
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { processAnswer } from '@/lib/spaced-repetition'

interface AnswerBody {
  childId: string
  itemId: string
  itemType: 'lettre' | 'syllabe' | 'mot' | 'verset'
  wasCorrect: boolean
  responseTimeMs: number
  streak?: number
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const body = (await req.json()) as AnswerBody
    const { childId, itemId, itemType, wasCorrect, responseTimeMs, streak = 0 } = body

    if (!childId || !itemId || !itemType || wasCorrect === undefined || responseTimeMs === undefined) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    // Vérification ownership : l'enfant appartient bien à ce parent
    const { data: child, error: ownerError } = await supabase
      .from('children')
      .select('id')
      .eq('id', childId)
      .eq('parent_id', session.user.id)
      .single()

    if (ownerError || !child) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    const result = await processAnswer({
      childId,
      itemId,
      itemType,
      wasCorrect,
      responseTimeMs,
      streak,
    })

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
