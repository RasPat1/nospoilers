import { NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET() {
  try {
    // Get current voting session for this environment
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
    
    console.log('Fetching results for environment:', environment)
    
    // Get the most recent open voting session for this environment
    const votingSession = await db.votingSession.getCurrent(environment)
    
    if (!votingSession) {
      console.log('No active voting session found')
      return NextResponse.json({
        rankings: {},
        totalVotes: 0
      })
    }
    
    console.log('Found voting session:', votingSession.id)
    
    // Get all votes for current session
    const votes = await db.votes.getBySession(votingSession.id)
    
    console.log(`Found ${votes?.length || 0} votes for session ${votingSession.id}`)

    // Implement Instant-Runoff Voting (IRV)
    let totalVotes = 0
    const eliminationRounds: Array<{
      round: number
      eliminated?: string
      voteCounts: Record<string, number>
      winner?: string
      tiedCandidates?: string[]
    }> = []
    
    // Count valid ballots
    const validBallots = votes?.filter(vote => 
      vote.rankings && Array.isArray(vote.rankings) && vote.rankings.length > 0
    ) || []
    totalVotes = validBallots.length
    
    if (totalVotes === 0) {
      return NextResponse.json({ 
        totalVotes: 0, 
        rankings: {},
        eliminationRounds: [],
        winner: null
      })
    }
    
    // Get all movie IDs that received at least one vote
    const movieIds = new Set<string>()
    validBallots.forEach(ballot => {
      ballot.rankings.forEach((movieId: string) => {
        movieIds.add(movieId)
      })
    })
    
    // Create active ballots (deep copy of rankings)
    let activeBallots = validBallots.map(ballot => [...ballot.rankings])
    const eliminatedMovies = new Set<string>()
    let round = 1
    let winner: string | null = null
    
    // Run IRV elimination rounds
    while (movieIds.size - eliminatedMovies.size > 1 && !winner) {
      // Count first-choice votes for remaining candidates
      const roundVotes: Record<string, number> = {}
      
      activeBallots.forEach(ballot => {
        // Find the first non-eliminated choice on this ballot
        const firstChoice = ballot.find(movieId => !eliminatedMovies.has(movieId))
        if (firstChoice) {
          roundVotes[firstChoice] = (roundVotes[firstChoice] || 0) + 1
        }
      })
      
      // Check if any candidate has a majority
      const majorityThreshold = Math.floor(totalVotes / 2) + 1
      for (const [movieId, voteCount] of Object.entries(roundVotes)) {
        if (voteCount >= majorityThreshold) {
          winner = movieId
          eliminationRounds.push({
            round,
            voteCounts: roundVotes,
            winner: movieId
          })
          break
        }
      }
      
      if (!winner) {
        // Find the candidate with the fewest votes
        let minVotes = Infinity
        let candidatesToEliminate: string[] = []
        
        // Consider all remaining candidates (even those with 0 votes this round)
        movieIds.forEach(movieId => {
          if (!eliminatedMovies.has(movieId)) {
            const voteCount = roundVotes[movieId] || 0
            if (voteCount < minVotes) {
              minVotes = voteCount
              candidatesToEliminate = [movieId]
            } else if (voteCount === minVotes) {
              candidatesToEliminate.push(movieId)
            }
          }
        })
        
        // Handle ties by showing all tied candidates
        if (candidatesToEliminate.length > 1) {
          // For now, eliminate the first candidate but note the tie
          const eliminated = candidatesToEliminate[0]
          eliminatedMovies.add(eliminated)
          
          eliminationRounds.push({
            round,
            eliminated,
            voteCounts: roundVotes,
            tiedCandidates: candidatesToEliminate // Add this to show the tie
          })
        } else {
          // Single candidate to eliminate
          const eliminated = candidatesToEliminate[0]
          eliminatedMovies.add(eliminated)
          
          eliminationRounds.push({
            round,
            eliminated,
            voteCounts: roundVotes
          })
        }
        
        round++
      }
    }
    
    // If no majority winner, the last remaining candidate wins
    if (!winner && movieIds.size - eliminatedMovies.size === 1) {
      winner = Array.from(movieIds).find(id => !eliminatedMovies.has(id)) || null
      if (winner) {
        eliminationRounds.push({
          round,
          voteCounts: { [winner]: totalVotes },
          winner
        })
      }
    }
    
    // Calculate final rankings based on elimination order
    const rankings: Record<string, number> = {}
    let rank = movieIds.size
    
    // Assign ranks based on when movies were eliminated (earlier elimination = lower rank)
    eliminationRounds.forEach(round => {
      if (round.eliminated) {
        rankings[round.eliminated] = rank--
      }
    })
    
    // Winner gets rank 1
    if (winner) {
      rankings[winner] = 1
    }
    
    // If we have an immediate winner, we need to continue the process to rank remaining movies
    if (winner && eliminationRounds.length === 1) {
      // Continue eliminating to determine 2nd, 3rd place, etc.
      const remainingMovies = Array.from(movieIds).filter(id => id !== winner)
      
      while (remainingMovies.length > 0) {
        // Count votes for remaining candidates (excluding winner)
        const roundVotes: Record<string, number> = {}
        
        activeBallots.forEach(ballot => {
          // Find the first non-eliminated choice (excluding winner)
          const firstChoice = ballot.find(movieId => 
            remainingMovies.includes(movieId) && !eliminatedMovies.has(movieId)
          )
          if (firstChoice) {
            roundVotes[firstChoice] = (roundVotes[firstChoice] || 0) + 1
          }
        })
        
        // Find the candidate with the fewest votes
        let minVotes = Infinity
        let candidateToEliminate = ''
        
        remainingMovies.forEach(movieId => {
          if (!eliminatedMovies.has(movieId)) {
            const voteCount = roundVotes[movieId] || 0
            if (voteCount < minVotes) {
              minVotes = voteCount
              candidateToEliminate = movieId
            }
          }
        })
        
        if (candidateToEliminate) {
          eliminatedMovies.add(candidateToEliminate)
          remainingMovies.splice(remainingMovies.indexOf(candidateToEliminate), 1)
          rankings[candidateToEliminate] = rank--
        } else {
          break
        }
      }
    }
    
    // Assign ranks to any remaining unranked movies
    Array.from(movieIds).forEach(movieId => {
      if (!rankings[movieId]) {
        rankings[movieId] = rank--
      }
    })
    
    // Calculate first-choice vote counts for display
    const firstChoiceVotes: Record<string, number> = {}
    validBallots.forEach(ballot => {
      const firstChoice = ballot.rankings[0]
      if (firstChoice) {
        firstChoiceVotes[firstChoice] = (firstChoiceVotes[firstChoice] || 0) + 1
      }
    })

    return NextResponse.json({
      rankings, // Return actual rankings (1 = first place, 2 = second, etc.)
      firstChoiceVotes, // Initial vote counts
      totalVotes,
      eliminationRounds,
      winner
    })
  } catch (error) {
    console.error('Error fetching vote results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vote results' },
      { status: 500 }
    )
  }
}