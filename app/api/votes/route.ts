import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { rankings, sessionId } = await request.json()
    
    console.log('Vote submission request:', { rankings, sessionId })

    if (!rankings || rankings.length === 0) {
      return NextResponse.json({ error: 'Rankings are required' }, { status: 400 })
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Get or create current voting session for this environment
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
    
    let { data: votingSessions, error: sessionQueryError } = await supabase
      .from('voting_sessions')
      .select('*')
      .eq('status', 'open')
      .eq('environment', environment)

    console.log('Voting sessions query result:', { votingSessions, sessionQueryError, environment })

    if (sessionQueryError) {
      console.error('Error querying voting sessions:', sessionQueryError)
      return NextResponse.json({ error: 'Failed to query voting sessions' }, { status: 500 })
    }

    let votingSession = votingSessions && votingSessions.length > 0 ? votingSessions[0] : null

    if (!votingSession) {
      console.log('No open voting session found, creating new one...')
      const { data: newSession, error: sessionError } = await supabase
        .from('voting_sessions')
        .insert([{ 
          status: 'open',
          environment: environment,
          created_at: new Date().toISOString()
        }])
        .select()

      if (sessionError) {
        console.error('Failed to create voting session:', sessionError)
        return NextResponse.json({ error: `Failed to create voting session: ${sessionError.message}` }, { status: 500 })
      }

      if (!newSession || newSession.length === 0) {
        console.error('No session returned after insert')
        return NextResponse.json({ error: 'Failed to create voting session - no data returned' }, { status: 500 })
      }

      votingSession = newSession[0]
    }

  // Create user session if it doesn't exist
  const { data: userSessions, error: userSessionError } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('id', sessionId)
  
  const userSession = userSessions && userSessions.length > 0 ? userSessions[0] : null

  if (!userSession) {
    console.log('Creating new user session:', sessionId)
    const { error: insertError } = await supabase
      .from('user_sessions')
      .insert({ id: sessionId })
    
    if (insertError) {
      console.error('Error creating user session:', insertError)
    }
  }

  // Check if user already voted
  const { data: existingVotes, error: existingVoteError } = await supabase
    .from('votes')
    .select('*')
    .eq('voting_session_id', votingSession.id)
    .eq('user_session_id', sessionId)
  
  const existingVote = existingVotes && existingVotes.length > 0 ? existingVotes[0] : null

  console.log('Checking for existing vote:', { 
    votingSessionId: votingSession.id, 
    userSessionId: sessionId,
    existingVote: !!existingVote,
    existingVoteCount: existingVotes?.length || 0,
    error: existingVoteError?.message 
  })

  if (existingVote) {
    return NextResponse.json({ error: 'You have already voted' }, { status: 400 })
  }

    // Submit vote
    const { data: newVote, error: voteError } = await supabase
      .from('votes')
      .insert({
        voting_session_id: votingSession.id,
        user_session_id: sessionId,
        rankings: rankings
      })
      .select()

    if (voteError) {
      console.error('Vote submission error:', voteError)
      return NextResponse.json({ error: voteError.message }, { status: 500 })
    }

    console.log('Vote submitted successfully:', {
      voteId: newVote?.[0]?.id,
      votingSessionId: votingSession.id,
      userSessionId: sessionId,
      environment: environment
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in vote submission:', error)
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 })
  }
}