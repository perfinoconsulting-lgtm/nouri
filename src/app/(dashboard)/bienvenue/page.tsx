'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import ProgressWizard from '@/components/ui/ProgressWizard'

// ── Données statiques ────────────────────────────────────────────

const AVATARS = ['🌙', '⭐', '🦁', '🐯', '🐻', '🐼', '🦊', '🐸', '🦋', '🌺', '🎯', '🚀']

const NIVEAUX = [
  { value: 1, label: 'Débutant complet', emoji: '🌱', desc: 'Je ne connais pas encore les lettres' },
  { value: 2, label: 'Quelques lettres', emoji: '⭐', desc: 'Je connais quelques lettres arabes' },
  { value: 3, label: "L'alphabet complet", emoji: '📚', desc: 'Je connais toutes les lettres' },
]

const WIZARD_LABELS = ['Bienvenue', 'Votre enfant', "C'est parti !"]

// ── Schéma de validation ─────────────────────────────────────────

const childSchema = z.object({
  prenom: z.string().min(1, 'Le prénom est requis').max(30, 'Prénom trop long'),
  age: z.number().int().min(4, 'Âge minimum : 4 ans').max(14, 'Âge maximum : 14 ans'),
  avatar: z.string().min(1),
  niveau: z.number().int().min(1).max(3),
})

type ChildFormValues = z.infer<typeof childSchema>

interface CreatedChild {
  id: string
  prenom: string
  avatar: string
}

// ── Hook confetti — positions déterministes (pas de Math.random) ──

function useConfettiPieces() {
  return useMemo(() => {
    const colors = ['#F5A623', '#FF6B9D', '#00C9B1', '#27AE60', '#1A3A5C', '#FFD700']
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: `${((i * 3.7) % 100).toFixed(1)}%`,
      color: colors[i % colors.length],
      delay: `${((i * 0.11) % 1.4).toFixed(2)}s`,
      duration: `${(1.3 + (i % 5) * 0.22).toFixed(2)}s`,
      width: 5 + (i % 3) * 4,
      height: 5 + (i % 4) * 3,
      borderRadius: i % 5 === 0 ? '50%' : '2px',
    }))
  }, [])
}

// ── Composant principal ──────────────────────────────────────────

