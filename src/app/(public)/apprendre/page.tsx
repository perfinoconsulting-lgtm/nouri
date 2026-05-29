import type { Metadata } from 'next'
import Link from 'next/link'
import { AlphabetDisplay } from '@/components/seo/AlphabetDisplay'

export const metadata: Metadata = {
  title: "Apprendre l'Alphabet Arabe Gratuitement | NourAl",
  description:
    "Découvrez les 28 lettres arabes avec illustrations, sons et quiz interactifs. Gratuit pour toujours. Parfait pour les enfants de 4 à 12 ans.",
  keywords: [
    'apprendre alphabet arabe',
    'alphabet arabe enfant',
    'cours arabe gratuit enfant',
    'lettres arabes maternelle',
    'apprendre arabe maison',
  ],
  openGraph: {
    title: "Apprendre l'Alphabet Arabe Gratuitement | NourAl",
    description:
      'Les 28 lettres arabes avec illustrations et sons. Pour les enfants dès 4 ans.',
    url: 'https://nouralapp.fr/apprendre',
    siteName: 'NourAl',
    images: [{ url: '/og', width: 1200, height: 630 }],
    locale: 'fr_FR',
    type: 'website',
  },
  alternates: { canonical: 'https://nouralapp.fr/apprendre' },
  robots: { index: true, follow: true },
}

const FAQ = [
  {
    question: 'À partir de quel âge peut-on commencer ?',
    answer:
      "NourAl est conçu pour les enfants dès 4 ans. Les exercices s'adaptent progressivement : les tout-petits commencent par reconnaître les formes des lettres, puis apprennent leurs noms et leurs sons. Vers 6-7 ans, l'enfant peut commencer à associer les lettres pour former des syllabes et des mots simples.",
  },
  {
    question: "Faut-il connaître l'arabe pour accompagner son enfant ?",
    answer:
      "Non, aucune connaissance préalable n'est nécessaire. NourAl est pensé pour les familles francophones : toutes les explications sont en français, les sons sont prononcés par des locuteurs natifs, et le tableau de bord parent vous permet de suivre les progrès sans avoir à maîtriser l'arabe vous-même.",
  },
  {
    question: "Comment fonctionne l'abonnement ?",
    answer:
      "L'abonnement est à 2€ par mois et par enfant. Vous pouvez ajouter plusieurs profils enfants sur un même compte parent. La facturation est mensuelle via Stripe, sans engagement. Le premier mois est offert à titre d'essai gratuit.",
  },
  {
    question: 'Mes données et celles de mes enfants sont-elles sécurisées ?',
    answer:
      "Oui. NourAl est conforme au RGPD et aux exigences CNIL pour les données de mineurs. Les données de vos enfants ne sont jamais partagées ni vendues à des tiers. L'accès à chaque profil enfant est strictement limité au compte parent auquel il est rattaché. Consultez notre politique de confidentialité pour plus de détails.",
  },
  {
    question: "Puis-je résilier à tout moment ?",
    answer:
      "Oui, la résiliation est immédiate et sans frais depuis votre espace parent. L'accès aux fonctionnalités premium reste actif jusqu'à la fin de la période déjà payée. Vous pouvez également demander la suppression complète de vos données via la section Paramètres.",
  },
]

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Accueil',
      item: 'https://nouralapp.fr',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: "Apprendre l'Alphabet Arabe",
      item: 'https://nouralapp.fr/apprendre',
    },
  ],
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((q) => ({
    '@type': 'Question',
    name: q.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: q.answer,
    },
  })),
}

