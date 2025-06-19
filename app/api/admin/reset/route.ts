import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a service role client that bypasses RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  try {
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
    console.log('Resetting database for environment:', environment)
    
    // Get all voting sessions for this environment
    const { data: sessions, error: fetchError } = await supabaseAdmin
      .from('voting_sessions')
      .select('id')
      .eq('environment', environment)
    
    if (fetchError) {
      console.error('Error fetching sessions:', fetchError)
    }
    
    let deletedVotes = 0
    let deletedSessions = 0
    let deletedMovies = 0
    
    // Delete all votes for this environment's sessions
    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id)
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
    
    // Delete all movies
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
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database reset successfully',
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