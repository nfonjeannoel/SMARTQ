// Server-side Supabase configuration
// This client is used for server-side operations and uses the service role key
// It bypasses RLS policies and should only be used in secure server contexts

import { createClient } from '@supabase/supabase-js'
import { serverEnv, env } from '../env'
import { Database } from '../types/database'

// Create Supabase client for server-side operations
const supabaseServer = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  serverEnv.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      // Server doesn't need persistent sessions
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    db: {
      // Configure database settings
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'smartq2-server-client',
      },
    },
  }
)

export { supabaseServer }

// Export default for convenience
export default supabaseServer

// Export types for convenience
export type SupabaseServerClient = typeof supabaseServer

// Helper function to create a client for specific operations
export function createServiceRoleClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
    }
  )
}

// Helper function to create anon client on server (for RLS testing)
export function createAnonClientOnServer() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
    }
  )
} 