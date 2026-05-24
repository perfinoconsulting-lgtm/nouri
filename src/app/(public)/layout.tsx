import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "NourAl — Apprendre l'arabe en s'amusant | Application pour enfants musulmans",
  description: "NourAl aide votre enfant à apprendre l'alphabet arabe, les mots et les sourates facilement. Interface ludique, suivi parental, 2€/mois. Essai gratuit.",
  keywords: "apprendre arabe enfant, alphabet arabe enfant France, application arabe musulman, cours arabe enfant maison, arabic kids france",
  openGraph: {
    title: "NourAl — Apprendre l'arabe en s'amusant",
    description: "NourAl aide votre enfant à apprendre l'alphabet arabe, les mots et les sourates facilement. Interface ludique, suivi parental, 2€/mois.",
    url: 'https://noural.fr',
    siteName: 'NourAl',
    images: [
      {
        url: 'https://noural.fr/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="absolute top-0 w-full z-50 p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-white">NourAl<span className="text-accent">.</span></Link>
          <nav className="hidden md:flex gap-6 text-white font-medium">
            <Link href="/a-propos" className="hover:text-accent transition">À Propos</Link>
            <Link href="/tarifs" className="hover:text-accent transition">Tarifs</Link>
            <Link href="/connexion" className="hover:text-accent transition">Connexion</Link>
          </nav>
          <Link href="/inscription" className="px-5 py-2 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition shadow-lg">
            Essai Gratuit
          </Link>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-primary text-white py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">NourAl<span className="text-accent">.</span></h3>
            <p className="text-gray-400 max-w-sm">L'application simple et ludique pour transmettre la langue arabe à vos enfants.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-lg">Liens utiles</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/a-propos" className="hover:text-white transition">À propos</Link></li>
              <li><Link href="/tarifs" className="hover:text-white transition">Tarifs</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-lg">Légal</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/mentions-legales" className="hover:text-white transition">Mentions légales</Link></li>
              <li><Link href="/cgv" className="hover:text-white transition">CGV</Link></li>
              <li><Link href="/politique" className="hover:text-white transition">Confidentialité</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto border-t border-white/10 pt-8 text-center text-gray-400 text-sm">
          <p>Fait avec ❤️ pour les familles musulmanes de France.</p>
          <p className="mt-2">© {new Date().getFullYear()} NourAl. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
