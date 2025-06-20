import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

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
    
    let votingSession = await db.votingSession.getCurrent(environment)
    console.log('Voting sessions query result:', { votingSession, environment })

    if (!votingSession) {
      console.log('No open voting session found, creating new one...')
      try {
        votingSession = await db.votingSession.create(environment)
      } catch (error: any) {
        console.error('Failed to create voting session:', error)
        return NextResponse.json({ error: `Failed to create voting session: ${error.message || error}` }, { status: 500 })
      }
    }

  // Try to create user session if it doesn't exist (optional for Supabase due to RLS)
  try {
    const userSession = await db.userSessions.get(sessionId)
    
    if (!userSession) {
      console.log('Creating new user session:', sessionId)
      try {
        const createdSession = await db.userSessions.upsert(sessionId)
        console.log('User session created:', createdSession)
      } catch (sessionError: any) {
        console.warn('Could not create user session (RLS policy), continuing with vote creation:', sessionError.message)
        // Continue anyway - we'll let the vote creation handle the foreign key constraint
      }
    } else {
      console.log('User session already exists:', userSession)
    }
  } catch (sessionCheckError: any) {
    console.warn('Could not check user session (RLS policy), continuing with vote creation:', sessionCheckError.message)
    // Continue anyway
  }

  // Check if user already voted
  const existingVote = await db.votes.getByUserAndSession(sessionId, votingSession.id)

  console.log('Checking for existing vote:', { 
    votingSessionId: votingSession.id, 
    userSessionId: sessionId,
    existingVote: !!existingVote
  })

  if (existingVote) {
    return NextResponse.json({ error: 'You have already voted' }, { status: 400 })
  }

    // Submit vote
    try {
      const newVote = await db.votes.create(votingSession.id, sessionId, rankings)
      console.log('Vote submitted successfully:', {
        voteId: newVote?.id,
        votingSessionId: votingSession.id,
        userSessionId: sessionId,
        environment: environment
      })
    } catch (voteError: any) {
      console.error('Vote submission error:', voteError)
      
      // If it's a foreign key constraint error due to missing user session
      if (voteError.code === '23503' && voteError.message?.includes('user_session_id_fkey')) {
        return NextResponse.json({ 
          error: 'Unable to submit vote due to database configuration. Please contact support.' 
        }, { status: 500 })
      }
      
      return NextResponse.json({ error: voteError.message || 'Failed to submit vote' }, { status: 500 })
    }

    // Broadcast vote update via WebSocket
    try {
      // Get current vote count
      const voteCount = await db.votes.count(votingSession.id)

      const wsPort = process.env.WS_PORT || '3002'
      const wsUrl = `http://localhost:${wsPort}/broadcast`
      const response = await fetch(wsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'vote_submitted',
          votingSessionId: votingSession.id,
          voteCount: voteCount || 0,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        console.error('Failed to broadcast vote update:', response.statusText)
      }
    } catch (error) {
      console.error('Error broadcasting vote update:', error)
      // Don't fail the vote submission if broadcast fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in vote submission:', error)
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 })
  }
}