import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('sessionId')
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'

  // Get current voting session for this environment
  const { data: session } = await supabase
    .from('voting_sessions')
    .select('*')
    .eq('environment', environment)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let hasVoted = false
  
  if (session && sessionId) {
    const { data: vote } = await supabase
      .from('votes')
      .select('*')
      .eq('voting_session_id', session.id)
      .eq('user_session_id', sessionId)
      .single()
    
    hasVoted = !!vote
  }

  return NextResponse.json({ session, hasVoted })
}