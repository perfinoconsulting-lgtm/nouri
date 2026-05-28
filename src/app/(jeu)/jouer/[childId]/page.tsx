'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { ChildWithStats, SessionData } from '@/types/dashboard'

interface ReviewStats {
  itemsDue: number
  estimatedMinutes: number
}

interface PageData {
  child: ChildWithStats
  recentSessions: SessionData[]
  reviewStats: ReviewStats | null
}

// Noms lisibles des modules pour le bouton "Continuer"
const NOM_MODULES: Record<string, string> = {
  alphabet: "L'Alphabet",
  syllabes: 'Les Syllabes',
  mots: 'Les Mots',
  sourates: 'Les Sourates',
}

export default function JoueurPage() {
  const params = useParams<{ childId: string }>()
  const [data, setData] = useState<PageData | null>(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    async function chargerDonnees() {
      try {
        const [childRes, reviewRes] = await Promise.allSettled([
          fetch(`/api/children/${params.childId}`),
          fetch(`/api/review?childId=${params.childId}&stats=true`),
        ])

        const childJson =
          childRes.status === 'fulfilled' && childRes.value.ok
            ? await childRes.value.json()
            : null

        let reviewStats: ReviewStats | null = null
        if (reviewRes.status === 'fulfilled' && reviewRes.value.ok) {
          const reviewJson = await reviewRes.value.json()
          if ((reviewJson.itemsDue ?? 0) > 0) {
            reviewStats = {
              itemsDue: reviewJson.itemsDue,
              estimatedMinutes:
                reviewJson.estimatedMinutes ?? Math.ceil(reviewJson.itemsDue / 5),
            }
          }
        }

        setData({
          child: childJson?.child ?? null,
          recentSessions: childJson?.recentSessions ?? [],
          reviewStats,
        })
      } catch {
        // Erreur silencieuse — l'écran de skeleton reste visible
      } finally {
        setChargement(false)
      }
    }

    chargerDonnees()
  }, [params.childId])

  if (chargement) return <Squelette />
  if (!data?.child) return null

  const { child, recentSessions, reviewStats } = data
  const premium =
    child.subscription.status === 'active' ||
    child.subscription.status === 'trialing'
  const dernierModule = recentSessions[0]?.module_slug ?? null

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Greeting Baloo 2 */}
      <div className="text-center mb-6">
        <h1
          className="text-3xl font-bold text-white mb-1"
          style={{ fontFamily: "var(--font-baloo2, 'Baloo 2', sans-serif)" }}
        >
          Bonjour {child.prenom} ! 🌙
        </h1>
        <p
          className="text-white/70 text-lg"
          style={{ fontFamily: "var(--font-baloo2, 'Baloo 2', sans-serif)" }}
        >
          Qu'est-ce qu'on apprend aujourd'hui ?
        </p>
      </div>

      {/* Widget révision — visible seulement si des items sont dus */}
      {reviewStats && (
        <Link
          href={`/jouer/${params.childId}/reviser`}
          className="block mb-6"
          style={{ touchAction: 'manipulation' }}
        >
          <div className="bg-[#F5A623] rounded-2xl p-4 text-center animate-pulse">
            <p className="text-white font-bold text-xl">
              🔄 {reviewStats.itemsDue} lettres t'attendent !
            </p>
            <p className="text-white/80 text-sm mt-1">
              Révise en ~{reviewStats.estimatedMinutes} minutes
            </p>
          </div>
        </Link>
      )}

      {/* Grille 2×2 modules */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <CarteModule
          href={`/jouer/${params.childId}/alphabet`}
          emoji="🔤"
          titre="L'Alphabet"
          sousTitre={`${child.stats.lettersLearned}/28 lettres apprises`}
          progression={child.stats.lettersLearned / 28}
          gradient="from-[#1A3A5C] to-[#2E6DA4]"
          delai={0}
          accessible={true}
        />
        <CarteModule
          href={`/jouer/${params.childId}/syllabes`}
          emoji="🔠"
          titre="Les Syllabes"
          sousTitreArabe="بَا بِي بُو"
          sousTitre="ba, bi, bou..."
          gradient="from-[#6B3F8A] to-[#9B59B6]"
          delai={100}
          accessible={premium}
        />
        <CarteModule
          href={`/jouer/${params.childId}/mots`}
          emoji="💬"
          titre="Les Mots"
          sousTitre="Famille, couleurs, animaux..."
          gradient="from-[#2E7D32] to-[#27AE60]"
          delai={200}
          accessible={premium}
        />
        <CarteModule
          href={`/jouer/${params.childId}/sourates`}
          emoji="🌟"
          titre="Les Sourates"
          sousTitre="Al-Fatiha, Al-Ikhlas..."
          gradient="from-[#B5600A] to-[#E67E22]"
          delai={300}
          accessible={premium}
        />
      </div>

      {/* Bouton Continuer — visible si une session précédente existe */}
      {dernierModule && NOM_MODULES[dernierModule] && (
        <Link
          href={`/jouer/${params.childId}/${dernierModule}`}
          className="block w-full text-center bg-[#F5A623] text-white font-bold py-4 rounded-2xl text-lg transition-opacity active:opacity-80"
          style={{ touchAction: 'manipulation' }}
        >
          ▶️ Continuer — {NOM_MODULES[dernierModule]}
        </Link>
      )}
    </div>
  )
}

