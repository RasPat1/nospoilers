'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent, closestCorners } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { getOrCreateSessionId } from '@/lib/session'
import MovieList from '@/components/MovieList'
import VotingInterface from '@/components/VotingInterface'
import Results from '@/components/Results'

interface Movie {
  id: string
  title: string
  status: string
  created_at: string
}

interface VotingSession {
  id: string
  status: string
  winner_movie_id: string | null
}

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [rankedMovies, setRankedMovies] = useState<Movie[]>([])
  const [newMovieTitle, setNewMovieTitle] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [votingSession, setVotingSession] = useState<VotingSession | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

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
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addMovie = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMovieTitle.trim()) return

    try {
      const response = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newMovieTitle, sessionId })
      })

      if (response.ok) {
        const { movie } = await response.json()
        setMovies([movie, ...movies])
        setNewMovieTitle('')
      }
    } catch (error) {
      console.error('Error adding movie:', error)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const activeMovie = movies.find(m => m.id === active.id) || 
                       rankedMovies.find(m => m.id === active.id)
    
    if (!activeMovie) return

    if (over.id === 'ranked-list') {
      if (!rankedMovies.find(m => m.id === activeMovie.id)) {
        setRankedMovies([...rankedMovies, activeMovie])
      }
    } else if (over.id === 'movie-list') {
      setRankedMovies(rankedMovies.filter(m => m.id !== activeMovie.id))
    } else {
      const oldIndex = rankedMovies.findIndex(m => m.id === active.id)
      const newIndex = rankedMovies.findIndex(m => m.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        setRankedMovies(arrayMove(rankedMovies, oldIndex, newIndex))
      }
    }
  }

  const submitVote = async () => {
    if (rankedMovies.length === 0) return

    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rankings: rankedMovies.map(m => m.id),
          sessionId
        })
      })

      if (response.ok) {
        setHasVoted(true)
        alert('Vote submitted!')
      }
    } catch (error) {
      console.error('Error submitting vote:', error)
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
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <main className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-4xl font-bold text-center mb-8">NoSpoilers Movie Night</h1>
      
      {votingSession?.status === 'closed' ? (
        <Results votingSession={votingSession} movies={movies} />
      ) : (
        <div>
          <form onSubmit={addMovie} className="mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMovieTitle}
                onChange={(e) => setNewMovieTitle(e.target.value)}
                placeholder="Add a movie..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add Movie
              </button>
            </div>
          </form>

          <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <MovieList movies={movies} rankedMovies={rankedMovies} />
              <VotingInterface 
                rankedMovies={rankedMovies} 
                onSubmitVote={submitVote}
                hasVoted={hasVoted}
              />
            </div>
          </DndContext>

          {isAdmin && (
            <div className="mt-8 text-center">
              <button
                onClick={closeVoting}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Close Voting (Admin)
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  )
}