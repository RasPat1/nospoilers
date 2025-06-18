import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Ranked Choice Voting (Instant Runoff) Algorithm
function calculateRankedChoiceWinner(votes: any[], movieIds: string[]): string | null {
  if (votes.length === 0) return null
  
  const rounds: any[] = []
  let remainingMovies = [...movieIds]
  
  while (remainingMovies.length > 1) {
    // Count first-choice votes for remaining movies
    const voteCounts: Record<string, number> = {}
    remainingMovies.forEach(id => voteCounts[id] = 0)
    
    votes.forEach(vote => {
      // Find the highest-ranked movie that's still in the running
      for (const movieId of vote.rankings) {
        if (remainingMovies.includes(movieId)) {
          voteCounts[movieId]++
          break
        }
      }
    })
    
    // Check if any movie has a majority
    const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0)
    const majorityThreshold = totalVotes / 2
    
    for (const [movieId, count] of Object.entries(voteCounts)) {
      if (count > majorityThreshold) {
        return movieId // Winner found!
      }
    }
    
    // No majority, eliminate the movie with the fewest votes
    let minVotes = Infinity
    let movieToEliminate = ''
    
    for (const [movieId, count] of Object.entries(voteCounts)) {
      if (count < minVotes) {
        minVotes = count
        movieToEliminate = movieId
      }
    }
    
    remainingMovies = remainingMovies.filter(id => id !== movieToEliminate)
    rounds.push({ eliminated: movieToEliminate, voteCounts })
  }
  
  return remainingMovies[0] || null
}

export async function POST(request: NextRequest) {
  // Get current open voting session
  const { data: votingSession } = await supabase
    .from('voting_sessions')
    .select('*')
    .eq('status', 'open')
    .single()

  if (!votingSession) {
    return NextResponse.json({ error: 'No open voting session' }, { status: 400 })
  }

  // Get all votes for this session
  const { data: votes, error: votesError } = await supabase
    .from('votes')
    .select('*')
    .eq('voting_session_id', votingSession.id)

  if (votesError) {
    return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 })
  }

  // Get all candidate movies
  const { data: movies } = await supabase
    .from('movies')
    .select('*')
    .eq('status', 'candidate')

  if (!movies || movies.length === 0) {
    return NextResponse.json({ error: 'No movies to vote on' }, { status: 400 })
  }

  const movieIds = movies.map(m => m.id)
  
  // Calculate winner using ranked choice voting
  const winnerId = calculateRankedChoiceWinner(votes || [], movieIds)

  // Update voting session with winner and close it
  const { error: updateError } = await supabase
    .from('voting_sessions')
    .update({
      status: 'closed',
      winner_movie_id: winnerId,
      closed_at: new Date().toISOString()
    })
    .eq('id', votingSession.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to close voting session' }, { status: 500 })
  }

  // Update winner movie status to 'watched'
  if (winnerId) {
    await supabase
      .from('movies')
      .update({ status: 'watched' })
      .eq('id', winnerId)
  }

  return NextResponse.json({ success: true, winnerId })
}