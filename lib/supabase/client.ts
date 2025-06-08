// Client-side Supabase configuration
// This client is used for browser-side operations and uses the anon key
// It's safe to expose in the browser and respects RLS policies

import { createClient } from '@supabase/supabase-js'
import { env } from '../env'
import { Database } from '../types/database'

// Create Supabase client for client-side operations
const supabase = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      // Configure authentication settings
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: {
      // Configure database settings
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'smartq2-web-client',
      },
    },
  }
)

export { supabase }

// Export default for convenience
export default supabase

// Export types for convenience
export type SupabaseClient = typeof supabase 