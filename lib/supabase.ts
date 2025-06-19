import { createClient } from '@supabase/supabase-js'

// Only create Supabase client if we're using Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create a dummy client for local development
const dummySupabase = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: { message: 'Using local database' } }),
    update: () => Promise.resolve({ data: null, error: { message: 'Using local database' } }),
    delete: () => Promise.resolve({ data: null, error: { message: 'Using local database' } }),
  })
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : dummySupabase as any