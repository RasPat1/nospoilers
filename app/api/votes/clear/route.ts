import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role client to bypass RLS for deletion
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    
    console.log('Clear vote request for session:', sessionId)
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Get current open voting session for this environment
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
    
    const { data: votingSessions, error: sessionError } = await supabaseAdmin
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

    // First, check if vote exists
    const { data: existingVotes, error: checkError } = await supabaseAdmin
      .from('votes')
      .select('*')
      .eq('voting_session_id', votingSession.id)
      .eq('user_session_id', sessionId)
    
    if (checkError) {
      console.error('Error checking existing votes:', checkError)
      return NextResponse.json({ error: 'Failed to check existing votes' }, { status: 500 })
    }
    
    console.log('Existing votes before delete:', existingVotes)
    
    if (!existingVotes || existingVotes.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No vote to clear', 
        deletedCount: 0 
      })
    }

    // Delete the user's vote
    const { data: deletedVotes, error: deleteError } = await supabaseAdmin
      .from('votes')
      .delete()
      .eq('voting_session_id', votingSession.id)
      .eq('user_session_id', sessionId)
      .select()

    if (deleteError) {
      console.error('Error deleting vote:', deleteError)
      console.error('Delete error details:', deleteError.message, deleteError.details, deleteError.hint)
      return NextResponse.json({ 
        error: 'Failed to clear vote', 
        details: deleteError.message 
      }, { status: 500 })
    }

    console.log('Deleted votes:', deletedVotes)
    
    // Verify deletion
    const { data: remainingVotes, error: verifyError } = await supabaseAdmin
      .from('votes')
      .select('*')
      .eq('voting_session_id', votingSession.id)
      .eq('user_session_id', sessionId)
    
    if (verifyError) {
      console.error('Error verifying deletion:', verifyError)
    } else {
      console.log('Remaining votes after delete:', remainingVotes)
    }
    return NextResponse.json({ success: true, message: 'Vote cleared successfully', deletedCount: deletedVotes?.length || 0 })
  } catch (error) {
    console.error('Unexpected error clearing vote:', error)
    return NextResponse.json({ error: 'Failed to clear vote' }, { status: 500 })
  }
}