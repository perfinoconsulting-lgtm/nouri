'use client'

/**
 * components/dashboard/ChildCard.tsx — Carte enfant avec stats et actions
 */

import Link from 'next/link'
import type { ChildWithStats } from '@/types/dashboard'

// Couleurs exactes de la bordure gauche selon le niveau
const LEVEL_BORDER: Record<number, string> = {
  1: '#94a3b8',
  2: '#3b82f6',
  3: '#F5A623',
  4: '#9B59B6',
  5: '#00C9B1',
}

const LEVEL_STARS: Record<number, string> = {
  1: '⭐',
  2: '⭐⭐',
  3: '⭐⭐⭐',
  4: '⭐⭐⭐⭐',
  5: '💎',
}

// Formate une date en temps relatif lisible en français
function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Jamais'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours === 1) return 'Il y a 1 heure'
  if (hours < 24) return `Il y a ${hours} heures`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Hier'
  return `Il y a ${days} jours`
}

function isInactiveSince(dateStr: string | null, days: number): boolean {
  if (!dateStr) return true
  return Date.now() - new Date(dateStr).getTime() > days * 24 * 60 * 60 * 1000
}

interface Props {
  child: ChildWithStats
  onAddChild?: () => void
}

export default function ChildCard({ child }: Props) {
  const borderColor = LEVEL_BORDER[child.niveau] ?? LEVEL_BORDER[1]
  const isPremium = ['active', 'trialing'].includes(child.subscription.status)
  const isInactive = isInactiveSince(child.stats.lastSessionDate, 5)
  const progressPct = Math.min(100, Math.round((child.stats.lettersLearned / 28) * 100))

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border-l-4 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col ${
        isInactive ? 'ring-2 ring-orange-300' : ''
      }`}
      style={{ borderLeftColor: borderColor }}
    >
      <div className="p-5 flex flex-col gap-4 flex-1">

        {/* Ligne 1 : Avatar + prénom + badge niveau étoiles */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-2xl shadow-inner shrink-0">
              {child.avatar || child.prenom[0]}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-[#1A3A5C] truncate">{child.prenom}</h3>
              <p className="text-xs text-gray-400">{child.age} ans</p>
            </div>
          </div>
          <span className="text-base shrink-0" title={`Niveau ${child.niveau}`}>
            {LEVEL_STARS[child.niveau]}
          </span>
        </div>

        {/* Ligne 2 : Badge abonnement */}
        <div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
              isPremium
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {isPremium ? 'Premium ✨' : 'Gratuit'}
          </span>
        </div>

        {/* Ligne 3 : Barre progression lettres */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold text-gray-500">Lettres apprises</span>
            <span className="text-xs font-bold text-[#1A3A5C]">{child.stats.lettersLearned}/28</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, backgroundColor: borderColor }}
            />
          </div>
        </div>

        {/* Ligne 4 : Score moyen */}
        <p className="text-sm font-semibold text-gray-600">
          {child.stats.avgScore}% de bonnes réponses
        </p>

        {/* Ligne 5 : Série + dernière activité */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="font-semibold text-gray-700">
            🔥 {child.stats.currentStreak} jour{child.stats.currentStreak !== 1 ? 's' : ''}
          </span>
          <span>{timeAgo(child.stats.lastSessionDate)}</span>
        </div>

        {/* Alerte inactivité > 5 jours */}
        {isInactive && (
          <div className="bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold px-3 py-2 rounded-xl text-center">
            À relancer ! 💤
          </div>
        )}
      </div>

      {/* Boutons d'action (zones tactiles ≥ 48px) */}
      <div className="grid grid-cols-2 border-t border-gray-50">
        <Link
          href={`/enfants/${child.id}`}
          className="min-h-[48px] flex items-center justify-center text-sm font-bold text-[#1A3A5C] hover:bg-gray-50 transition border-r border-gray-50"
        >
          Voir les détails →
        </Link>
        <Link
          href={`/jouer/${child.id}`}
          className="min-h-[48px] flex items-center justify-center text-sm font-bold text-[#F5A623] hover:bg-amber-50 transition"
        >
          ▶️ Lancer le jeu
        </Link>
      </div>
    </div>
  )
}
