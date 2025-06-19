import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET() {
  try {
    // Get current voting session for this environment
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
    
    const { data: votingSession } = await supabase
      .from('voting_sessions')
      .select('*')
      .eq('status', 'open')
      .eq('environment', environment)
      .single()
    
    if (!votingSession) {
      return NextResponse.json({
        rankings: {},
        totalVotes: 0
      })
    }
    
    // Get all votes for current session
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('rankings')
      .eq('voting_session_id', votingSession.id)
    
    if (votesError) throw votesError

    // Calculate points for each movie
    const moviePoints: Record<string, number> = {}
    let totalVotes = 0

    votes?.forEach(vote => {
      if (vote.rankings && Array.isArray(vote.rankings)) {
        totalVotes++
        // Award points based on ranking position (1st place = most points)
        vote.rankings.forEach((movieId: string, index: number) => {
          const points = vote.rankings.length - index
          moviePoints[movieId] = (moviePoints[movieId] || 0) + points
        })
      }
    })

    return NextResponse.json({
      rankings: moviePoints,
      totalVotes
    })
  } catch (error) {
    console.error('Error fetching vote results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vote results' },
      { status: 500 }
    )
  }
}