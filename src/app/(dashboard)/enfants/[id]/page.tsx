/**
 * app/(dashboard)/enfants/[id]/page.tsx -- Profil detaille d'un enfant
 *
 * Server Component -- donnees chargees cote serveur
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProgressGrid from '@/components/dashboard/ProgressGrid'
import ActivityCalendar from '@/components/dashboard/ActivityCalendar'
import { ArrowLeft, Play, Flame, Star, BookOpen, Clock } from 'lucide-react'
import DeleteChildButton from '@/components/dashboard/DeleteChildButton'

// Lettres arabes (meme ordre que ProgressGrid)
const ARABIC_LETTERS = [
  'alif','ba','ta','tha','jim','ha','kha','dal','dhal','ra',
  'zay','sin','shin','sad','dad','ta2','dha','ayn','ghayn','fa',
  'qaf','kaf','lam','mim','nun','ha2','waw','ya'
]

// Emoji par module
const MODULE_EMOJIS: Record<string, string> = {
  alphabet: '🔤',
  syllabes: '🔠',
  mots:     '💬',
  sourates: '🌟',
}

// Couleur du score
function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 font-bold'
  if (score >= 50) return 'text-orange-500 font-bold'
  return 'text-red-500 font-bold'
}

// Date relative en francais
function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '-'
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1)  return 'Il y a moins d\'1h'
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Hier'
  return `Il y a ${d} jours`
}

function formatMinutes(sec: number): string {
  const m = Math.floor(sec / 60)
  const h = Math.floor(m / 60)
  if (h === 0) return `${m}min`
  return `${h}h ${m % 60}min`
}

export default async function ChildDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  // Securite : verifier que l'enfant appartient au parent
  const { data: child, error } = await supabase
    .from('children')
    .select('*')
    .eq('id', params.id)
    .eq('parent_id', session.user.id)
    .single()

  if (error || !child) notFound()

  // Progres pour la grille des lettres
  const { data: progressData } = await supabase
    .from('progress')
    .select('item_id, score, updated_at')
    .eq('child_id', params.id)

  // Abonnement
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('child_id', params.id)
    .single()

  // Stats d'activite pour le calendrier (84 jours)
  const since = new Date()
  since.setDate(since.getDate() - 84)
  const { data: activityData } = await supabase
    .from('progress')
    .select('updated_at, score')
    .eq('child_id', params.id)
    .gte('updated_at', since.toISOString())
    .order('updated_at', { ascending: true })

  // Convertir progress en sessions pour le calendrier
  const dayMap: Record<string, number> = {}
  ;(activityData ?? []).forEach((p) => {
    const day = new Date(p.updated_at).toISOString().split('T')[0]
    dayMap[day] = (dayMap[day] ?? 0) + 120 // 2 min par entree
  })
  const calendarSessions = Object.entries(dayMap).map(([date, secs]) => ({
    date,
    duration_seconds: secs,
  }))

  // Stats rapides
  const prog = progressData ?? []
  const lettersLearned = prog.filter((p) => p.score >= 80).length
  const avgScore = prog.length
    ? Math.round(prog.reduce((s, p) => s + p.score, 0) / prog.length)
    : 0
  const totalSeconds = Object.values(dayMap).reduce((a, b) => a + b, 0)

  // Simuler des sessions recentes a partir des progres
  const recentSessions = prog
    .slice(-10)
    .reverse()
    .map((p, i) => ({
      id: i,
      date: p.updated_at,
      module: ARABIC_LETTERS.includes(p.item_id) ? 'alphabet' : 'mots',
      duration: 120,
      score: p.score,
      items: 1,
    }))

  const isPremium = ['active', 'trialing'].includes(subscription?.status ?? '')

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Retour */}
      <Link
        href="/enfants"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-[#0a192f] transition font-medium text-sm"
      >
        <ArrowLeft size={16} /> Retour a mes enfants
      </Link>

      {/* SECTION A : HEADER */}
      <div className="bg-gradient-to-br from-[#0a192f] to-blue-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F5A623]/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none" />

        <div className="relative z-10">
          {/* Avatar + nom */}
          <div className="flex items-center gap-5 mb-8">
            <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-3xl flex items-center justify-center text-5xl shadow-inner shrink-0">
              {child.avatar ?? child.prenom[0]}
            </div>
            <div>
              <h1 className="text-4xl font-bold">{child.prenom}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-blue-200 text-sm">{child.age} ans</span>
                <span className="px-3 py-0.5 rounded-full bg-[#F5A623]/20 text-[#F5A623] text-sm font-bold">
                  Niveau {child.niveau}
                </span>
                {isPremium && (
                  <span className="px-3 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 text-sm font-bold">
                    Premium ✨
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: <Flame size={20} className="text-orange-400" />, label: 'Serie', value: '0j' },
              { icon: <Star size={20} className="text-yellow-400" />, label: 'Score moyen', value: `${avgScore}%` },
              { icon: <BookOpen size={20} className="text-green-400" />, label: 'Lettres', value: `${lettersLearned}/28` },
              { icon: <Clock size={20} className="text-blue-300" />, label: 'Temps total', value: formatMinutes(totalSeconds) },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">{stat.icon}</div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-blue-200 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION B : GRILLE DES LETTRES */}
      <ProgressGrid progressData={prog.map((p) => ({ item_id: p.item_id, score: p.score, updated_at: p.updated_at }))} />

      {/* SECTION C : CALENDRIER D'ACTIVITE */}
      <ActivityCalendar sessions={calendarSessions} />

      {/* SECTION D : SESSIONS RECENTES */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#0a192f] mb-5">Activite recente</h2>

        {recentSessions.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-3">📚</p>
            <p>Aucune session enregistree pour le moment.</p>
            <Link
              href={`/jouer/${params.id}`}
              className="inline-block mt-4 px-6 py-3 bg-[#F5A623] text-white font-bold rounded-xl hover:bg-[#e09520] transition"
            >
              Demarrer la premiere session
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-left">
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Module</th>
                  <th className="pb-3 font-semibold">Duree</th>
                  <th className="pb-3 font-semibold">Items</th>
                  <th className="pb-3 font-semibold">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="py-3 text-gray-600">{timeAgo(s.date)}</td>
                    <td className="py-3">
                      <span className="flex items-center gap-1.5">
                        {MODULE_EMOJIS[s.module] ?? '📖'}{' '}
                        <span className="capitalize">{s.module}</span>
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">{formatMinutes(s.duration)}</td>
                    <td className="py-3 text-gray-600">{s.items}</td>
                    <td className={`py-3 ${scoreColor(s.score)}`}>{s.score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION E : ACTIONS */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#0a192f] mb-5">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/jouer/${params.id}`}
            className="flex items-center gap-2 px-5 py-3 bg-[#F5A623] text-white font-bold rounded-xl hover:bg-[#e09520] transition shadow-sm"
          >
            <Play size={16} /> Lancer une session
          </Link>

          <Link
            href="/abonnement"
            className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-[#0a192f] font-bold rounded-xl hover:bg-gray-50 transition"
          >
            💳 Gerer l&apos;abonnement
          </Link>

          {child.niveau >= 2 && (
            <a
              href={`/api/certificates/${params.id}`}
              className="flex items-center gap-2 px-5 py-3 bg-purple-50 text-purple-700 border border-purple-100 font-bold rounded-xl hover:bg-purple-100 transition"
            >
              🏆 Telecharger certificat
            </a>
          )}

          <DeleteChildButton childId={params.id} childPrenom={child.prenom} />
        </div>
      </div>
    </div>
  )
}
