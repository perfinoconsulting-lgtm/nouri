import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-blue-50/50">
      <h1 className="text-6xl font-bold text-primary mb-6 text-center tracking-tight">NourAl</h1>
      <p className="text-2xl text-primary/80 mb-12 text-center max-w-2xl font-medium">
        L'apprentissage ludique de l'arabe pour vos enfants.
      </p>
      <div className="flex gap-6">
        <Link href="/inscription" className="px-8 py-4 bg-accent text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-accent/90 transition transform hover:-translate-y-1">
          Commencer l'essai gratuit
        </Link>
        <Link href="/apprendre" className="px-8 py-4 bg-white text-primary border-2 border-primary/10 rounded-2xl font-bold text-lg shadow-sm hover:bg-gray-50 transition">
          Voir la démo
        </Link>
      </div>
    </main>
  )
}
