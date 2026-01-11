import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Check if Supabase is configured via environment variables
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

/**
 * Initialize the Supabase client
 * Returns null if not configured (app runs in local-only mode)
 */
export function initSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    console.info('[Sync] Supabase not configured - running in local-only mode')
    return null
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false, // No auth, anonymous access
      },
    })
    console.info('[Sync] Supabase client initialized')
  }

  return supabaseClient
}

/**
 * Get the Supabase client instance
 * Returns null if not initialized or not configured
 */
export function getSupabase(): SupabaseClient | null {
  return supabaseClient
}

/**
 * Check if we're online
 */
export function isOnline(): boolean {
  return navigator.onLine
}
