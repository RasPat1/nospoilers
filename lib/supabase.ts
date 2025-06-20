import { createClient } from '@supabase/supabase-js'

// Only create Supabase client if we're using Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

// Create a dummy client for local development
const dummySupabase = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: { message: 'Using local database' } }),
    update: () => Promise.resolve({ data: null, error: { message: 'Using local database' } }),
    delete: () => Promise.resolve({ data: null, error: { message: 'Using local database' } }),
  })
}

// Use service key for server-side operations to bypass RLS
export const supabase = (supabaseUrl && (supabaseServiceKey || supabaseAnonKey)) 
  ? createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)
  : dummySupabase as any