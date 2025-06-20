import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { createClient } from '@supabase/supabase-js'

// Create a service role client that bypasses RLS (needed for bulk deletes)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  try {
    const { resetMovies = false } = await request.json()
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
    console.log('Resetting database for environment:', environment, 'Reset movies:', resetMovies)
    
    // Check if we're using Supabase or local database
    const isSupabase = process.env.DATABASE_TYPE === 'supabase' || 
                       (!process.env.USE_LOCAL_DB && process.env.NODE_ENV === 'production');
    
    let sessions = []
    
    if (isSupabase) {
      // Get all voting sessions for this environment
      const { data: s, error: fetchError } = await supabaseAdmin
        .from('voting_sessions')
        .select('id')
        .eq('environment', environment)
      
      if (fetchError) {
        console.error('Error fetching sessions:', fetchError)
      }
      sessions = s || []
    } else {
      // For local database, use raw query
      const result = await db.query(
        'SELECT id FROM voting_sessions WHERE environment = $1',
        [environment]
      )
      sessions = result.rows
    }
    
    let deletedVotes = 0
    let deletedSessions = 0
    let deletedMovies = 0
    
    if (isSupabase) {
      // Delete all votes for this environment's sessions
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map((s: any) => s.id)
        console.log('Deleting votes for sessions:', sessionIds)
        
        const { data: votesData, error: votesError } = await supabaseAdmin
          .from('votes')
          .delete()
          .in('voting_session_id', sessionIds)
          .select()
        
        if (votesError) {
          console.error('Error deleting votes:', votesError)
        } else {
          deletedVotes = votesData?.length || 0
          console.log('Deleted votes:', deletedVotes)
        }
      }
      
      // Delete all voting sessions for this environment
      const { data: sessionsData, error: sessionsError } = await supabaseAdmin
        .from('voting_sessions')
        .delete()
        .eq('environment', environment)
        .select()
      
      if (sessionsError) {
        console.error('Error deleting voting sessions:', sessionsError)
      } else {
        deletedSessions = sessionsData?.length || 0
        console.log('Deleted sessions:', deletedSessions)
      }
      
      // Only delete movies if explicitly requested
      if (resetMovies) {
        const { data: moviesData, error: moviesError } = await supabaseAdmin
          .from('movies')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000') // This will match all records
          .select()
        
        if (moviesError) {
          console.error('Error deleting movies:', moviesError)
        } else {
          deletedMovies = moviesData?.length || 0
          console.log('Deleted movies:', deletedMovies)
        }
      }
    } else {
      // For local database, use raw queries
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map((s: any) => s.id)
        console.log('Deleting votes for sessions:', sessionIds)
        
        const placeholders = sessionIds.map((_: any, i: number) => `$${i + 1}`).join(', ')
        const result = await db.query(
          `DELETE FROM votes WHERE voting_session_id IN (${placeholders}) RETURNING *`,
          sessionIds
        )
        deletedVotes = result.rowCount || 0
        console.log('Deleted votes:', deletedVotes)
      }
      
      // Delete all voting sessions for this environment
      const sessionsResult = await db.query(
        'DELETE FROM voting_sessions WHERE environment = $1 RETURNING *',
        [environment]
      )
      deletedSessions = sessionsResult.rowCount || 0
      console.log('Deleted sessions:', deletedSessions)
      
      // Only delete movies if explicitly requested
      if (resetMovies) {
        const moviesResult = await db.query(
          'DELETE FROM movies RETURNING *'
        )
        deletedMovies = moviesResult.rowCount || 0
        console.log('Deleted movies:', deletedMovies)
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: resetMovies ? 'Database fully reset' : 'Votes and sessions reset, movies preserved',
      environment,
      deleted: {
        votes: deletedVotes,
        sessions: deletedSessions,
        movies: deletedMovies
      }
    })
  } catch (error) {
    console.error('Unexpected error resetting database:', error)
    return NextResponse.json({ error: 'Failed to reset database' }, { status: 500 })
  }
}