export default function ApprendrePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section
          className="py-16 px-4"
          style={{ background: 'linear-gradient(135deg, #1A3A5C 0%, #0F2640 100%)' }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <nav aria-label="Fil d'Ariane" className="mb-8">
              <ol className="flex items-center justify-center gap-2 text-sm text-white/60">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    Accueil
                  </Link>
                </li>
                <li aria-hidden="true" className="text-white/30">
                  /
                </li>
                <li className="text-white/90" aria-current="page">
                  Apprendre l&apos;Alphabet Arabe
                </li>
              </ol>
            </nav>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Apprendre l&apos;Alphabet Arabe —{' '}
              <span style={{ color: '#F5A623' }}>Cours Gratuit pour Enfants</span>
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
              Découvrez les 28 lettres de l&apos;alphabet arabe avec illustrations, sons authentiques
              et exercices adaptés aux enfants de 4 à 12 ans.
            </p>
            <Link
              href="/inscription"
              className="inline-block px-8 py-4 rounded-2xl font-bold text-lg transition-transform hover:scale-105 active:scale-95"
              style={{ background: '#F5A623', color: '#1A3A5C' }}
            >
              Commencer gratuitement →
            </Link>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">
          {/* Section 1 : Les 28 lettres */}
          <section>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: '#1A3A5C' }}>
              Les 28 lettres de l&apos;alphabet arabe
            </h2>
            <p className="text-gray-600 mb-6">
              L&apos;alphabet arabe (الأبجدية العربية) se lit de droite à gauche et compte 28
              lettres, toutes des consonnes. Chaque lettre possède jusqu&apos;à 4 formes selon sa
              position dans le mot.
            </p>
            <AlphabetDisplay />
            <p className="text-sm text-gray-500 mt-3 text-center">
              Créez un compte gratuit pour interagir avec les lettres, écouter leur prononciation
              et jouer aux quiz.
            </p>
          </section>

          {/* Section 2 : Comment apprendre */}
          <section>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6" style={{ color: '#1A3A5C' }}>
              Comment apprendre l&apos;arabe à la maison ?
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                Apprendre l&apos;arabe en famille est tout à fait possible, même sans base
                préalable. La clé : la régularité plutôt que la durée. Quelques minutes par jour
                valent mieux qu&apos;une longue session hebdomadaire.
              </p>
              <p>
                <strong>Commencez par l&apos;alphabet.</strong> Avant de former des mots ou de lire
                le Coran, l&apos;enfant doit reconnaître et prononcer les 28 lettres. NourAl
                propose un ordre pédagogique par groupes de lettres similaires (ex. : ب ت ث, qui
                partagent la même forme de base), ce qui accélère l&apos;apprentissage.
              </p>
              <p>
                <strong>Rendez les sessions ludiques.</strong> Les enfants de 4 à 7 ans apprennent
                par le jeu : associer une lettre à un emoji, répéter un son, colorier une forme.
                NourAl intègre des animations, des sons et des récompenses pour maintenir la
                motivation.
              </p>
              <p>
                <strong>Valorisez chaque progrès.</strong> Un enfant qui reconnaît sa première
                lettre mérite une félicitation sincère. Le tableau de bord parent de NourAl vous
                montre précisément les lettres maîtrisées, en cours d&apos;apprentissage ou pas
                encore abordées — pour que vous puissiez encourager au bon moment.
              </p>
              <p>
                <strong>Intégrez l&apos;arabe au quotidien.</strong> Nommez les lettres dans les
                prénoms de la famille, les mots de la prière, les panneaux bilingues. Le contexte
                réel ancre l&apos;apprentissage bien plus efficacement que la répétition isolée.
              </p>
            </div>
          </section>

          {/* Section 3 : Pourquoi commencer par l'alphabet */}
          <section>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6" style={{ color: '#1A3A5C' }}>
              Pourquoi commencer par l&apos;alphabet ?
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                L&apos;alphabet est la fondation de toute lecture en arabe. Contrairement au
                français où les enfants peuvent mémoriser des mots entiers par la forme visuelle,
                l&apos;arabe s&apos;appuie sur un système consonantique : connaître les lettres
                permet de déchiffrer n&apos;importe quel mot, y compris ceux jamais rencontrés
                auparavant.
              </p>
              <p>
                Maîtriser l&apos;alphabet ouvre immédiatement l&apos;accès à la lecture du Coran
                avec les harakat (voyelles courtes), aux mots de la prière quotidienne, et à la
                communication écrite en arabe. C&apos;est un investissement de quelques semaines
                qui bénéficie toute une vie.
              </p>
            </div>
          </section>

          {/* Section 4 : FAQ */}
          <section>
            <h2 className="text-2xl sm:text-3xl font-bold mb-8" style={{ color: '#1A3A5C' }}>
              Questions fréquentes
            </h2>
            <div className="space-y-4">
              {FAQ.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-2xl border border-gray-200 overflow-hidden"
                >
                  <summary
                    className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer font-semibold text-gray-800 hover:bg-gray-50 transition-colors list-none"
                    style={{ userSelect: 'none' }}
                  >
                    <span>{item.question}</span>
                    <span
                      className="text-gray-400 text-xl transition-transform group-open:rotate-45"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>
                  <p className="px-6 pb-5 text-gray-600 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>

          {/* CTA final */}
          <section
            className="rounded-3xl p-8 text-center"
            style={{ background: 'linear-gradient(135deg, #1A3A5C 0%, #0F2640 100%)' }}
          >
            <p className="text-2xl font-bold text-white mb-2">Prêt à commencer l&apos;aventure ?</p>
            <p className="text-white/70 mb-6">
              Premier mois offert · Sans engagement · 2€/mois ensuite
            </p>
            <Link
              href="/inscription"
              className="inline-block px-8 py-4 rounded-2xl font-bold text-lg transition-transform hover:scale-105 active:scale-95"
              style={{ background: '#F5A623', color: '#1A3A5C' }}
            >
              Créer un compte gratuit
            </Link>
          </section>
        </div>
      </main>
    </>
  )
}
