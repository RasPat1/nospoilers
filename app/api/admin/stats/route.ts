import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
    
    // Get counts for current environment
    // Note: We need to use raw Supabase queries for counting as the abstraction doesn't have a generic count method
    const isSupabase = process.env.DATABASE_TYPE === 'supabase' || 
                       (!process.env.USE_LOCAL_DB && process.env.NODE_ENV === 'production');
    
    if (isSupabase) {
      const [moviesResult, votesResult, sessionsResult] = await Promise.all([
        supabase.from('movies').select('id', { count: 'exact' }),
        supabase.from('votes').select('id', { count: 'exact' }),
        supabase.from('voting_sessions').select('id', { count: 'exact' }).eq('environment', environment)
      ])

      return NextResponse.json({
        totalMovies: moviesResult.count || 0,
        totalVotes: votesResult.count || 0,
        totalSessions: sessionsResult.count || 0
      })
    } else {
      // For local database, we'll need to count manually
      const movies = await db.movies.getAll()
      const currentSession = await db.votingSession.getCurrent(environment)
      const votes = currentSession ? await db.votes.getBySession(currentSession.id) : []
      
      return NextResponse.json({
        totalMovies: movies.length,
        totalVotes: votes.length,
        totalSessions: currentSession ? 1 : 0 // This is simplified for local
      })
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}