export default function BienvenuePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [prenomParent, setPrenomParent] = useState('')
  const [createdChild, setCreatedChild] = useState<CreatedChild | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const confettiPieces = useConfettiPieces()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ChildFormValues>({
    resolver: zodResolver(childSchema),
    defaultValues: {
      avatar: '🌙',
      niveau: 1,
    },
  })

  const watchAge = watch('age')
  const watchAvatar = watch('avatar')
  const watchNiveau = watch('niveau')

  // Récupération du prénom du parent pour la page de bienvenue
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      supabase
        .from('parents')
        .select('prenom')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.prenom) setPrenomParent(data.prenom as string)
        })
    })
  }, [])

  async function onSubmit(values: ChildFormValues) {
    setSubmitting(true)
    setApiError(null)
    try {
      const res = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data: { child?: { id: string; prenom: string; avatar: string }; error?: string } =
        await res.json()
      if (!res.ok || !data.child) throw new Error(data.error ?? 'Erreur lors de la création')
      setCreatedChild({ id: data.child.id, prenom: data.child.prenom, avatar: data.child.avatar })
      setStep(3)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  // Réinitialise le formulaire pour créer un deuxième enfant
  function resetForNewChild() {
    setCreatedChild(null)
    setApiError(null)
    reset()
    setStep(2)
  }

  return (
    <div className="min-h-[70vh] flex flex-col gap-8">
      {/* Barre de progression */}
      <ProgressWizard currentStep={step} totalSteps={3} labels={WIZARD_LABELS} />

      {/* ── ÉTAPE 1 — BIENVENUE ──────────────────────────────────── */}
      {step === 1 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12 gap-8">
          {/* Lune + étoiles animées */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            <span
              className="text-7xl"
              style={{ animation: 'float 3s ease-in-out infinite' }}
            >
              🌙
            </span>
            <span
              className="absolute top-1 right-2 text-2xl"
              style={{ animation: 'pulse 2s ease-in-out infinite' }}
            >
              ⭐
            </span>
            <span
              className="absolute top-7 left-0 text-xl"
              style={{ animation: 'pulse 2s ease-in-out infinite 0.5s' }}
            >
              ✨
            </span>
            <span
              className="absolute bottom-4 right-0 text-xl"
              style={{ animation: 'pulse 2s ease-in-out infinite 1s' }}
            >
              ⭐
            </span>
            <span
              className="absolute bottom-1 left-5 text-lg"
              style={{ animation: 'pulse 2s ease-in-out infinite 1.5s' }}
            >
              ✨
            </span>
          </div>

          <div className="space-y-3 max-w-md">
            <h1 className="text-3xl md:text-4xl font-bold text-[#1A3A5C]">
              {prenomParent ? (
                <>
                  Bienvenue <span className="text-[#F5A623]">{prenomParent}</span> ! 🌙
                </>
              ) : (
                'Bienvenue ! 🌙'
              )}
            </h1>
            <p className="text-gray-500 text-base md:text-lg leading-relaxed">
              Vous êtes à quelques étapes de lancer l&apos;aventure de l&apos;arabe pour votre
              enfant. Ensemble, créons son espace d&apos;apprentissage. 💫
            </p>
          </div>

          <button
            onClick={() => setStep(2)}
            className="px-8 py-4 bg-[#F5A623] text-[#1A3A5C] font-bold rounded-2xl text-lg min-h-[56px] hover:bg-[#e09520] transition-colors shadow-lg shadow-[#F5A623]/30 active:scale-95"
          >
            Commencer →
          </button>
        </div>
      )}

      {/* ── ÉTAPE 2 — FORMULAIRE ENFANT ──────────────────────────── */}
      {step === 2 && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 space-y-7 max-w-lg mx-auto w-full"
          noValidate
        >
          {/* Prénom */}
          <div className="space-y-2">
            <label className="block text-[#1A3A5C] font-bold">
              Prénom de l&apos;enfant
            </label>
            <input
              {...register('prenom')}
              type="text"
              placeholder="Prénom de ton enfant"
              autoComplete="off"
              className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-[#F5A623] outline-none transition-colors min-h-[56px] text-[#1A3A5C] placeholder-gray-300"
            />
            {errors.prenom && (
              <p className="text-[#E74C3C] text-sm">{errors.prenom.message}</p>
            )}
          </div>

          {/* Âge — pills 4 à 14 */}
          <div className="space-y-3">
            <label className="block text-[#1A3A5C] font-bold">Âge</label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 11 }, (_, i) => i + 4).map((age) => (
                <button
                  key={age}
                  type="button"
                  onClick={() => setValue('age', age, { shouldValidate: true })}
                  className={`min-w-[48px] min-h-[48px] px-3 rounded-full font-bold text-sm transition-all ${
                    watchAge === age
                      ? 'bg-[#F5A623] text-[#1A3A5C] shadow-md scale-110'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {age}
                </button>
              ))}
            </div>
            {errors.age && (
              <p className="text-[#E74C3C] text-sm">
                {typeof errors.age.message === 'string'
                  ? errors.age.message
                  : "L'âge est requis"}
              </p>
            )}
          </div>

          {/* Avatar — grille 4×3 (76px par cellule à 360px) */}
          <div className="space-y-3">
            <label className="block text-[#1A3A5C] font-bold">Avatar</label>
            <div className="grid grid-cols-4 gap-2">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setValue('avatar', emoji, { shouldValidate: true })}
                  className={`min-h-[76px] rounded-xl text-4xl flex items-center justify-center transition-all ${
                    watchAvatar === emoji
                      ? 'border-2 border-[#F5A623] scale-110 bg-[#F5A623]/10 shadow-md'
                      : 'border-2 border-transparent bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Niveau — cartes radio */}
          <div className="space-y-3">
            <label className="block text-[#1A3A5C] font-bold">Niveau en arabe</label>
            <div className="space-y-2">
              {NIVEAUX.map((n) => (
                <button
                  key={n.value}
                  type="button"
                  onClick={() => setValue('niveau', n.value, { shouldValidate: true })}
                  className={`w-full px-4 py-4 rounded-xl border-2 text-left transition-all min-h-[80px] ${
                    watchNiveau === n.value
                      ? 'border-[#F5A623] bg-[#F5A623]/10'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl shrink-0">{n.emoji}</span>
                    <div>
                      <p
                        className={`font-bold text-sm ${
                          watchNiveau === n.value ? 'text-[#1A3A5C]' : 'text-gray-700'
                        }`}
                      >
                        {n.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {apiError && (
            <p className="text-[#E74C3C] text-sm text-center">{apiError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-[#F5A623] text-[#1A3A5C] font-bold rounded-2xl text-lg min-h-[56px] hover:bg-[#e09520] transition-colors shadow-lg shadow-[#F5A623]/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Création en cours…' : 'Créer le profil →'}
          </button>
        </form>
      )}

      {/* ── ÉTAPE 3 — C'EST PARTI ! ──────────────────────────────── */}
      {step === 3 && createdChild && (
        <div className="flex-1 relative flex flex-col items-center justify-center text-center py-12 gap-8 overflow-hidden">
          {/* Confetti automatiques au montage */}
          <div className="absolute inset-x-0 top-0 pointer-events-none" aria-hidden>
            {confettiPieces.map((p) => (
              <div
                key={p.id}
                className="absolute top-0"
                style={{
                  left: p.left,
                  width: p.width,
                  height: p.height,
                  backgroundColor: p.color,
                  borderRadius: p.borderRadius,
                  animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
                }}
              />
            ))}
          </div>

          {/* Grand avatar */}
          <div
            className="text-[5.5rem] leading-none relative z-10"
            style={{ animation: 'popIn 400ms ease-out' }}
          >
            {createdChild.avatar}
          </div>

          <div className="space-y-2 relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A3A5C]">
              {createdChild.prenom} est prêt&nbsp;! 🎉
            </h2>
            <p className="text-gray-500">
              Le profil a été créé avec succès. L&apos;aventure commence maintenant&nbsp;!
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs relative z-10">
            <button
              onClick={() => router.push(`/jouer/${createdChild.id}`)}
              className="w-full py-4 bg-[#F5A623] text-[#1A3A5C] font-bold rounded-2xl text-lg min-h-[56px] hover:bg-[#e09520] transition-colors shadow-lg shadow-[#F5A623]/30 active:scale-95"
            >
              🎮 Commencer à apprendre
            </button>
            <button
              onClick={resetForNewChild}
              className="w-full py-3.5 border-2 border-[#1A3A5C]/30 text-[#1A3A5C] font-semibold rounded-2xl min-h-[52px] hover:bg-gray-50 transition-colors text-sm"
            >
              Ajouter un autre enfant
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
