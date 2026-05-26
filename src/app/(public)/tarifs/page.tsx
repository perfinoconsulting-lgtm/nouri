import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "Tarifs — NourAl",
  description: "Offre gratuite et Premium 2€/mois par enfant. 7 jours d'essai gratuit, sans engagement.",
}

const GRATUIT = [
  "28 lettres de l'alphabet illustrées",
  "QCM interactifs de base",
  "Exercices d'écriture guidés",
  "Suivi de progression basique",
]

const PREMIUM = [
  "Tout le contenu gratuit inclus",
  "Module Syllabes (ba, bi, bou…)",
  "60+ mots illustrés par thèmes",
  "Al-Fatiha et petites sourates",
  "Répétition espacée intelligente",
  "Dashboard parent avancé",
  "Badges et certificats de niveau",
  "App installable sur téléphone",
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1A3A5C] mb-4">
            Des tarifs pensés pour toutes les familles
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Commencez gratuitement, passez Premium quand vous le souhaitez.
          </p>
        </div>

        {/* Grille deux colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

          {/* Colonne GRATUIT */}
          <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8 flex flex-col">
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Pour commencer</span>
              <h2 className="text-3xl font-bold text-[#1A3A5C] mt-1">Gratuit</h2>
              <p className="text-4xl font-bold text-gray-800 mt-3">
                0€ <span className="text-base font-medium text-gray-400">/ toujours</span>
              </p>
            </div>

            <ul className="space-y-3 flex-1">
              {GRATUIT.map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-700">
                  <span className="text-[#27AE60] text-lg leading-none mt-0.5">✅</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/inscription"
              className="mt-8 block text-center py-4 rounded-2xl border-2 border-[#1A3A5C] text-[#1A3A5C] font-bold text-lg hover:bg-[#1A3A5C] hover:text-white transition min-h-[48px] flex items-center justify-center"
            >
              Commencer gratuitement
            </Link>
          </div>

          {/* Colonne PREMIUM — mise en avant */}
          <div className="bg-[#1A3A5C] rounded-[2rem] shadow-xl p-8 flex flex-col relative overflow-hidden">
            {/* Badge essai */}
            <div className="absolute top-5 right-5">
              <span className="bg-[#F5A623] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                7 jours d'essai gratuit
              </span>
            </div>

            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-[#F5A623]">Le plus populaire</span>
              <h2 className="text-3xl font-bold text-white mt-1">Premium</h2>
              <p className="text-4xl font-bold text-white mt-3">
                2€ <span className="text-base font-medium text-white/60">/ mois / enfant</span>
              </p>
            </div>

            <ul className="space-y-3 flex-1">
              {PREMIUM.map((item) => (
                <li key={item} className="flex items-start gap-3 text-white/90">
                  <span className="text-[#00C9B1] text-lg leading-none mt-0.5">✨</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/inscription"
              className="mt-8 block text-center py-4 rounded-2xl bg-[#F5A623] text-white font-bold text-lg hover:bg-[#F5A623]/90 transition shadow-lg min-h-[48px] flex items-center justify-center"
            >
              Démarrer l'essai gratuit →
            </Link>

            <p className="text-center text-white/50 text-xs mt-4">
              Sans engagement · Résiliable en 1 clic · Paiement sécurisé Stripe
            </p>
          </div>
        </div>

        {/* Rassurance bas de page */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm">
            Des questions ? Écrivez-nous à{' '}
            <a href="mailto:contact@noural.fr" className="text-[#1A3A5C] font-medium hover:underline">
              contact@noural.fr
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
