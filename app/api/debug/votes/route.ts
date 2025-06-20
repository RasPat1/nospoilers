import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('sessionId')
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'

  try {
    // For debugging, we need to access all voting sessions, not just open ones
    // The abstraction doesn't have a method for this, so we'll use raw queries
    const isSupabase = process.env.DATABASE_TYPE === 'supabase' || 
                       (!process.env.USE_LOCAL_DB && process.env.NODE_ENV === 'production');
    
    let votingSessions = []
    let allVotes = []
    let userSessions = []
    
    if (isSupabase) {
      // Get all voting sessions for this environment
      const { data: vs, error: vsError } = await supabase
        .from('voting_sessions')
        .select('*')
        .eq('environment', environment)
        .order('created_at', { ascending: false })

      if (vsError) throw vsError
      votingSessions = vs || []

      // Get all votes for the current environment's sessions
      if (votingSessions.length > 0) {
        const sessionIds = votingSessions.map((vs: any) => vs.id)
        const { data: votes, error: votesError } = await supabase
          .from('votes')
          .select('*')
          .in('voting_session_id', sessionIds)
          .order('created_at', { ascending: false })

        if (votesError) throw votesError
        allVotes = votes || []
      }

      // Get user sessions
      const { data: us, error: usError } = await supabase
        .from('user_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (usError) throw usError
      userSessions = us || []
    } else {
      // For local database, use raw queries
      const vsResult = await db.query(
        'SELECT * FROM voting_sessions WHERE environment = $1 ORDER BY created_at DESC',
        [environment]
      )
      votingSessions = vsResult.rows
      
      if (votingSessions.length > 0) {
        const sessionIds = votingSessions.map((vs: any) => vs.id)
        const placeholders = sessionIds.map((_: any, i: number) => `$${i + 1}`).join(', ')
        const votesResult = await db.query(
          `SELECT * FROM votes WHERE voting_session_id IN (${placeholders}) ORDER BY created_at DESC`,
          sessionIds
        )
        allVotes = votesResult.rows
      }
      
      const usResult = await db.query(
        'SELECT * FROM user_sessions ORDER BY created_at DESC LIMIT 20'
      )
      userSessions = usResult.rows
    }

    // Filter by sessionId if provided
    const userVotes = sessionId 
      ? allVotes.filter((v: any) => v.user_session_id === sessionId)
      : allVotes

    return NextResponse.json({
      environment,
      sessionId,
      votingSessions: votingSessions?.map((vs: any) => ({
        id: vs.id,
        status: vs.status,
        created_at: vs.created_at,
        voteCount: allVotes.filter((v: any) => v.voting_session_id === vs.id).length
      })),
      totalVotes: allVotes.length,
      userVotes: userVotes.map((v: any) => ({
        id: v.id,
        voting_session_id: v.voting_session_id,
        user_session_id: v.user_session_id,
        rankings: v.rankings,
        created_at: v.created_at
      })),
      recentUserSessions: userSessions?.slice(0, 10).map((us: any) => ({
        id: us.id,
        created_at: us.created_at
      }))
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Debug endpoint error' }, { status: 500 })
  }
}