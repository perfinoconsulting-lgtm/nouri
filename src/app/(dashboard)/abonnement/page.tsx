/**
 * app/(dashboard)/abonnement/page.tsx — Gestion des abonnements par enfant
 *
 * Variables d'environnement requises :
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   STRIPE_SECRET_KEY
 *   STRIPE_PRICE_ID
 *   NEXT_PUBLIC_APP_URL
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import SubscribeButton from '@/components/ui/SubscribeButton'
import { CheckCircle2, CreditCard } from 'lucide-react'
import Link from 'next/link'

// Types locaux
interface Child {
  id: string
  prenom: string
  age: number
  avatar: string | null
}

interface Subscription {
  child_id: string
  status: string
  current_period_start: string | null
}

// Calcule la date de prochain renouvellement (~30j après current_period_start)
function formatNextRenewal(start: string | null): string {
  if (!start) return '—'
  const d = new Date(start)
  d.setDate(d.getDate() + 30)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

type StatusKey = 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive'

const STATUS_CONFIG: Record<StatusKey, { label: string; color: string; dot: string }> = {
  active:   { label: 'Actif',        color: 'bg-green-50  text-green-700  border border-green-100',  dot: 'bg-green-500'  },
  trialing: { label: 'Essai (7j)',   color: 'bg-orange-50 text-orange-700 border border-orange-100', dot: 'bg-orange-500' },
  past_due: { label: 'En retard',    color: 'bg-red-50    text-red-700    border border-red-100',    dot: 'bg-red-500'    },
  canceled: { label: 'Annulé',       color: 'bg-gray-100  text-gray-600   border border-gray-200',   dot: 'bg-gray-400'   },
  inactive: { label: 'Inactif',      color: 'bg-gray-100  text-gray-500   border border-gray-100',   dot: 'bg-gray-300'   },
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as StatusKey] ?? STATUS_CONFIG.inactive
}

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: { success?: string }
}) {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return null

  // Récupérer les enfants du parent
  const { data: children } = await supabase
    .from('children')
    .select('id, prenom, age, avatar')
    .eq('parent_id', session.user.id)
    .order('created_at', { ascending: true })

  // Récupérer tous les abonnements du parent
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('child_id, status, current_period_start')
    .eq('parent_id', session.user.id)

  const isSuccess = searchParams.success === 'true'

  const childrenList = (children as Child[]) ?? []
  const subList = (subscriptions as Subscription[]) ?? []

  return (
    <div className="space-y-8 max-w-5xl">
      {/* ── En-tête ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold text-[#0a192f] mb-1">Abonnements</h1>
        <p className="text-gray-500">
          Gérez l'accès Premium de vos enfants — <strong className="text-[#0a192f]">2€/mois</strong> par enfant, sans engagement.
        </p>
      </div>

      {/* ── Bandeau de succès ────────────────────────────────── */}
      {isSuccess && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl">
          <CheckCircle2 className="text-green-500 shrink-0" size={22} />
          <div>
            <p className="font-semibold">Paiement réussi !</p>
            <p className="text-sm text-green-600">
              L'abonnement est actif. Votre enfant peut dès maintenant profiter de l'accès complet à NourAl. 🎉
            </p>
          </div>
        </div>
      )}

      {/* ── Liste enfants ─────────────────────────────────────── */}
      {childrenList.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">👨‍👩‍👧</div>
          <h3 className="text-xl font-bold text-[#0a192f] mb-2">Aucun enfant ajouté</h3>
          <p className="text-gray-500 mb-6">
            Ajoutez d'abord un profil enfant pour pouvoir souscrire un abonnement.
          </p>
          <Link
            href="/enfants"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F5A623] text-white font-bold rounded-xl hover:bg-[#e09520] transition"
          >
            Ajouter un enfant
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {childrenList.map((child) => {
            const childSub = subList.find((s) => s.child_id === child.id)
            const status = childSub?.status ?? 'inactive'
            const statusConf = getStatusConfig(status)
            const isSubscribed = ['active', 'trialing', 'past_due'].includes(status)

            return (
              <div
                key={child.id}
                className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                {/* En-tête de la carte */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0">
                      {child.avatar ?? child.prenom[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-[#0a192f]">{child.prenom}</h3>
                      <p className="text-sm text-gray-400">{child.age} ans</p>
                    </div>
                  </div>

                  {/* Badge statut */}
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${statusConf.color}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                    {statusConf.label}
                  </div>
                </div>

                {/* Date de renouvellement si actif */}
                {isSubscribed && childSub?.current_period_start && (
                  <p className="text-xs text-gray-400 mb-4">
                    Prochain renouvellement :{' '}
                    <span className="font-medium text-gray-600">
                      {formatNextRenewal(childSub.current_period_start)}
                    </span>
                  </p>
                )}

                {/* Bouton d'action */}
                <div className="mt-auto pt-4 border-t border-gray-50">
                  <SubscribeButton
                    childId={child.id}
                    childPrenom={child.prenom}
                    isSubscribed={isSubscribed}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Section "Pourquoi s'abonner ?" ────────────────────── */}
      <div className="bg-[#0a192f] rounded-[2rem] p-8 text-white relative overflow-hidden mt-4">
        {/* Décoration */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#F5A623]/20 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="text-[#F5A623]" size={28} />
            <h2 className="text-2xl font-bold">Pourquoi s'abonner au Premium ?</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: 'Alphabet complet',
                text: 'Toutes les 28 lettres avec illustrations, sons natifs et variations (début, milieu, fin).',
              },
              {
                title: 'Mots et petites sourates',
                text: 'Vocabulary courant + Al-Fatiha, Al-Ikhlas et d'autres sourates courtes.',
              },
              {
                title: 'Répétition espacée (SM-2)',
                text: 'Algorithme scientifique pour mémoriser durablement, sans bourrage de crâne.',
              },
              {
                title: 'Suivi parental avancé',
                text: 'Statistiques détaillées : lettres maîtrisées, temps passé, scores de quiz.',
              },
              {
                title: 'Profils illimités',
                text: 'Abonnez chaque enfant indépendamment — même si la fratrie est grande !',
              },
              {
                title: 'Sans engagement',
                text: 'Résiliation en 1 clic depuis votre espace. Aucune surprise.',
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <CheckCircle2 className="text-[#F5A623] shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="font-semibold text-white text-sm">{item.title}</p>
                  <p className="text-blue-200 text-xs mt-0.5">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
