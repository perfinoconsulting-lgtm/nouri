'use client'

/**
 * components/dashboard/DeleteChildButton.tsx -- Bouton de suppression de profil enfant
 *
 * Affiche une modale de confirmation avant de supprimer le profil.
 * Redirige vers /enfants apres suppression reussie.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, AlertTriangle, X } from 'lucide-react'

interface DeleteChildButtonProps {
  childId: string
  childPrenom: string
}

export default function DeleteChildButton({ childId, childPrenom }: DeleteChildButtonProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/children/${childId}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Erreur lors de la suppression.')

      router.push('/enfants')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-600 border border-red-100 font-bold rounded-xl hover:bg-red-100 transition"
      >
        <Trash2 size={16} />
        Supprimer ce profil
      </button>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && !isLoading && setIsModalOpen(false)}
        >
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center shrink-0">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <button
                onClick={() => !isLoading && setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <h2 className="text-xl font-bold text-[#0a192f] mb-2">
              Supprimer le profil de {childPrenom} ?
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Cette action est irreversible. Toutes les donnees de progression, les sessions et
              l&apos;abonnement associe a ce profil seront definitivement supprimes.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isLoading}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Suppression...
                  </>
                ) : (
                  'Supprimer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
