'use client'

/**
 * components/dashboard/CreateChildModal.tsx -- Modale de creation de profil enfant
 *
 * Client Component -- interactions et animations
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2 } from 'lucide-react'
import { z } from 'zod'

const AVATARS = ['🌙', '⭐', '🦁', '🐯', '🐻', '🐼', '🦊', '🐸', '🦋', '🌺', '🎯', '🚀']
const AGES = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

const NIVEAUX = [
  { value: 1, label: 'Debutant complet', emoji: '🌱', description: 'Je ne connais pas encore les lettres arabes' },
  { value: 2, label: 'Je connais quelques lettres', emoji: '⭐', description: 'J\'ai deja vu quelques lettres' },
  { value: 3, label: 'Je connais l\'alphabet', emoji: '📚', description: 'Je connais les 28 lettres' },
]

const LEVEL_COLORS: Record<number, string> = {
  1: 'border-2 border-gray-400 bg-gray-50 text-gray-700',
  2: 'border-2 border-yellow-400 bg-yellow-50 text-yellow-700',
  3: 'border-2 border-blue-400 bg-blue-50 text-blue-700',
}
const LEVEL_COLORS_SELECTED: Record<number, string> = {
  1: 'border-2 border-gray-600 bg-gray-100 ring-2 ring-gray-400',
  2: 'border-2 border-yellow-500 bg-yellow-100 ring-2 ring-yellow-400',
  3: 'border-2 border-blue-500 bg-blue-100 ring-2 ring-blue-400',
}

const schema = z.object({
  prenom: z.string().min(1, 'Le prenom est requis').max(30, 'Max 30 caracteres'),
  age: z.number().min(4).max(14),
  avatar: z.string(),
  niveau: z.number().min(1).max(5),
})

interface Props {
  onClose: () => void
}

export default function CreateChildModal({ onClose }: Props) {
  const router = useRouter()
  const [prenom, setPrenom] = useState('')
  const [age, setAge] = useState<number | null>(null)
  const [avatar, setAvatar] = useState('🌙')
  const [niveau, setNiveau] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validation = schema.safeParse({ prenom, age, avatar, niveau })
    if (!validation.success) {
      setError(validation.error.issues[0].message)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, age, avatar, niveau }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur lors de la creation.')

      router.refresh()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl animate-in slide-in-from-bottom-8 duration-300 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-[#0a192f]">Nouveau profil enfant</h2>
            <p className="text-sm text-gray-500 mt-0.5">Personnalisez le profil de votre enfant</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Prenom */}
          <div>
            <label className="block text-sm font-semibold text-[#0a192f] mb-2">
              Prenom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Ex : Yanis, Sofia..."
              maxLength={30}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5A623] text-[#0a192f] font-medium"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-semibold text-[#0a192f] mb-3">
              Age <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {AGES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAge(a)}
                  className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
                    age === a
                      ? 'bg-[#0a192f] text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {a} ans
                </button>
              ))}
            </div>
          </div>

          {/* Avatar */}
          <div>
            <label className="block text-sm font-semibold text-[#0a192f] mb-3">Choisir un avatar</label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setAvatar(em)}
                  className={`aspect-square rounded-2xl text-2xl flex items-center justify-center transition-all ${
                    avatar === em
                      ? 'bg-[#F5A623]/20 ring-2 ring-[#F5A623] scale-110 shadow-md'
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Niveau */}
          <div>
            <label className="block text-sm font-semibold text-[#0a192f] mb-3">Niveau de depart</label>
            <div className="space-y-2">
              {NIVEAUX.map((n) => (
                <button
                  key={n.value}
                  type="button"
                  onClick={() => setNiveau(n.value)}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    niveau === n.value
                      ? LEVEL_COLORS_SELECTED[n.value]
                      : LEVEL_COLORS[n.value] + ' hover:opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{n.emoji}</span>
                    <div>
                      <p className="font-bold text-sm">{n.label}</p>
                      <p className="text-xs opacity-70 mt-0.5">{n.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-[#F5A623] text-white font-bold rounded-2xl hover:bg-[#e09520] transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creation en cours...
              </>
            ) : (
              'Creer le profil'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
