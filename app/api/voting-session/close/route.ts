import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

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
  try {
    // Get current open voting session for this environment
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
    
    const votingSession = await db.votingSession.getCurrent(environment)

    if (!votingSession) {
      return NextResponse.json({ error: 'No open voting session' }, { status: 400 })
    }

    // Get all votes for this session
    const votes = await db.votes.getBySession(votingSession.id)

    // Get all candidate movies
    const movies = await db.movies.getAll()

    if (!movies || movies.length === 0) {
      return NextResponse.json({ error: 'No movies to vote on' }, { status: 400 })
    }

  const movieIds = movies.map(m => m.id)
  
  // Calculate winner using ranked choice voting
  const winnerId = calculateRankedChoiceWinner(votes || [], movieIds)

    // Update voting session with winner and close it
    await db.votingSession.close(votingSession.id, winnerId)

    // Update winner movie status to 'watched'
    if (winnerId) {
      // Need to use raw supabase for status update as abstraction doesn't have update method
      const isSupabase = process.env.DATABASE_TYPE === 'supabase' || 
                         (!process.env.USE_LOCAL_DB && process.env.NODE_ENV === 'production');
      
      if (isSupabase) {
        const { supabase } = await import('@/lib/supabase')
        await supabase
          .from('movies')
          .update({ status: 'watched' })
          .eq('id', winnerId)
      } else {
        // For local database, use raw query
        await db.query(
          'UPDATE movies SET status = $1 WHERE id = $2',
          ['watched', winnerId]
        )
      }
    }

    return NextResponse.json({ success: true, winnerId })
  } catch (error) {
    console.error('Error closing voting session:', error)
    return NextResponse.json({ error: 'Failed to close voting session' }, { status: 500 })
  }
}