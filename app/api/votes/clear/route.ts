import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    
    console.log('Clear vote request for session:', sessionId)
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Get current open voting session for this environment
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
    
    const { data: votingSessions, error: sessionError } = await supabase
      .from('voting_sessions')
      .select('*')
      .eq('status', 'open')
      .eq('environment', environment)

    if (sessionError) {
      console.error('Error fetching voting session:', sessionError)
      return NextResponse.json({ error: 'Failed to fetch voting session' }, { status: 500 })
    }

    console.log('Found voting sessions:', votingSessions, 'for environment:', environment)
    const votingSession = votingSessions && votingSessions.length > 0 ? votingSessions[0] : null

    if (!votingSession) {
      return NextResponse.json({ error: 'No active voting session' }, { status: 404 })
    }

    // Delete the user's vote
    const { data: deletedVotes, error: deleteError } = await supabase
      .from('votes')
      .delete()
      .eq('voting_session_id', votingSession.id)
      .eq('user_session_id', sessionId)
      .select()

    if (deleteError) {
      console.error('Error deleting vote:', deleteError)
      return NextResponse.json({ error: 'Failed to clear vote' }, { status: 500 })
    }

    console.log('Deleted votes:', deletedVotes)
    return NextResponse.json({ success: true, message: 'Vote cleared successfully', deletedCount: deletedVotes?.length || 0 })
  } catch (error) {
    console.error('Unexpected error clearing vote:', error)
    return NextResponse.json({ error: 'Failed to clear vote' }, { status: 500 })
  }
}