// ─── Composant carte module ───────────────────────────────────────────────────

interface CarteModuleProps {
  href: string
  emoji: string
  titre: string
  sousTitre: string
  sousTitreArabe?: string
  progression?: number
  gradient: string
  delai: number
  accessible: boolean
}

function CarteModule({
  href,
  emoji,
  titre,
  sousTitre,
  sousTitreArabe,
  progression,
  gradient,
  delai,
  accessible,
}: CarteModuleProps) {
  const contenu = (
    <div
      className={`relative bg-gradient-to-br ${gradient} rounded-2xl p-4 min-h-[140px] flex flex-col justify-between overflow-hidden`}
      style={{
        touchAction: 'manipulation',
        animation: `popIn 0.4s ease-out ${delai}ms both`,
      }}
    >
      <div>
        <div className="text-3xl mb-1 leading-none select-none">{emoji}</div>
        <h2 className="text-white font-bold text-sm leading-tight">{titre}</h2>
        {sousTitreArabe && (
          <p
            className="text-white/80 text-sm mt-0.5"
            dir="rtl"
            style={{ fontFamily: 'var(--font-noto-naskh, sans-serif)' }}
          >
            {sousTitreArabe}
          </p>
        )}
        <p className="text-white/60 text-xs mt-0.5 leading-tight">{sousTitre}</p>
      </div>

      {/* Barre de progression — alphabet uniquement */}
      {progression !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-white/20 rounded-full h-1.5">
            <div
              className="bg-white rounded-full h-1.5 transition-all"
              style={{ width: `${Math.min(Math.round(progression * 100), 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Overlay verrouillé pour modules premium */}
      {!accessible && (
        <div className="absolute inset-0 bg-black/50 rounded-2xl flex flex-col items-center justify-center gap-1">
          <span className="text-3xl animate-pulse select-none">🔒</span>
          <p className="text-white text-xs text-center px-3 font-medium leading-tight">
            Demande à papa ou maman 🔒
          </p>
        </div>
      )}
    </div>
  )

  if (!accessible) {
    return <div className="cursor-default">{contenu}</div>
  }

  return (
    <Link href={href} className="block" style={{ touchAction: 'manipulation' }}>
      {contenu}
    </Link>
  )
}

// ─── Squelette de chargement ──────────────────────────────────────────────────

function Squelette() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto animate-pulse">
      <div className="text-center mb-6">
        <div className="h-8 bg-white/20 rounded-lg w-56 mx-auto mb-2" />
        <div className="h-5 bg-white/10 rounded-lg w-64 mx-auto" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-36 bg-white/10 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
