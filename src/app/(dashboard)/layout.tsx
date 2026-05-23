import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Home, Users, CreditCard, Settings, LogOut } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  
  // Vérification de session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/connexion')
  }

  // Récupération des infos parent avec une gestion s'il n'y a pas de parent_id valide
  const { data: parentData } = await supabase
    .from('parents')
    .select('prenom')
    .eq('id', session.user.id)
    .single()

  const prenom = parentData?.prenom || 'Parent'
  const initial = prenom.charAt(0).toUpperCase()

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-72 bg-white border-r border-gray-200 flex-col p-6 shadow-sm z-10 sticky top-0 h-screen">
        <div className="mb-10 px-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center text-xl font-bold shadow-sm">
            {initial}
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary leading-tight">{prenom}</h2>
            <p className="text-sm text-gray-500">Espace Parent</p>
          </div>
        </div>
        
        <nav className="flex flex-col gap-2 flex-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-blue-50 text-gray-700 hover:text-primary font-semibold transition">
            <Home size={20} /> Tableau de bord
          </Link>
          <Link href="/enfants" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-blue-50 text-gray-700 hover:text-primary font-semibold transition">
            <Users size={20} /> Mes Enfants
          </Link>
          <Link href="/abonnement" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-blue-50 text-gray-700 hover:text-primary font-semibold transition">
            <CreditCard size={20} /> Abonnement
          </Link>
          <Link href="/parametres" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-blue-50 text-gray-700 hover:text-primary font-semibold transition">
            <Settings size={20} /> Paramètres
          </Link>
        </nav>

        {/* Note : Pour le bouton de déconnexion dans un app router, il faut créer une Server Action ou un route handler (ex: /api/auth/signout) */}
        <form action="/api/auth/signout" method="post">
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl hover:bg-red-50 text-red-600 font-semibold transition mt-auto">
            <LogOut size={20} /> Déconnexion
          </button>
        </form>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 pb-24 md:pb-10 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto">
          {/* Header Mobile */}
          <div className="md:hidden flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold">
              {initial}
            </div>
            <h2 className="text-xl font-bold text-primary">Bonjour, {prenom}</h2>
          </div>
          
          {children}
        </div>
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-4 pb-safe z-50">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-gray-500 hover:text-primary">
          <Home size={24} />
          <span className="text-[10px] font-semibold">Accueil</span>
        </Link>
        <Link href="/enfants" className="flex flex-col items-center gap-1 text-gray-500 hover:text-primary">
          <Users size={24} />
          <span className="text-[10px] font-semibold">Enfants</span>
        </Link>
        <Link href="/abonnement" className="flex flex-col items-center gap-1 text-gray-500 hover:text-primary">
          <CreditCard size={24} />
          <span className="text-[10px] font-semibold">Abo</span>
        </Link>
        <Link href="/parametres" className="flex flex-col items-center gap-1 text-gray-500 hover:text-primary">
          <Settings size={24} />
          <span className="text-[10px] font-semibold">Menu</span>
        </Link>
      </nav>
    </div>
  )
}
