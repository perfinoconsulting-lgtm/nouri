import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "À propos — NourAl",
  description: "Découvrez l'histoire et les valeurs de NourAl, l'application d'arabe pour enfants musulmans de France.",
}

const ETAPES = [
  {
    numero: "01",
    titre: "Votre enfant choisit son avatar",
    description: "Il crée son personnage et se prépare pour l'aventure de l'alphabet arabe.",
  },
  {
    numero: "02",
    titre: "Il apprend lettre par lettre",
    description: "Jeux, quiz et exercices d'écriture adaptés à son rythme. Jamais ennuyeux, toujours encourageant.",
  },
  {
    numero: "03",
    titre: "Vous suivez sa progression",
    description: "Le dashboard parent vous montre ce qu'il a maîtrisé et ce qui mérite encore de la pratique.",
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Section 1 — Pourquoi NourAl ? */}
      <section className="bg-[#1A3A5C] text-white py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[#F5A623] font-bold uppercase tracking-widest text-sm mb-4">Notre histoire</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-8 leading-tight">
            Pourquoi NourAl ?
          </h1>
          <div className="space-y-5 text-white/80 text-lg leading-relaxed text-left">
            <p>
              Comme beaucoup de parents musulmans en France, nous voulions transmettre l'arabe à nos enfants —
              mais les méthodes disponibles étaient soit trop académiques, soit trop éloignées de la réalité
              de nos familles.
            </p>
            <p>
              NourAl est né de cette frustration. Une application pensée dès le départ pour les enfants de
              4 à 12 ans, en français, avec des contenus adaptés à notre contexte : l'alphabet, les mots du
              quotidien, et les sourates que nos enfants récitent déjà à la mosquée.
            </p>
            <p>
              Le nom <strong className="text-[#F5A623]">NourAl</strong> vient de <em>Nour</em> (نور — lumière en arabe)
              et <em>Al</em> pour l'article arabe. Apporter la lumière de la langue, simplement.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2 — Comment ça marche ? */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#F5A623] font-bold uppercase tracking-widest text-sm mb-3">Simple par design</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A3A5C]">Comment ça marche ?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ETAPES.map((etape) => (
              <div key={etape.numero} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 text-center">
                <div className="w-14 h-14 rounded-full bg-[#F5A623]/10 flex items-center justify-center mx-auto mb-5">
                  <span className="text-[#F5A623] font-bold text-xl">{etape.numero}</span>
                </div>
                <h3 className="font-bold text-[#1A3A5C] text-lg mb-3">{etape.titre}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{etape.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 — Notre engagement */}
      <section className="bg-white py-20 px-6 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#00C9B1] font-bold uppercase tracking-widest text-sm mb-3">Ce en quoi nous croyons</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A3A5C]">Notre engagement</h2>
          </div>

          <div className="space-y-6">
            <div className="flex gap-5 items-start">
              <span className="text-3xl flex-shrink-0">💰</span>
              <div>
                <h3 className="font-bold text-[#1A3A5C] text-lg mb-1">Un prix juste pour toutes les familles</h3>
                <p className="text-gray-500 leading-relaxed">
                  2€/mois par enfant, c'est délibéré. L'arabe ne doit pas être réservé aux familles aisées.
                  Une offre gratuite permanente reste disponible pour qui en a besoin.
                </p>
              </div>
            </div>

            <div className="flex gap-5 items-start">
              <span className="text-3xl flex-shrink-0">🔒</span>
              <div>
                <h3 className="font-bold text-[#1A3A5C] text-lg mb-1">Vos données restent vos données</h3>
                <p className="text-gray-500 leading-relaxed">
                  NourAl respecte le RGPD. Aucune donnée de votre enfant n'est revendue ni partagée.
                  Suppression complète du compte sur simple demande.
                </p>
              </div>
            </div>

            <div className="flex gap-5 items-start">
              <span className="text-3xl flex-shrink-0">📖</span>
              <div>
                <h3 className="font-bold text-[#1A3A5C] text-lg mb-1">Contenu validé et adapté</h3>
                <p className="text-gray-500 leading-relaxed">
                  Les sourates, les mots et les exercices ont été relus par des enseignants d'arabe
                  et des familles musulmanes francophones pour garantir exactitude et bienveillance.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/inscription"
              className="inline-block px-10 py-4 bg-[#F5A623] text-white font-bold text-lg rounded-2xl hover:bg-[#F5A623]/90 transition shadow-md min-h-[48px]"
            >
              Essayer gratuitement →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
