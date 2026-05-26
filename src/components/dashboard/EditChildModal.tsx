'use client'

/**
 * components/dashboard/EditChildModal.tsx -- Modale d'edition de profil enfant
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2 } from 'lucide-react'
import { z } from 'zod'

const AVATARS = ['🌙', '⭐', '🦁', '🐯', '🐻', '🐼', '🦊', '🐸', '🦋', '🌺', '🎯', '🚀']
const AGES = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

const NIVEAUX = [
  { value: 1, label: 'Debutant complet', emoji: '🌱' },
  { value: 2, label: 'Je connais quelques lettres', emoji: '⭐' },
  { value: 3, label: 'Je connais l\'alphabet', emoji: '📚' },
]

const schema = z.object({
  prenom: z.string().min(1, 'Le prenom est requis').max(30, 'Max 30 caracteres'),
  age: z.number().min(4).max(14),
  avatar: z.string(),
  niveau: z.number().min(1).max(5),
})

interface EditChildModalProps {
  child: {
    id: string
    prenom: string
    age: number
    avatar: string | null
    niveau: number
  }
  onClose: () => void
}

export default function EditChildModal({ child, onClose }: EditChildModalProps) {
  const router = useRouter()
  const [prenom, setPrenom] = useState(child.prenom)
  const [age, setAge] = useState<number>(child.age)
  const [avatar, setAvatar] = useState(child.avatar ?? '🌙')
  const [niveau, setNiveau] = useState(child.niveau)
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
      const res = await fetch(`/api/children/${child.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, age, avatar, niveau }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur lors de la mise a jour.')

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
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-[#0a192f]">Modifier le profil</h2>
            <p className="text-sm text-gray-500 mt-0.5">Profil de {child.prenom}</p>
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
              maxLength={30}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5A623] text-[#0a192f] font-medium"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-semibold text-[#0a192f] mb-3">Age</label>
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
            <label className="block text-sm font-semibold text-[#0a192f] mb-3">Avatar</label>
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
            <label className="block text-sm font-semibold text-[#0a192f] mb-3">Niveau</label>
            <div className="space-y-2">
              {NIVEAUX.map((n) => (
                <button
                  key={n.value}
                  type="button"
                  onClick={() => setNiveau(n.value)}
                  className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 border-2 ${
                    niveau === n.value
                      ? 'border-[#F5A623] bg-[#F5A623]/10 ring-2 ring-[#F5A623]/30'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{n.emoji}</span>
                  <span className="font-bold text-sm text-[#0a192f]">{n.label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-4 bg-[#F5A623] text-white font-bold rounded-2xl hover:bg-[#e09520] transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
