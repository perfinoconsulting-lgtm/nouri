import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

// Génère un code de 6 chars depuis le SHA-256 du parentId + sel optionnel
function generateCode(seed: string): string {
  return createHash('sha256')
    .update(seed)
    .digest('hex')
    .slice(0, 6)
    .toUpperCase()
}

// GET — code de parrainage du parent connecté + stats + historique
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const parentId = session.user.id

    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .select('referral_code, prenom')
      .eq('id', parentId)
      .single()

    if (parentError) {
      return NextResponse.json({ error: 'Profil parent introuvable.' }, { status: 404 })
    }

    let code = (parent?.referral_code as string | null) ?? null

    // Générer et persister le code si absent
    if (!code) {
      code = generateCode(parentId)

      // Résoudre les collisions (improbable avec 16^6 possibilités)
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data: collision } = await supabase
          .from('parents')
          .select('id')
          .eq('referral_code', code)
          .maybeSingle()

        if (!collision) break
        code = generateCode(parentId + String(attempt))
      }

      await supabase
        .from('parents')
        .update({ referral_code: code })
        .eq('id', parentId)
    }

    // Statistiques de parrainage
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('id, created_at, status')
      .eq('referrer_id', parentId)
      .order('created_at', { ascending: false })

    if (referralsError) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des parrainages.' },
        { status: 500 }
      )
    }

    const referralsList = referrals ?? []
    const monthsEarned = referralsList.filter((r) => r.status === 'completed').length

    // Prénom du premier enfant pour le message WhatsApp
    const { data: firstChild } = await supabase
      .from('children')
      .select('prenom')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      code,
      firstChildPrenom: (firstChild?.prenom as string | null) ?? null,
      stats: {
        referrals: referralsList.length,
        monthsEarned,
      },
      historique: referralsList,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

const applyCodeSchema = z.object({
  code: z.string().length(6, 'Le code doit faire exactement 6 caractères'),
})

// POST — appliquer un code de parrainage
export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const referredId = session.user.id

    const body: unknown = await req.json()
    const parsed = applyCodeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Code invalide' },
        { status: 400 }
      )
    }

    const { code } = parsed.data

    // Vérifier que le code existe et récupérer le référant
    const { data: referrer, error: referrerError } = await supabase
      .from('parents')
      .select('id, stripe_customer_id')
      .eq('referral_code', code)
      .maybeSingle()

    if (referrerError || !referrer) {
      return NextResponse.json({ error: 'Code de parrainage invalide.' }, { status: 400 })
    }

    // Bloquer l'auto-parrainage
    if ((referrer.id as string) === referredId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas utiliser votre propre code.' },
        { status: 400 }
      )
    }

    // Vérifier que ce parent n'a pas déjà utilisé un code (UNIQUE sur referred_id)
    const { data: alreadyUsed } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_id', referredId)
      .maybeSingle()

    if (alreadyUsed) {
      return NextResponse.json(
        { error: 'Vous avez déjà utilisé un code de parrainage.' },
        { status: 400 }
      )
    }

    // Enregistrer le parrainage
    const { error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrer.id as string,
        referred_id: referredId,
        code,
        status: 'pending',
      })

    if (insertError) {
      // Code 23505 = violation de contrainte UNIQUE — déjà utilisé
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Vous avez déjà utilisé un code de parrainage.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement du parrainage." },
        { status: 500 }
      )
    }

    // Appliquer le crédit Stripe au référant (best-effort, non bloquant)
    const referrerCustomerId = referrer.stripe_customer_id as string | null
    if (referrerCustomerId) {
      try {
        // Crédit de 2€ sur le solde client — appliqué automatiquement à la prochaine facture
        await stripe.customers.createBalanceTransaction(referrerCustomerId, {
          amount: -200,
          currency: 'eur',
          description: '1 mois gratuit parrainage NourAl',
        })

        // Marquer le parrainage comme complété
        await supabase
          .from('referrals')
          .update({
            status: 'completed',
            reward_applied_at: new Date().toISOString(),
          })
          .eq('referrer_id', referrer.id as string)
          .eq('referred_id', referredId)
      } catch {
        // Erreur Stripe non fatale — le parrainage reste en 'pending' pour traitement manuel
      }
    }

    return NextResponse.json({ success: true, monthsOffered: 1 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
