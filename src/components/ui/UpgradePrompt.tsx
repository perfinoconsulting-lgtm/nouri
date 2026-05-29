'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  childId: string
  childPrenom: string
  featureName: string
  onClose?: () => void
}

export default function UpgradePrompt({ childId, childPrenom, featureName, onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubscribe() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId }),
      })
      const data: { url?: string; error?: string } = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Une erreur est survenue')
      router.push(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-title"
    >
      {/* Carte centrée — stopPropagation évite la fermeture au clic interne */}
      <div
        className="w-full max-w-[360px] bg-white rounded-2xl shadow-2xl p-6 relative"
        style={{ animation: 'popIn 300ms ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton fermer */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        )}

        {/* Cadenas flottant */}
        <div className="flex justify-center mt-2 mb-5">
          <span
            className="text-6xl select-none"
            style={{ animation: 'float 2s ease-in-out infinite' }}
          >
            🔒
          </span>
        </div>

        <h3
          id="upgrade-title"
          className="text-xl font-bold text-[#1A3A5C] text-center mb-2"
        >
          Ce module est réservé aux abonnés ✨
        </h3>

        <p className="text-gray-500 text-sm text-center mb-6 leading-relaxed">
          Débloquez{' '}
          <span className="font-semibold text-[#1A3A5C]">{featureName}</span>{' '}
          pour{' '}
          <span className="font-semibold text-[#1A3A5C]">{childPrenom}</span>{' '}
          — seulement{' '}
          <span className="font-bold text-[#F5A623]">2€/mois</span>
        </p>

        {error && (
          <p className="text-[#E74C3C] text-sm text-center mb-4 px-2">{error}</p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-4 bg-[#F5A623] text-[#1A3A5C] font-bold rounded-xl min-h-[52px] transition-colors hover:bg-[#e09520] active:bg-[#c8851f] disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {loading ? 'Chargement…' : `Abonner ${childPrenom} →`}
          </button>

          <Link
            href="/tarifs"
            className="w-full py-3 text-[#1A3A5C] font-semibold rounded-xl min-h-[48px] flex items-center justify-center border border-gray-200 transition-colors hover:bg-gray-50 text-sm"
          >
            Voir ce qui est inclus →
          </Link>
        </div>
      </div>
    </div>
  )
}
