/**
 * app/(dashboard)/dashboard/page.tsx -- Tableau de bord principal du parent
 *
 * Server Component -- toutes les donnees chargees cote serveur via Supabase
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import ChildCard from '@/components/dashboard/ChildCard'
import Link from 'next/link'
import { BookOpen, Users, Zap, TrendingUp } from 'lucide-react'

// Calcule une date en francais : "Lundi 25 mai 2025"
function formatDateFr(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Calcule si un enfant a ete actif dans les 7 derniers jours
function isActiveRecently(lastActive: string | null): boolean {
  if (!lastActive) return false
  const diff = Date.now() - new Date(lastActive).getTime()
  return diff < 7 * 24 * 60 * 60 * 1000
}

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  // Donnees parent
  const { data: parent } = await supabase
    .from('parents')
    .select('prenom, onboarding_completed')
    .eq('id', session.user.id)
    .single()

  // Donnees enfants
  const { data: children } = await supabase
    .from('children')
    .select('*')
    .eq('parent_id', session.user.id)
    .order('created_at', { ascending: true })

  const childrenList = children ?? []
  const childIds = childrenList.map((c) => c.id)

  // Progres de tous les enfants
  const { data: allProgress } = childIds.length > 0
    ? await supabase.from('progress').select('child_id, score').in('child_id', childIds)
    : { data: [] }

  // Abonnements
  const { data: allSubs } = childIds.length > 0
    ? await supabase.from('subscriptions').select('child_id, status, current_period_start').in('child_id', childIds)
    : { data: [] }

  // Stats globales
  const totalLettersMastered = (allProgress ?? []).filter((p) => p.score >= 80).length
  const activeChildrenCount = childrenList.filter((c) => isActiveRecently(c.last_active)).length
  const dateStr = formatDateFr()

  return (
    <div className="space-y-10">

      {/* SECTION A : GREETING */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#0a192f]">
            Bonjour {parent?.prenom ?? 'Parent'} 👋
          </h1>
          <p className="text-gray-400 mt-1 capitalize">{dateStr}</p>
        </div>

        {childrenList.length > 0 && (
          <Link
            href="/enfants"
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-[#0a192f] font-bold rounded-xl hover:bg-gray-50 transition shadow-sm text-sm"
          >
            <Users size={16} /> Gerer les enfants
          </Link>
        )}
      </div>

      {/* Banner onboarding */}
      {!parent?.onboarding_completed && childrenList.length === 0 && (
        <div className="bg-gradient-to-r from-[#0a192f] to-blue-900 text-white p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F5A623]/20 rounded-2xl flex items-center justify-center text-2xl shrink-0">
              🌙
            </div>
            <div>
              <h3 className="font-bold text-lg">Bienvenue sur NourAl !</h3>
              <p className="text-blue-200 text-sm mt-0.5">Creez le profil de votre premier enfant pour commencer l&apos;aventure.</p>
            </div>
          </div>
          <Link
            href="/enfants"
            className="px-6 py-3 bg-[#F5A623] text-white font-bold rounded-xl hover:bg-[#e09520] transition whitespace-nowrap shadow-md"
          >
            Creer un profil enfant →
          </Link>
        </div>
      )}

      {/* SECTION B : STATS GLOBALES */}
      {childrenList.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: <BookOpen size={22} className="text-green-600" />,
              label: 'Lettres maitrisees',
              value: totalLettersMastered,
              bg: 'bg-green-50',
            },
            {
              icon: <Users size={22} className="text-blue-600" />,
              label: 'Enfants actifs (7j)',
              value: `${activeChildrenCount}/${childrenList.length}`,
              bg: 'bg-blue-50',
            },
            {
              icon: <Zap size={22} className="text-[#F5A623]" />,
              label: 'Enfants Premium',
              value: (allSubs ?? []).filter((s) => s.status === 'active' || s.status === 'trialing').length,
              bg: 'bg-yellow-50',
            },
            {
              icon: <TrendingUp size={22} className="text-purple-600" />,
              label: 'Score moyen',
              value: (() => {
                const scores = (allProgress ?? []).map((p) => p.score)
                return scores.length ? `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%` : '-'
              })(),
              bg: 'bg-purple-50',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${stat.bg} rounded-3xl p-5 flex flex-col gap-3 shadow-sm border border-white`}
            >
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0a192f]">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION C : CARDS ENFANTS */}
      {childrenList.length > 0 ? (
        <div>
          <h2 className="text-xl font-bold text-[#0a192f] mb-5">Mes enfants</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {childrenList.map((child) => {
              const childProgress = (allProgress ?? []).filter((p) => p.child_id === child.id)
              const childSub = (allSubs ?? []).find((s) => s.child_id === child.id)

              const lettersLearned = childProgress.filter((p) => p.score >= 80).length
              const avgScore =
                childProgress.length > 0
                  ? Math.round(childProgress.reduce((sum, p) => sum + p.score, 0) / childProgress.length)
                  : 0

              return (
                <ChildCard
                  key={child.id}
                  child={child}
                  subscriptionStatus={childSub?.status ?? 'inactive'}
                  stats={{
                    lettersLearned,
                    avgScore,
                    lastActive: child.last_active,
                    currentStreak: 0,
                  }}
                />
              )
            })}

            {/* Carte "Ajouter un enfant" */}
            <Link
              href="/enfants"
              className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-3 p-8 hover:bg-gray-100 hover:border-gray-300 transition text-center min-h-[240px]"
            >
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-gray-100">
                +
              </div>
              <div>
                <p className="font-bold text-[#0a192f]">Ajouter un enfant</p>
                <p className="text-sm text-gray-400 mt-1">Creer un nouveau profil</p>
              </div>
            </Link>
          </div>
        </div>
      ) : (
        /* SECTION D : ETAT VIDE */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {/* Illustration SVG : lune + etoiles + livre */}
          <svg width="160" height="140" viewBox="0 0 160 140" fill="none" className="mb-8">
            <circle cx="80" cy="70" r="50" fill="#EFF6FF" />
            <path d="M95 50C95 65.464 82.464 78 67 78C60.83 78 55.118 75.96 50.5 72.5C54.132 83.302 64.384 91 76.5 91C91.964 91 104.5 78.464 104.5 63C104.5 56.508 102.402 50.512 98.826 45.7C96.654 47.017 95 48.9 95 50Z" fill="#F5A623" opacity="0.8"/>
            <circle cx="40" cy="30" r="4" fill="#F5A623" opacity="0.6"/>
            <circle cx="120" cy="25" r="3" fill="#F5A623" opacity="0.5"/>
            <circle cx="130" cy="60" r="2.5" fill="#F5A623" opacity="0.4"/>
            <circle cx="25" cy="80" r="2" fill="#F5A623" opacity="0.4"/>
            <rect x="60" y="75" width="40" height="30" rx="4" fill="#0a192f" opacity="0.8"/>
            <rect x="58" y="73" width="44" height="4" rx="2" fill="#0a192f"/>
            <line x1="80" y1="77" x2="80" y2="105" stroke="white" strokeWidth="1.5" opacity="0.4"/>
            <line x1="65" y1="82" x2="79" y2="82" stroke="white" strokeWidth="1.5" opacity="0.3"/>
            <line x1="65" y1="88" x2="79" y2="88" stroke="white" strokeWidth="1.5" opacity="0.3"/>
          </svg>

          <h2 className="text-2xl font-bold text-[#0a192f] mb-3">
            Vous n&apos;avez pas encore cree de profil enfant
          </h2>
          <p className="text-gray-500 max-w-sm mb-8">
            Commencez l&apos;aventure NourAl en creant le premier profil. Cela prend moins d&apos;une minute !
          </p>
          <Link
            href="/enfants"
            className="px-8 py-4 bg-[#F5A623] text-white font-bold rounded-2xl hover:bg-[#e09520] transition shadow-lg text-lg hover:scale-105 transform"
          >
            + Creer le premier profil
          </Link>
        </div>
      )}
    </div>
  )
}
