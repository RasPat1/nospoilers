import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('sessionId')
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'

  try {
    // Get all voting sessions for this environment
    const { data: votingSessions, error: vsError } = await supabase
      .from('voting_sessions')
      .select('*')
      .eq('environment', environment)
      .order('created_at', { ascending: false })

    if (vsError) throw vsError

    // Get all votes for the current environment's sessions
    let allVotes = []
    if (votingSessions && votingSessions.length > 0) {
      const sessionIds = votingSessions.map(vs => vs.id)
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .in('voting_session_id', sessionIds)
        .order('created_at', { ascending: false })

      if (votesError) throw votesError
      allVotes = votes || []
    }

    // Get user sessions
    const { data: userSessions, error: usError } = await supabase
      .from('user_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (usError) throw usError

    // Filter by sessionId if provided
    const userVotes = sessionId 
      ? allVotes.filter(v => v.user_session_id === sessionId)
      : allVotes

    return NextResponse.json({
      environment,
      sessionId,
      votingSessions: votingSessions?.map(vs => ({
        id: vs.id,
        status: vs.status,
        created_at: vs.created_at,
        voteCount: allVotes.filter(v => v.voting_session_id === vs.id).length
      })),
      totalVotes: allVotes.length,
      userVotes: userVotes.map(v => ({
        id: v.id,
        voting_session_id: v.voting_session_id,
        user_session_id: v.user_session_id,
        rankings: v.rankings,
        created_at: v.created_at
      })),
      recentUserSessions: userSessions?.slice(0, 10).map(us => ({
        id: us.id,
        created_at: us.created_at
      }))
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Debug endpoint error' }, { status: 500 })
  }
}