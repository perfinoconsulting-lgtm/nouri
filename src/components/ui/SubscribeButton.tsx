'use client'

/**
 * components/ui/SubscribeButton.tsx — Bouton d'abonnement/gestion Stripe
 *
 * Props :
 *   childId       → UUID de l'enfant
 *   childPrenom   → Prénom affiché sur le bouton
 *   isSubscribed  → true = abonné (→ portal), false = non abonné (→ checkout)
 *   disabled      → Désactiver le bouton si besoin
 */

import { useState } from 'react'
import { CreditCard, Settings, Loader2 } from 'lucide-react'

interface SubscribeButtonProps {
  childId: string
  childPrenom: string
  isSubscribed: boolean
  disabled?: boolean
}

export default function SubscribeButton({
  childId,
  childPrenom,
  isSubscribed,
  disabled = false,
}: SubscribeButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAction = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Choisir l'endpoint selon le statut d'abonnement
      const endpoint = isSubscribed ? '/api/stripe/portal' : '/api/stripe/checkout'
      const body = isSubscribed ? {} : { childId }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data: { url?: string; error?: string } = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error ?? 'Une erreur est survenue.')
      }

      if (!data.url) {
        throw new Error('Aucune URL de redirection retournée par le serveur.')
      }

      // Redirection vers Stripe Checkout ou Customer Portal
      window.location.href = data.url
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(message)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleAction}
        disabled={disabled || isLoading}
        className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold transition-all shadow-sm w-full text-sm ${
          isSubscribed
            ? 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            : 'bg-[#F5A623] text-white hover:bg-[#e09520] hover:shadow-md hover:-translate-y-0.5 transform'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Chargement…</span>
          </>
        ) : isSubscribed ? (
          <>
            <Settings size={16} />
            <span>Gérer l'abonnement</span>
          </>
        ) : (
          <>
            <CreditCard size={16} />
            <span>Abonner {childPrenom}</span>
          </>
        )}
      </button>

      {error && (
        <p className="text-xs text-red-600 text-center px-2">{error}</p>
      )}
    </div>
  )
}
