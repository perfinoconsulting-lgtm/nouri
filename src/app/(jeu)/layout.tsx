import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Baloo_2 } from 'next/font/google'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import EtoilesAnimees from '@/components/jeu/EtoilesAnimees'
import BoutonParents from '@/components/jeu/BoutonParents'
import LiveActivityTracker from '@/components/jeu/LiveActivityTracker'

const baloo2 = Baloo_2({
  subsets: ['latin'],
  variable: '--font-baloo2',
  weight: ['400', '600', '700', '800'],
})

export default async function JeuLayout({ children }: { children: React.ReactNode }) {
  // Vérification auth côté serveur
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/connexion')

  // Extraire le childId depuis le pathname injecté par le middleware
  const pathname = (await headers()).get('x-pathname') ?? ''
  const childId = pathname.match(/\/jouer\/([^/]+)/)?.[1]

  if (!childId) redirect('/dashboard')

  // Vérification ownership : l'enfant appartient bien à ce parent
  const { data: child, error } = await supabase
    .from('children')
    .select('prenom, avatar, niveau')
    .eq('id', childId)
    .eq('parent_id', session.user.id)
    .single()

  if (error || !child) redirect('/dashboard')

  // Calcul des étoiles depuis la progression (mastered = +3, en cours = +1)
  const { data: progressData } = await supabase
    .from('progress')
    .select('score, mastered')
    .eq('child_id', childId)

  const etoiles = (progressData ?? []).reduce((acc, p) => {
    if (p.mastered) return acc + 3
    if ((p.score as number) > 0) return acc + 1
    return acc
  }, 0)

  return (
    <div
      className={`${baloo2.variable} min-h-screen relative`}
      style={{ background: 'radial-gradient(ellipse at top, #0d2137 0%, #1A3A5C 70%)' }}
    >
      <EtoilesAnimees />
      <LiveActivityTracker childId={childId} />

      {/* Header 56px — h-14 */}
      <header className="relative z-10 h-14 flex items-center justify-between px-4 border-b border-white/10">
        <BoutonParents />

        {/* Centre : avatar + prénom */}
        <div className="flex items-center gap-2">
          <span className="text-3xl leading-none select-none">
            {child.avatar as string}
          </span>
          <span className="text-white font-semibold text-base">
            {child.prenom as string}
          </span>
        </div>

        {/* Droite : compteur étoiles */}
        <div
          className="font-bold text-sm min-w-[60px] text-right select-none"
          style={{ color: '#F5A623' }}
        >
          ⭐ {etoiles}
        </div>
      </header>

      <main className="relative z-10">
        {children}
      </main>
    </div>
  )
}
