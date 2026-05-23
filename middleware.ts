import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Placeholder pour l'initialisation de Supabase
  // const supabase = createClient()
  // const { data: { session } } = await supabase.auth.getSession()

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                           request.nextUrl.pathname.startsWith('/jouer')

  /*
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/connexion', request.url))
  }

  if ((request.nextUrl.pathname.startsWith('/connexion') || request.nextUrl.pathname.startsWith('/inscription')) && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  */

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/jouer/:path*', '/connexion', '/inscription'],
}
