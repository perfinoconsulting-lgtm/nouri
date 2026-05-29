'use client'

import { useState, useEffect } from 'react'

interface ReferralStats {
  referrals: number
  monthsEarned: number
}

interface ReferralEntry {
  id: string
  created_at: string
  status: string
}

interface ReferralData {
  code: string
  firstChildPrenom: string | null
  stats: ReferralStats
  historique: ReferralEntry[]
}

export default function ParrainagePage() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [copie, setCopie] = useState(false)

  useEffect(() => {
    async function charger() {
      try {
        const res = await fetch('/api/referral')
        if (!res.ok) {
          const json = (await res.json()) as { error?: string }
          throw new Error(json.error ?? 'Erreur lors du chargement')
        }
        const json = (await res.json()) as ReferralData
        setData(json)
      } catch (err) {
        setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setChargement(false)
      }
    }
    void charger()
  }, [])

  // Message WhatsApp avec le prénom du premier enfant si disponible
  const prenom = data?.firstChildPrenom ?? 'mon enfant'
  const messageWA = data
    ? `Salam ! J'utilise NourAl pour que ${prenom} apprenne l'arabe.\nC'est super bien et seulement 2€/mois.\nAvec mon code ${data.code} tu as le 1er mois gratuit ! nouralapp.fr`
    : ''

  async function copierCode() {
    if (!data) return
    try {
      await navigator.clipboard.writeText(data.code)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch {
      // Clipboard non disponible — ne rien faire
    }
  }

  if (chargement) {
    return (
      <div className="space-y-6 animate-pulse max-w-lg">
        <div className="h-9 bg-gray-200 rounded w-52" />
        <div className="h-6 bg-gray-100 rounded w-80" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-gray-200 rounded-2xl" />
          <div className="h-24 bg-gray-200 rounded-2xl" />
        </div>
        <div className="h-40 bg-gray-200 rounded-2xl" />
      </div>
    )
  }

  if (erreur) {
    return (
      <div className="p-6 bg-[#E74C3C]/10 border border-[#E74C3C]/30 rounded-2xl text-[#E74C3C] max-w-lg">
        {erreur}
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-lg">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-[#1A3A5C]">Parrainage 🎁</h1>
        <p className="text-gray-500 mt-2 text-sm leading-relaxed">
          Partagez NourAl à vos proches et gagnez{' '}
          <span className="font-semibold text-[#27AE60]">1 mois gratuit</span>{' '}
          pour chaque famille qui s&apos;inscrit avec votre code.
        </p>
      </div>

      {/* Compteurs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1A3A5C] text-white p-5 rounded-2xl">
          <p className="text-4xl font-bold text-[#F5A623]">{data?.stats.referrals ?? 0}</p>
          <p className="text-sm text-blue-200 mt-1">
            {(data?.stats.referrals ?? 0) > 1 ? 'familles parrainées' : 'famille parrainée'}
          </p>
        </div>
        <div className="bg-[#27AE60]/10 border border-[#27AE60]/30 p-5 rounded-2xl">
          <p className="text-4xl font-bold text-[#27AE60]">{data?.stats.monthsEarned ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">
            {(data?.stats.monthsEarned ?? 0) > 1 ? 'mois offerts' : 'mois offert'}
          </p>
        </div>
      </div>

      {/* Code de parrainage */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-5">
        <div>
          <h2 className="font-bold text-[#1A3A5C] text-lg mb-1">Mon code de parrainage</h2>
          <p className="text-xs text-gray-400">
            La famille parrainée obtient son 1er mois gratuit, et vous aussi !
          </p>
        </div>

        {/* Code + copier */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 font-mono text-2xl font-bold text-[#1A3A5C] tracking-[0.3em] text-center select-all">
            {data?.code}
          </div>
          <button
            onClick={copierCode}
            aria-label="Copier le code"
            className="w-14 h-14 flex items-center justify-center bg-[#1A3A5C] text-white rounded-xl hover:bg-[#0f2a47] transition text-xl"
          >
            {copie ? '✓' : '📋'}
          </button>
        </div>

        {copie && (
          <p className="text-[#27AE60] text-sm text-center -mt-2">Code copié !</p>
        )}

        {/* Partage WhatsApp */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(messageWA)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#1da855] transition min-h-[48px] text-sm"
        >
          📤 Partager sur WhatsApp
        </a>
      </div>

      {/* Historique des parrainages */}
      {(data?.historique.length ?? 0) > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-[#1A3A5C]">Historique</h2>
          <div className="space-y-2">
            {data!.historique.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm"
              >
                <p className="text-sm text-gray-600">
                  {new Date(entry.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    entry.status === 'completed'
                      ? 'bg-[#27AE60]/10 text-[#27AE60]'
                      : 'bg-[#F5A623]/10 text-[#F5A623]'
                  }`}
                >
                  {entry.status === 'completed' ? '✓ Validé' : '⏳ En attente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* État vide — aucun parrainage encore */}
      {(data?.historique.length ?? 0) === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          <p className="text-3xl mb-3">🌙</p>
          <p>Vous n&apos;avez pas encore parrainé de famille.</p>
          <p className="mt-1">Partagez votre code et gagnez votre premier mois gratuit !</p>
        </div>
      )}
    </div>
  )
}
