import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Types générés à partir du schéma
export type Database = {
  public: {
    Tables: {
      parents: {
        Row: {
          id: string
          email: string
          prenom: string | null
          created_at: string
          updated_at: string | null
          stripe_customer_id: string | null
          onboarding_completed: boolean
        }
      }
      children: {
        Row: {
          id: string
          parent_id: string
          prenom: string
          age: number | null
          avatar: string | null
          niveau: number
          created_at: string
          last_active: string | null
        }
      }
    }
  }
}

// Client Supabase pour le navigateur (Client Components)
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Client Supabase pour le serveur (Server Components, API Routes, Actions)
export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Utilisé quand appelé depuis un Server Component. 
            // Ce catch est ignoré silencieusement.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Pareil qu'au-dessus
          }
        },
      },
    }
  )
}
