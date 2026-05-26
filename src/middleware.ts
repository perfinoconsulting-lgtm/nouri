import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Injecter le pathname dans les headers pour que les Server Components puissent le lire
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Préserver x-pathname lors du refresh session
          response = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
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

  const isProtectedRoute =
    pathname.startsWith('/dashboard') || pathname.startsWith('/jouer')
  const isAdminRoute = pathname.startsWith('/admin')
  const isAuthRoute =
    pathname.startsWith('/connexion') || pathname.startsWith('/inscription')

  // Redirection si non authentifié vers route protégée
  if ((isProtectedRoute || isAdminRoute) && !session) {
    return NextResponse.redirect(new URL('/connexion', request.url))
  }

  // Protection Admin — email whitelist uniquement
  if (isAdminRoute && session) {
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim())
    if (!adminEmails.includes(session.user.email ?? '')) {
      return new NextResponse(null, { status: 404 })
    }
  }

  // Redirection si déjà authentifié vers page de login/inscription
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/jouer/:path*',
    '/admin/:path*',
    '/connexion',
    '/inscription',
  ],
}
