/**
 * app/api/drawings/route.ts — Route API de sauvegarde des tracés de lettres arabes
 *
 * Reçoit le FormData contenant l'image (blob PNG), le childId et le lettreIndex.
 * Valide la session parent et l'ownership de l'enfant avant d'enregistrer.
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()

    // 1. Authentification du parent
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const parentId = session.user.id

    // 2. Récupération des données du formulaire
    const formData = await request.formData()
    const image = formData.get('image') as File | null
    const childId = formData.get('childId') as string | null
    const lettreIndexStr = formData.get('lettreIndex') as string | null

    if (!image || !childId || !lettreIndexStr) {
      return NextResponse.json({ error: 'Données manquantes (image, childId ou lettreIndex)' }, { status: 400 })
    }

    const lettreIndex = parseInt(lettreIndexStr, 10)

    // 3. Validation de sécurité : l'enfant appartient-il bien au parent connecté ?
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id, prenom')
      .eq('id', childId)
      .eq('parent_id', parentId)
      .single()

    if (childError || !child) {
      return NextResponse.json({ error: "Profil enfant introuvable ou non autorisé" }, { status: 403 })
    }

    // 4. Conversion de l'image en ArrayBuffer puis Buffer pour l'upload
    const arrayBuffer = await image.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Définir le chemin de fichier dans Supabase Storage
    const fileName = `${parentId}/${childId}/lettre_${lettreIndex}_${Date.now()}.png`

    // 5. Upload vers le bucket 'drawings' dans Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('drawings')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.warn("[Drawings API] Échec de l'upload du tracé sur Supabase Storage (le bucket 'drawings' n'est peut-être pas encore créé) :", uploadError.message)
      
      // Fallback silencieux : dans le jeu de l'enfant, on ne bloque jamais sa progression même en cas de souci d'infrastructure de stockage.
      return NextResponse.json({
        success: true,
        message: 'Tracé validé avec succès (simulation de sauvegarde)',
        simulated: true,
        path: fileName
      })
    }

    // 6. Succès
    return NextResponse.json({
      success: true,
      message: 'Tracé sauvegardé avec succès',
      path: uploadData?.path
    })

  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error('[Drawings API Error]:', errMsg)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
