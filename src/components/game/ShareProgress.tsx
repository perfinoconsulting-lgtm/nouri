'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import type { ChildWithStats } from '@/types/dashboard'

interface ShareProgressProps {
  child: ChildWithStats
}

export default function ShareProgress({ child }: ShareProgressProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [partage, setPartage] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const lettersCount = child.stats.lettersLearned
  const avatar = child.avatar ?? '🌙'

  const messageWA =
    `${child.prenom} vient d'apprendre ses ${lettersCount} premières lettres arabes 🌙\n` +
    `Avec l'app Lisani — à partir de 4 ans, seulement 2€/mois !\n` +
    `lisani.tech`

  // Dessine le canvas — appelé au montage et avant l'export
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Fond bleu nuit
    ctx.fillStyle = '#1A3A5C'
    ctx.fillRect(0, 0, 300, 200)

    // 10 étoiles blanches
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    const etoiles: [number, number][] = [
      [18, 14], [48, 32], [82, 10], [128, 22], [168, 8],
      [202, 28], [238, 16], [268, 38], [288, 18], [112, 44],
    ]
    for (const [x, y] of etoiles) {
      ctx.beginPath()
      ctx.arc(x, y, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // Avatar emoji centré (3rem ≈ 48px)
    ctx.font = '48px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(avatar, 150, 82)

    // Ligne principale en or
    ctx.fillStyle = '#F5A623'
    ctx.font = 'bold 13px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(`${child.prenom} a appris ${lettersCount} lettres arabes`, 150, 126)

    // Sous-titre blanc
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '11px system-ui, sans-serif'
    ctx.fillText('sur Lisani ! 🌙⭐', 150, 144)

    // URL discrète en bas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
    ctx.font = '10px system-ui, sans-serif'
    ctx.fillText('lisani.tech', 150, 185)
  }, [child.prenom, lettersCount, avatar])

  // Rendu au montage et à chaque changement d'enfant
  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  // Retourne un Blob PNG depuis le canvas
  function getBlob(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const canvas = canvasRef.current
      if (!canvas) {
        resolve(null)
        return
      }
      try {
        canvas.toBlob((blob) => resolve(blob), 'image/png')
      } catch {
        resolve(null)
      }
    })
  }

  async function handlePartager() {
    setPartage(true)
    setErreur(null)
    try {
      const blob = await getBlob()

      // Partage natif (mobile)
      if (blob && typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
        const file = new File([blob], `${child.prenom}-progres-lisani.png`, { type: 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            text: messageWA,
            title: `Progrès de ${child.prenom} sur Lisani`,
          })
          return
        }
      }

      // Fallback : télécharger l'image
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${child.prenom}-progres-lisani.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      // AbortError = l'utilisateur a annulé le partage natif, pas une vraie erreur
      if (err instanceof Error && err.name !== 'AbortError') {
        setErreur('Impossible de partager. Essayez le téléchargement.')
      }
    } finally {
      setPartage(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Aperçu canvas */}
      <canvas
        ref={canvasRef}
        width={300}
        height={200}
        className="rounded-2xl shadow-lg border border-white/20 max-w-full"
      />

      {erreur && (
        <p className="text-[#E74C3C] text-sm text-center">{erreur}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        {/* Partage natif ou téléchargement */}
        <button
          onClick={handlePartager}
          disabled={partage}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#F5A623] text-[#1A3A5C] font-bold rounded-xl hover:bg-[#e09520] transition disabled:opacity-60 min-h-[48px] text-sm"
        >
          {partage ? '…' : '📤 Partager les progrès'}
        </button>

        {/* Bouton WhatsApp toujours disponible */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(messageWA)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#1da855] transition min-h-[48px] text-sm"
        >
          💬 WhatsApp
        </a>
      </div>
    </div>
  )
}
