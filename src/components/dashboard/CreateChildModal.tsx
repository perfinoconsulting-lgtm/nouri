'use client'

/**
 * components/dashboard/CreateChildModal.tsx — Modale création profil enfant
 * Animation slide-up CSS pure (pas de lib externe)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2 } from 'lucide-react'
import { z } from 'zod'

const AVATARS = ['🌙', '⭐', '🦁', '🐯', '🐻', '🐼', '🦊', '🐸', '🦋', '🌺', '🎯', '🚀']
const AGES = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

const NIVEAUX = [
  {
    value: 1,
    label: 'Débutant complet 🌱',
    desc: "Je ne connais pas encore les lettres arabes",
  },
  {
    value: 2,
    label: 'Je connais quelques lettres ⭐',
    desc: "J'ai déjà vu quelques lettres arabes",
  },
  {
    value: 3,
    label: "Je connais l'alphabet 📚",
    desc: "Je connais les 28 lettres arabes",
  },
]

const schema = z.object({
  prenom: z.string().min(1, 'Le prénom est requis').max(30, 'Max 30 caractères'),
  age: z.number({ message: "L'âge est requis" }).min(4).max(14),
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

    const result = schema.safeParse({ prenom: prenom.trim(), age, avatar, niveau })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erreur lors de la création.')
      router.refresh()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Keyframe slide-up — pas de lib externe */}
      <style>{`
        @keyframes nourSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .nour-slide-up { animation: nourSlideUp 300ms ease-out forwards; }
      `}</style>

      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl nour-slide-up overflow-y-auto max-h-[92vh]">

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
            <div>
              <h2 className="text-xl font-bold text-[#1A3A5C]">Nouveau profil enfant</h2>
              <p className="text-sm text-gray-500 mt-0.5">Personnalisez le profil de votre enfant</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer la modale"
              className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition shrink-0"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-7">

            {/* Prénom */}
            <div>
              <label htmlFor="child-prenom" className="block text-sm font-semibold text-[#1A3A5C] mb-2">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                id="child-prenom"
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Prénom de ton enfant"
                maxLength={30}
                autoComplete="off"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5A623] text-[#1A3A5C] font-medium text-base"
              />
            </div>

            {/* Âge — pills cliquables */}
            <div>
              <p className="text-sm font-semibold text-[#1A3A5C] mb-3">
                Âge <span className="text-red-500">*</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {AGES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAge(a)}
                    className={`min-w-[48px] min-h-[48px] px-3 py-2 rounded-full font-bold text-sm transition-all ${
                      age === a
                        ? 'bg-[#F5A623] text-[#1A3A5C] shadow-md scale-105'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar — grille 4 colonnes × 3 lignes */}
            <div>
              <p className="text-sm font-semibold text-[#1A3A5C] mb-3">Avatar</p>
              <div className="grid grid-cols-4 gap-3">
                {AVATARS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setAvatar(em)}
                    className={`aspect-square rounded-2xl text-3xl flex items-center justify-center transition-all min-h-[64px] ${
                      avatar === em
                        ? 'ring-2 ring-[#F5A623] bg-amber-50 shadow-md'
                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                    }`}
                    style={avatar === em ? { transform: 'scale(1.2)' } : undefined}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Niveau — cartes radio visuelles */}
            <div>
              <p className="text-sm font-semibold text-[#1A3A5C] mb-3">Niveau de départ</p>
              <div className="space-y-2">
                {NIVEAUX.map((n) => (
                  <button
                    key={n.value}
                    type="button"
                    onClick={() => setNiveau(n.value)}
                    className={`w-full p-4 rounded-xl text-left transition-all border-2 min-h-[64px] ${
                      niveau === n.value
                        ? 'border-[#F5A623] bg-amber-50 ring-2 ring-amber-200'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="font-bold text-sm text-[#1A3A5C]">{n.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
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
              className="w-full py-4 bg-[#F5A623] text-[#1A3A5C] font-bold rounded-2xl hover:bg-[#e09520] transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 min-h-[56px] text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Création en cours…
                </>
              ) : (
                'Créer le profil →'
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
