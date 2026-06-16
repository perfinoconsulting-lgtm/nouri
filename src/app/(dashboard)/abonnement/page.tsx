import { createServerSupabaseClient } from '@/lib/supabase/server'
import SubscribeButton from '@/components/ui/SubscribeButton'
import Link from 'next/link'
import { redirect } from 'next/navigation'

interface Child {
  id: string
  prenom: string
  age: number
  avatar: string | null
}

interface Subscription {
  child_id: string
  status: string
  current_period_end: string | null
}

function formatRenewal(date: string | null): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

type StatusKey = 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive'

const STATUS_CONFIG: Record<StatusKey, { label: string; color: string }> = {
  active:   { label: 'Premium ✨ Actif',         color: 'bg-green-100 text-green-800'   },
  trialing: { label: 'Essai gratuit 🎁',         color: 'bg-orange-100 text-orange-800' },
  past_due: { label: '⚠️ Paiement en attente',   color: 'bg-red-100 text-red-800'       },
  canceled: { label: 'Résilié',                  color: 'bg-gray-100 text-gray-600'     },
  inactive: { label: 'Gratuit',                  color: 'bg-gray-100 text-gray-500'     },
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as StatusKey] ?? STATUS_CONFIG.inactive
}

const PREMIUM_FEATURES = [
  { title: 'Alphabet complet',         text: 'Toutes les 28 lettres avec illustrations, sons natifs et variations.' },
  { title: 'Mots et petites sourates', text: 'Vocabulaire courant + Al-Fatiha, Al-Ikhlas et autres sourates courtes.' },
  { title: 'Répétition espacée (SM-2)', text: 'Algorithme scientifique pour mémoriser durablement.' },
  { title: 'Suivi parental avancé',    text: 'Lettres maîtrisées, temps passé, scores de quiz.' },
  { title: 'Profils illimités',        text: 'Abonnez chaque enfant indépendamment.' },
  { title: 'Sans engagement',          text: 'Résiliation en 1 clic depuis votre espace. Aucune surprise.' },
]

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const { success } = await searchParams
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/connexion')

  const { data: children } = await supabase
    .from('children')
    .select('id, prenom, age, avatar')
    .eq('parent_id', session.user.id)
    .order('created_at', { ascending: true })

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('child_id, status, current_period_end')
    .eq('parent_id', session.user.id)

  const isSuccess = success === 'true'
  const childrenList = (children as Child[]) ?? []
  const subList = (subscriptions as Subscription[]) ?? []

  return (
    <div className="space-y-8 max-w-5xl">

      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-[#1A3A5C] mb-1">💳 Abonnements</h1>
        <p className="text-gray-500">
          Gérez l&apos;accès Premium de vos enfants —{' '}
          <strong className="text-[#1A3A5C]">2€/mois</strong> par enfant, sans engagement.
        </p>
      </div>

      {/* Bandeau succès */}
      {isSuccess && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl">
          <span className="text-2xl shrink-0">🎉</span>
          <p className="font-semibold">
            Abonnement activé ! Votre enfant a accès à tout Lisani !
          </p>
        </div>
      )}

      {/* Liste enfants */}
      {childrenList.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">👨‍👩‍👧</div>
          <h3 className="text-xl font-bold text-[#1A3A5C] mb-2">Aucun enfant ajouté</h3>
          <p className="text-gray-500 mb-6">
            Ajoutez d&apos;abord un profil enfant pour souscrire un abonnement.
          </p>
          <Link
            href="/enfants"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F5A623] text-[#1A3A5C] font-bold rounded-[50px] hover:bg-[#e09520] transition"
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
            const renewalDate = formatRenewal(childSub?.current_period_end ?? null)

            return (
              <div
                key={child.id}
                className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                {/* En-tête carte */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0">
                      {child.avatar ?? child.prenom[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-[#1A3A5C]">{child.prenom}</h3>
                      <p className="text-sm text-gray-400">{child.age} ans</p>
                    </div>
                  </div>

                  {/* Badge statut */}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${statusConf.color}`}>
                    {statusConf.label}
                  </span>
                </div>

                {/* Date de renouvellement */}
                {isSubscribed && renewalDate && (
                  <p className="text-xs text-gray-400 mb-4">
                    Renouvellement le{' '}
                    <span className="font-medium text-gray-600">{renewalDate}</span>
                  </p>
                )}

                {/* Bouton */}
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

      {/* Section Pourquoi s'abonner ? */}
      <div className="bg-[#1A3A5C] rounded-[2rem] p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#F5A623]/20 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">Pourquoi s&apos;abonner ?</h2>
          <p className="text-[#F5A623] font-bold text-lg mb-6">
            Seulement 2€/mois/enfant — soit 0,06€ par jour
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PREMIUM_FEATURES.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="text-[#F5A623] shrink-0 mt-0.5 text-base">✨</span>
                <div>
                  <p className="font-semibold text-white text-sm">{item.title}</p>
                  <p className="text-blue-200 text-xs mt-0.5">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Note rassurante */}
      <div className="text-center text-sm text-gray-500 space-y-1 pb-4">
        <p>🔒 Paiement 100% sécurisé par Stripe</p>
        <p>Sans engagement · Résiliable en 1 clic depuis cette page</p>
      </div>

    </div>
  )
}
