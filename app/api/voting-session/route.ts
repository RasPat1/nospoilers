import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('sessionId')
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'

  console.log('Getting voting session for environment:', environment)

  // Get current voting session for this environment
  const { data: sessions, error: sessionError } = await supabase
    .from('voting_sessions')
    .select('*')
    .eq('environment', environment)
    .order('created_at', { ascending: false })
    .limit(1)
  
  const session = sessions && sessions.length > 0 ? sessions[0] : null
  
  if (sessionError) {
    console.error('Error fetching voting session:', sessionError)
  }

  let hasVoted = false
  
  if (session && sessionId) {
    const { data: votes, error: voteError } = await supabase
      .from('votes')
      .select('*')
      .eq('voting_session_id', session.id)
      .eq('user_session_id', sessionId)
    
    if (voteError) {
      console.error('Error checking for existing vote:', voteError)
    }
    
    hasVoted = votes && votes.length > 0
    console.log('Vote check:', { sessionId, votingSessionId: session.id, hasVoted, voteCount: votes?.length || 0 })
  }

  return NextResponse.json({ session, hasVoted })
}