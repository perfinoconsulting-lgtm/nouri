# Skill : Supabase Auth

## Quand lire ce skill
Avant toute page protégée, middleware, ou opération base de données.

## Packages requis
```bash
npm install @supabase/ssr @supabase/supabase-js
```

## Variables d'environnement requises
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # uniquement côté serveur
```

## Client browser (Client Components)
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

## Client server (Server Components, API routes)
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => cookieStore.set({ name, value, ...options }),
        remove: (name, options) => cookieStore.set({ name, value: '', ...options }),
      },
    }
  )
}
```

## Récupérer la session dans un Server Component
```typescript
const supabase = createServerSupabaseClient()
const { data: { session } } = await supabase.auth.getSession()
if (!session) redirect('/connexion')
const parentId = session.user.id
```

## Récupérer les données du parent
```typescript
const { data: parent } = await supabase
  .from('parents')
  .select('*')
  .eq('id', parentId)
  .single()
```

## Vérifier ownership d'un enfant
```typescript
// TOUJOURS faire cette vérification avant d'accéder aux données d'un enfant
const { data: child, error } = await supabase
  .from('children')
  .select('*')
  .eq('id', childId)
  .eq('parent_id', parentId)  // ← clé de sécurité
  .single()

if (error || !child) {
  redirect('/dashboard')  // ou return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
}
```

## Middleware (middleware.ts)
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* ... */ } }
  )
  const { data: { session } } = await supabase.auth.getSession()

  const isProtected = request.nextUrl.pathname.startsWith('/dashboard') ||
                      request.nextUrl.pathname.startsWith('/jouer')
  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/connexion', request.url))
  }
  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/jouer/:path*', '/admin/:path*'],
}
```

## RLS Supabase — policies à respecter
Chaque table a RLS activé. Les policies garantissent :
- Un parent ne lit que ses propres données
- Les enfants ne sont accessibles que par leur parent
- La progression n'est accessible que par le parent de l'enfant

## Erreurs fréquentes
| Erreur | Cause | Solution |
|--------|-------|----------|
| `Invalid JWT` | Token expiré | Refresh session |
| `Row Level Security` | Query sans auth | Toujours passer les cookies |
| `PGRST116` | Résultat vide avec .single() | Utiliser .maybeSingle() |
| Redirect infini | Middleware mal configuré | Exclure /api/* du matcher |
