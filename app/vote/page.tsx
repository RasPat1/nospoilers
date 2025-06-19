'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getOrCreateSessionId } from '@/lib/session'
import VotingInterface from '@/components/VotingInterface'
import Results from '@/components/Results'
import { Movie, VotingSession } from '@/lib/types'
import { useWebSocket } from '@/hooks/useWebSocket'

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [newMovieTitle, setNewMovieTitle] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [votingSession, setVotingSession] = useState<VotingSession | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [voteCount, setVoteCount] = useState(0)
  const router = useRouter()

  // Set up real-time movie updates
  const handleMovieAdded = useCallback((movie: Movie) => {
    // Only add if not already in the list
    setMovies(prev => {
      const exists = prev.some(m => m.id === movie.id)
      if (!exists) {
        return [movie, ...prev]
      }
      return prev
    })
  }, [])

  const handleMovieDeleted = useCallback((movieId: string) => {
    setMovies(prev => prev.filter(m => m.id !== movieId))
  }, [])

  const handleVoteSubmitted = useCallback((data: { votingSessionId: string; voteCount: number }) => {
    // Update vote count when a vote is submitted
    if (votingSession && data.votingSessionId === votingSession.id) {
      setVoteCount(data.voteCount)
    }
  }, [votingSession])

  useWebSocket(handleMovieAdded, handleMovieDeleted, handleVoteSubmitted)

  useEffect(() => {
    const id = getOrCreateSessionId()
    setSessionId(id)
    loadData()
    checkAdminStatus()
  }, [])

  const checkAdminStatus = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const adminSecret = urlParams.get('admin')
    if (adminSecret === 'admin123') {
      setIsAdmin(true)
    }
  }

  const loadData = async () => {
    try {
      const id = getOrCreateSessionId()
      const [moviesRes, sessionRes] = await Promise.all([
        fetch('/api/movies'),
        fetch(`/api/voting-session?sessionId=${id}`)
      ])
      
      const moviesData = await moviesRes.json()
      const sessionData = await sessionRes.json()
      
      setMovies(moviesData.movies || [])
      setVotingSession(sessionData.session)
      
      if (sessionData.session && sessionData.hasVoted) {
        setHasVoted(true)
      }
      
      // Get initial vote count
      if (sessionData.session) {
        const voteCountRes = await fetch(`/api/votes/count?votingSessionId=${sessionData.session.id}`)
        if (voteCountRes.ok) {
          const { count } = await voteCountRes.json()
          setVoteCount(count || 0)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addMovie = async (movieData: any) => {
    try {
      const response = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...movieData, sessionId })
      })

      const data = await response.json()
      
      if (response.ok) {
        setMovies([data.movie, ...movies])
        setNewMovieTitle('')
      } else if (response.status === 409) {
        // Movie already exists
        alert('This movie has already been added to the list!')
      } else {
        alert(`Error adding movie: ${data.error}`)
      }
    } catch (error) {
      console.error('Error adding movie:', error)
      alert('Error adding movie. Please try again.')
    }
  }

  const deleteMovie = async (movieId: string) => {
    try {
      const response = await fetch(`/api/movies/${movieId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        setMovies(movies.filter(m => m.id !== movieId))
      } else {
        const error = await response.json()
        alert(`Error deleting movie: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting movie:', error)
      alert('Error deleting movie. Please try again.')
    }
  }

  const submitVote = async (rankedMovieIds: string[]) => {
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rankings: rankedMovieIds,
          sessionId
        })
      })

      if (response.ok) {
        setHasVoted(true)
        // Don't redirect here, let VotingInterface handle it
        return true
      } else {
        const errorData = await response.json()
        console.error('Vote submission failed:', errorData)
        throw new Error(errorData.error || 'Failed to submit vote')
      }
    } catch (error: any) {
      console.error('Error submitting vote:', error)
      alert(`Error submitting vote: ${error.message}`)
      throw error
    }
  }

  const clearVote = async () => {
    console.log('Clearing vote for session:', sessionId)
    try {
      const response = await fetch('/api/votes/clear', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      const result = await response.json()
      console.log('Clear vote response:', result)

      if (response.ok) {
        setHasVoted(false)
        await loadData() // Reload to get fresh data
      } else {
        alert(`Error clearing vote: ${result.error}`)
      }
    } catch (error) {
      console.error('Error clearing vote:', error)
      alert('Error clearing vote. Please try again.')
    }
  }

  const closeVoting = async () => {
    if (!isAdmin) return

    try {
      const response = await fetch('/api/voting-session/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error('Error closing voting:', error)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-lg text-neutral-700 dark:text-neutral-300">Loading...</div>
  }

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="px-4 py-6 max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-neutral-900 dark:text-neutral-100">NoSpoilers Movie Night</h1>
        
        {votingSession && voteCount > 0 && (
          <div className="bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800 rounded-lg p-3 mb-4 text-center">
            <p className="text-sm text-primary-700 dark:text-primary-300">
              {voteCount} {voteCount === 1 ? 'person has' : 'people have'} voted
            </p>
          </div>
        )}
        
        {votingSession?.status === 'closed' ? (
          <Results votingSession={votingSession} movies={movies} />
        ) : (
          <div>
            {hasVoted ? (
              <div className="bg-success-50 dark:bg-success-950 border-2 border-success-600 dark:border-success-400 rounded-lg p-6 text-center">
                <h2 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Thanks for voting!</h2>
                <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                  Your vote has been recorded!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => router.push('/results')}
                    className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
                  >
                    View Live Results
                  </button>
                  <button
                    onClick={clearVote}
                    className="bg-neutral-600 hover:bg-neutral-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
                  >
                    Clear Vote & Vote Again
                  </button>
                </div>
              </div>
            ) : (
              <VotingInterface 
                movies={movies} 
                onSubmit={submitVote}
                newMovieTitle={newMovieTitle}
                setNewMovieTitle={setNewMovieTitle}
                onAddMovie={addMovie}
                onDeleteMovie={deleteMovie}
              />
            )}

            {isAdmin && (
              <div className="mt-8 text-center">
                <button
                  onClick={closeVoting}
                  className="px-6 py-3 bg-danger-600 hover:bg-danger-700 text-white rounded-lg text-lg font-medium active:bg-danger-800 transition-colors"
                >
                  Close Voting (Admin)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}