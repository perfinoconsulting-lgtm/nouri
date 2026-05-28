/**
 * app/api/drawings/route.ts — Sauvegarde et récupération des tracés de lettres arabes
 *
 * POST : Upload le tracé dans Supabase Storage, limite à 3 tracés max par lettre en supprimant le plus ancien.
 * GET : Récupère les URLs publiques des 3 tracés les plus récents pour une lettre donnée.
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// POST : Sauvegarder un tracé
export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    // 1. Authentification
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const parentId = session.user.id

    // 2. Extraction du FormData
    const formData = await req.formData()
    const image = formData.get('image') as File | null
    const childId = formData.get('childId') as string | null
    const lettreIndexStr = formData.get('lettreIndex') as string | null

    if (!image || !childId || !lettreIndexStr) {
      return NextResponse.json(
        { error: 'Données manquantes (image, childId ou lettreIndex).' },
        { status: 400 }
      )
    }

    const lettreIndex = parseInt(lettreIndexStr, 10)
    if (isNaN(lettreIndex)) {
      return NextResponse.json({ error: 'Index de lettre invalide.' }, { status: 400 })
    }

    // 3. Sécurité : vérifier l'appartenance de l'enfant
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id')
      .eq('id', childId)
      .eq('parent_id', parentId)
      .single()

    if (childError || !child) {
      return NextResponse.json({ error: 'Enfant introuvable ou accès refusé.' }, { status: 403 })
    }

    // 4. Conversion du fichier
    const arrayBuffer = await image.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const folderPath = `${childId}/${lettreIndex}`
    const fileName = `${folderPath}/${Date.now()}.png`

    // 5. Upload vers Supabase Storage dans le bucket 'drawings'
    const { error: uploadError } = await supabase.storage
      .from('drawings')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.warn('[Drawings API] Échec de l’upload (bucket "drawings" manquant ou inaccessible) :', uploadError.message)
      // Fallback silencieux pour ne pas bloquer l'expérience utilisateur de l'enfant
      return NextResponse.json({
        url: '',
        success: true,
        simulated: true,
      })
    }

    // 6. Nettoyage : Garder seulement les 3 plus récents
    const { data: fileList } = await supabase.storage
      .from('drawings')
      .list(folderPath)

    const files = (fileList ?? []).filter((f) => f.name.endsWith('.png'))
    // Trier par timestamp croissant (plus ancien en premier)
    files.sort((a, b) => a.name.localeCompare(b.name))

    if (files.length > 3) {
      const filesToDelete = files.slice(0, files.length - 3).map((f) => `${folderPath}/${f.name}`)
      await supabase.storage.from('drawings').remove(filesToDelete)
    }

    // 7. Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('drawings')
      .getPublicUrl(fileName)

    return NextResponse.json({
      url: publicUrl,
      success: true,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('POST /api/drawings:', message)
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 })
  }
}

// GET : Lister les tracés existants (max 3, du plus récent au plus ancien)
export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    // 1. Authentification
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const parentId = session.user.id

    // 2. Extraction des paramètres de recherche
    const { searchParams } = new URL(req.url)
    const childId = searchParams.get('childId')
    const lettreIndexStr = searchParams.get('lettreIndex')

    if (!childId || !lettreIndexStr) {
      return NextResponse.json({ error: 'Paramètres childId et lettreIndex requis.' }, { status: 400 })
    }

    const lettreIndex = parseInt(lettreIndexStr, 10)
    if (isNaN(lettreIndex)) {
      return NextResponse.json({ error: 'Index de lettre invalide.' }, { status: 400 })
    }

    // 3. Sécurité : vérifier l'appartenance de l'enfant
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id')
      .eq('id', childId)
      .eq('parent_id', parentId)
      .single()

    if (childError || !child) {
      return NextResponse.json({ error: 'Enfant introuvable ou accès refusé.' }, { status: 403 })
    }

    const folderPath = `${childId}/${lettreIndex}`

    // 4. Lister les fichiers dans le stockage
    const { data: fileList, error: listError } = await supabase.storage
      .from('drawings')
      .list(folderPath)

    if (listError) {
      // Retourner une liste vide en cas d'erreur de bucket inexistant
      return NextResponse.json({ urls: [] })
    }

    const files = (fileList ?? []).filter((f) => f.name.endsWith('.png'))
    // Trier du plus récent au plus ancien (décroissant)
    files.sort((a, b) => b.name.localeCompare(a.name))

    // Prendre les 3 plus récents
    const recentFiles = files.slice(0, 3)

    // 5. Générer les URLs publiques
    const urls = recentFiles.map((f) => {
      return supabase.storage.from('drawings').getPublicUrl(`${folderPath}/${f.name}`).data.publicUrl
    })

    return NextResponse.json({ urls })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('GET /api/drawings:', message)
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 })
  }
}
