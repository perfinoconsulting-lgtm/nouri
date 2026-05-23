import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

/**
 * Client Supabase pour requêtes standards (à adapter avec @supabase/ssr pour les Server Actions)
 */
export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}
