import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const { rankings, sessionId } = await request.json()

  if (!rankings || rankings.length === 0) {
    return NextResponse.json({ error: 'Rankings are required' }, { status: 400 })
  }

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
  }

  // Get or create current voting session
  let { data: votingSession } = await supabase
    .from('voting_sessions')
    .select('*')
    .eq('status', 'open')
    .single()

  if (!votingSession) {
    const { data: newSession, error: sessionError } = await supabase
      .from('voting_sessions')
      .insert({})
      .select()
      .single()

    if (sessionError) {
      return NextResponse.json({ error: 'Failed to create voting session' }, { status: 500 })
    }
    votingSession = newSession
  }

  // Create user session if it doesn't exist
  const { data: userSession } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (!userSession) {
    await supabase
      .from('user_sessions')
      .insert({ id: sessionId })
  }

  // Check if user already voted
  const { data: existingVote } = await supabase
    .from('votes')
    .select('*')
    .eq('voting_session_id', votingSession.id)
    .eq('user_session_id', sessionId)
    .single()

  if (existingVote) {
    return NextResponse.json({ error: 'You have already voted' }, { status: 400 })
  }

  // Submit vote
  const { error: voteError } = await supabase
    .from('votes')
    .insert({
      voting_session_id: votingSession.id,
      user_session_id: sessionId,
      rankings: rankings
    })

  if (voteError) {
    return NextResponse.json({ error: voteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}