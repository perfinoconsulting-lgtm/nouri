import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  
  // Vérifie si une session existe
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    await supabase.auth.signOut()
  }

  // Redirection vers la page de connexion après déconnexion
  return NextResponse.redirect(new URL('/connexion', request.url), {
    status: 302,
  })
}
