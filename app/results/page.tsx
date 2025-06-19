'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Movie, VotingSession } from '@/lib/types'
import Image from 'next/image'
import { Trophy, Users, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'

export default function ResultsPage() {
  const [votingSession, setVotingSession] = useState<VotingSession | null>(null)
  const [movies, setMovies] = useState<Movie[]>([])
  const [voteDetails, setVoteDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showElimination, setShowElimination] = useState(false)
  const router = useRouter()

  const loadResults = async () => {
    try {
      const [moviesRes, sessionRes, votesRes] = await Promise.all([
        fetch('/api/movies'),
        fetch('/api/voting-session'),
        fetch('/api/votes/results')
      ])
      
      const moviesData = await moviesRes.json()
      const sessionData = await sessionRes.json()
      const votesData = await votesRes.json()
      
      setMovies(moviesData.movies || [])
      setVotingSession(sessionData.session)
      setVoteDetails(votesData)
    } catch (error) {
      console.error('Error loading results:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResults()
    
    // Poll for updates every 5 seconds
    const interval = setInterval(loadResults, 5000)
    
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-lg text-neutral-700 dark:text-neutral-300">
        Loading results...
      </div>
    )
  }

  const winner = voteDetails?.winner ? movies.find(m => m.id === voteDetails.winner) : null
  const isVotingClosed = votingSession?.status === 'closed'

  // Calculate rankings based on votes
  const movieRankings = movies
    .map(movie => {
      const votes = voteDetails?.rankings?.[movie.id] || 0
      return { ...movie, votes }
    })
    .sort((a, b) => b.votes - a.votes)
    .filter(movie => movie.votes > 0) // Only show movies that received votes

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            {isVotingClosed ? 'Final Results' : 'Live Results'}
          </h1>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Voting
          </button>
        </div>

        {/* Voting Status */}
        <div className="mb-8 p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              <p className="text-neutral-700 dark:text-neutral-300">
                Total Votes: <span className="font-semibold">{voteDetails?.totalVotes || 0}</span>
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isVotingClosed 
                ? 'bg-danger-100 text-danger-700 dark:bg-danger-900 dark:text-danger-300' 
                : 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300'
            }`}>
              {isVotingClosed ? 'Voting Closed' : 'Voting Open'}
            </div>
          </div>
        </div>

        {/* Winner Section (only show if voting is closed) */}
        {isVotingClosed && winner && (
          <div className="mb-8 bg-gradient-to-r from-success-50 to-success-100 dark:from-success-950 dark:to-success-900 border-2 border-success-500 dark:border-success-400 rounded-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <Trophy className="w-16 h-16 text-success-600 dark:text-success-400" />
            </div>
            <p className="text-lg mb-3 text-neutral-700 dark:text-neutral-300">The winner is:</p>
            <h2 className="text-4xl font-bold text-success-800 dark:text-success-300 mb-4">{winner.title}</h2>
            {winner.poster_path && (
              <div className="flex justify-center">
                <Image
                  src={`https://image.tmdb.org/t/p/w200${winner.poster_path}`}
                  alt={winner.title}
                  width={200}
                  height={300}
                  className="rounded-lg shadow-lg"
                />
              </div>
            )}
          </div>
        )}

        {/* Rankings List */}
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            {isVotingClosed ? 'Final Rankings' : 'Current Rankings'}
          </h2>
          {movieRankings.length === 0 ? (
            <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-8 text-center">
              <p className="text-neutral-600 dark:text-neutral-400">
                No votes have been cast yet. Be the first to vote!
              </p>
            </div>
          ) : (
          <div className="space-y-3">
            {movieRankings.map((movie, index) => (
              <div
                key={movie.id}
                className={`bg-white dark:bg-neutral-900 rounded-lg border p-4 transition-all ${
                  isVotingClosed && index === 0 
                    ? 'border-success-500 dark:border-success-400 shadow-lg' 
                    : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`text-2xl font-bold w-8 ${
                    isVotingClosed && index === 0 
                      ? 'text-success-600 dark:text-success-400' 
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}>
                    {index + 1}
                  </div>
                  {movie.poster_path && (
                    <Image
                      src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                      alt={movie.title}
                      width={60}
                      height={90}
                      className="rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                      {movie.title}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                      {movie.vote_average && ` • ${movie.vote_average.toFixed(1)}⭐`}
                    </p>
                    <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mt-1">
                      {movie.votes} points
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Elimination Rounds Section */}
        {voteDetails?.eliminationRounds && voteDetails.eliminationRounds.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowElimination(!showElimination)}
              className="w-full flex items-center justify-between p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                View Elimination Rounds (Instant-Runoff Voting)
              </h3>
              {showElimination ? (
                <ChevronUp className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              )}
            </button>
            
            {showElimination && (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  NoSpoilers uses Instant-Runoff Voting (IRV). Movies with the fewest first-choice votes are eliminated, 
                  and their votes transfer to voters' next preferences until one movie has a majority.
                </p>
                
                {voteDetails.eliminationRounds.map((round: any, index: number) => {
                  const isLastRound = index === voteDetails.eliminationRounds.length - 1
                  const eliminatedMovie = round.eliminated && movies.find(m => m.id === round.eliminated)
                  const winnerMovie = round.winner && movies.find(m => m.id === round.winner)
                  
                  return (
                    <div 
                      key={round.round} 
                      className={`bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border ${
                        isLastRound 
                          ? 'border-success-300 dark:border-success-700' 
                          : 'border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                        Round {round.round}
                        {isLastRound && ' - Final Round'}
                      </h4>
                      
                      <div className="space-y-2">
                        {Object.entries(round.voteCounts).map(([movieId, votes]) => {
                          const movie = movies.find(m => m.id === movieId)
                          const percentage = ((votes as number) / voteDetails.totalVotes * 100).toFixed(1)
                          
                          return (
                            <div key={movieId} className="flex items-center justify-between">
                              <span className={`text-sm ${
                                movieId === round.winner 
                                  ? 'font-semibold text-success-700 dark:text-success-300' 
                                  : movieId === round.eliminated
                                  ? 'text-danger-600 dark:text-danger-400 line-through'
                                  : 'text-neutral-700 dark:text-neutral-300'
                              }`}>
                                {movie?.title || 'Unknown Movie'}
                              </span>
                              <span className={`text-sm ${
                                movieId === round.winner 
                                  ? 'font-semibold text-success-700 dark:text-success-300' 
                                  : movieId === round.eliminated
                                  ? 'text-danger-600 dark:text-danger-400'
                                  : 'text-neutral-600 dark:text-neutral-400'
                              }`}>
                                {votes} votes ({percentage}%)
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      
                      {eliminatedMovie && (
                        <div className="mt-3">
                          <p className="text-sm text-danger-600 dark:text-danger-400">
                            ❌ {eliminatedMovie.title} eliminated (fewest votes)
                          </p>
                          {round.tiedCandidates && round.tiedCandidates.length > 1 && (
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                              ⚠️ Tie between: {round.tiedCandidates.map(id => 
                                movies.find(m => m.id === id)?.title || 'Unknown'
                              ).join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {winnerMovie && (
                        <p className="mt-3 text-sm font-semibold text-success-700 dark:text-success-300">
                          🏆 {winnerMovie.title} wins with a majority!
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Auto-refresh indicator */}
        {!isVotingClosed && (
          <div className="mt-8 text-center text-sm text-neutral-600 dark:text-neutral-400">
            Results update automatically every 5 seconds
          </div>
        )}
      </div>
    </main>
  )
}