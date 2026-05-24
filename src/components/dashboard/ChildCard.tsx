/**
 * components/dashboard/ChildCard.tsx -- Carte enfant reutilisable
 *
 * Affiche les infos, stats et actions pour un profil enfant.
 * Utilisee sur le dashboard principal et la page "Mes Enfants".
 */

import Link from 'next/link'

// Niveaux avec couleurs de bordure et badges
const LEVEL_CONFIG: Record<number, { label: string; color: string; border: string; bg: string }> = {
  1: { label: 'Niveau 1', color: 'text-gray-500',   border: 'border-l-4 border-gray-300',   bg: 'bg-gray-100'   },
  2: { label: 'Niveau 2', color: 'text-blue-600',   border: 'border-l-4 border-blue-400',   bg: 'bg-blue-100'   },
  3: { label: 'Niveau 3', color: 'text-yellow-600', border: 'border-l-4 border-yellow-400', bg: 'bg-yellow-100' },
  4: { label: 'Niveau 4', color: 'text-purple-600', border: 'border-l-4 border-purple-400', bg: 'bg-purple-100' },
  5: { label: 'Niveau 5', color: 'text-cyan-600',   border: 'border-l-4 border-cyan-400',   bg: 'bg-cyan-100'   },
}
const LEVEL_STARS: Record<number, string> = {
  1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐', 4: '⭐⭐⭐⭐', 5: '💎'
}

// Calcule le temps relatif ecoule depuis une date
function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Jamais'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Hier'
  return `Il y a ${days} jours`
}

function isInactiveSince(dateStr: string | null, days: number): boolean {
  if (!dateStr) return true
  const diff = Date.now() - new Date(dateStr).getTime()
  return diff > days * 24 * 60 * 60 * 1000
}

interface ChildStats {
  lettersLearned: number
  avgScore: number
  lastActive: string | null
  currentStreak: number
}

interface ChildCardProps {
  child: {
    id: string
    prenom: string
    age: number
    avatar: string | null
    niveau: number
  }
  subscriptionStatus: string
  stats: ChildStats
}

export default function ChildCard({ child, subscriptionStatus, stats }: ChildCardProps) {
  const level = LEVEL_CONFIG[child.niveau] ?? LEVEL_CONFIG[1]
  const isInactive = isInactiveSince(stats.lastActive, 5)
  const progressPct = Math.round((stats.lettersLearned / 28) * 100)
  const isPremium = ['active', 'trialing'].includes(subscriptionStatus)

  return (
    <div
      className={`bg-white rounded-3xl shadow-sm ${level.border} overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 flex flex-col ${
        isInactive ? 'ring-2 ring-orange-200' : ''
      }`}
    >
      <div className="p-6 flex flex-col gap-4 flex-1">
        {/* En-tete avatar + info + badges */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-3xl shadow-inner shrink-0">
              {child.avatar ?? child.prenom[0]}
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#0a192f]">{child.prenom}</h3>
              <p className="text-sm text-gray-400">{child.age} ans</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            {/* Badge niveau */}
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${level.bg} ${level.color}`}>
              {LEVEL_STARS[child.niveau]} {level.label}
            </span>
            {/* Badge abonnement */}
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                isPremium ? 'bg-[#F5A623]/15 text-[#c47a00]' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {isPremium ? 'Premium ✨' : 'Gratuit'}
            </span>
          </div>
        </div>

        {/* Barre de progression lettres */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold text-gray-500">Lettres apprises</span>
            <span className="text-xs font-bold text-[#0a192f]">{stats.lettersLearned}/28</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#F5A623] to-yellow-300 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-2xl p-3 text-center">
            <p className="text-xl font-bold text-[#0a192f]">{stats.avgScore}%</p>
            <p className="text-xs text-gray-400 mt-0.5">Score moyen</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-3 text-center">
            <p className="text-xl font-bold text-[#0a192f]">{stats.currentStreak}</p>
            <p className="text-xs text-gray-400 mt-0.5">Jours de suite 🔥</p>
          </div>
        </div>

        {/* Derniere activite */}
        <p className="text-xs text-gray-400">
          Derniere activite :{' '}
          <span className="font-medium text-gray-600">{timeAgo(stats.lastActive)}</span>
        </p>

        {/* Alerte inactivite */}
        {isInactive && (
          <div className="bg-orange-50 border border-orange-100 text-orange-700 text-xs font-semibold px-3 py-2 rounded-xl text-center">
            Rappelle-lui de pratiquer !
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="grid grid-cols-2 border-t border-gray-50">
        <Link
          href={`/enfants/${child.id}`}
          className="py-3.5 text-center text-sm font-bold text-[#0a192f] hover:bg-gray-50 transition border-r border-gray-50"
        >
          Voir details
        </Link>
        <Link
          href={`/jouer/${child.id}`}
          className="py-3.5 text-center text-sm font-bold text-[#F5A623] hover:bg-[#F5A623]/5 transition"
        >
          Lancer le jeu ▶
        </Link>
      </div>
    </div>
  )
}
