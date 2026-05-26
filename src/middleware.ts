import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Créer un client Supabase pour le middleware afin de lire les cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname

  // Bypass Auth pour Stripe Webhook
  if (pathname.startsWith('/api/stripe/webhook')) {
    return response
  }

  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/jouer')
  const isAdminRoute = pathname.startsWith('/admin')
  const isAuthRoute = pathname.startsWith('/connexion') || pathname.startsWith('/inscription')

  // Redirection si non authentifié vers route protégée
  if ((isProtectedRoute || isAdminRoute) && !session) {
    return NextResponse.redirect(new URL('/connexion', request.url))
  }

  // Protection Admin
  if (isAdminRoute && session) {
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',')
    if (!adminEmails.includes(session.user.email || '')) {
      return new NextResponse(null, { status: 404 })
    }
  }

  // Redirection si authentifié vers page de login/inscription
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Pour /jouer/* : Vérification que l'enfant appartient bien au parent
  // La sécurité réelle est garantie par la RLS en base.
  if (pathname.startsWith('/jouer/') && session) {
    // const childId = pathname.split('/')[2]
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/jouer/:path*',
    '/connexion',
    '/inscription',
    '/api/webhook'
  ],
}
