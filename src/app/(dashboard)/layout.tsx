import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/dashboard/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/connexion')

  const { data: parent } = await supabase
    .from('parents')
    .select('prenom')
    .eq('id', session.user.id)
    .single()

  return (
    <DashboardShell prenom={parent?.prenom ?? 'Parent'}>
      {children}
    </DashboardShell>
  )
}
