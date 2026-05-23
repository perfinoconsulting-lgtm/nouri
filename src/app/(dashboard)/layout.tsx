import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col p-6 shadow-sm z-10">
        <h2 className="text-3xl font-bold text-primary mb-10 px-4">NourAl<span className="text-accent">.</span></h2>
        <nav className="flex flex-col gap-2">
          <Link href="/dashboard" className="px-4 py-3 rounded-2xl hover:bg-blue-50 text-gray-700 hover:text-primary font-semibold transition">Tableau de bord</Link>
          <Link href="/enfants" className="px-4 py-3 rounded-2xl hover:bg-blue-50 text-gray-700 hover:text-primary font-semibold transition">Mes Enfants</Link>
          <Link href="/abonnement" className="px-4 py-3 rounded-2xl hover:bg-blue-50 text-gray-700 hover:text-primary font-semibold transition">Abonnement</Link>
          <Link href="/parametres" className="px-4 py-3 rounded-2xl hover:bg-blue-50 text-gray-700 hover:text-primary font-semibold transition">Paramètres</Link>
        </nav>
      </aside>
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
