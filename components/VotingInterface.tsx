'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Movie } from '@/lib/types'
import Image from 'next/image'
import { ChevronUp, ChevronDown, Plus, X, Eye, EyeOff } from 'lucide-react'
import MovieSearchForm from './MovieSearchForm'
import React from 'react'
import { safeToFixed } from '@/lib/utils/safe-number'

interface VotingInterfaceProps {
  movies: Movie[]
  onSubmit: (rankedMovieIds: string[]) => Promise<any>
  newMovieTitle: string
  setNewMovieTitle: (title: string) => void
  onAddMovie: (e: React.FormEvent) => void
  onDeleteMovie?: (movieId: string) => void
}

export default function VotingInterface({ movies, onSubmit, newMovieTitle, setNewMovieTitle, onAddMovie, onDeleteMovie }: VotingInterfaceProps) {
  const [availableMovies, setAvailableMovies] = useState<Movie[]>([])
  const [rankedMovies, setRankedMovies] = useState<Movie[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showOverview, setShowOverview] = useState<Record<string, boolean>>({})
  const router = useRouter()

  // Update available movies when the movies prop changes
  React.useEffect(() => {
    // Filter out movies that are already ranked
    const rankedIds = new Set(rankedMovies.map(m => m.id))
    setAvailableMovies(movies.filter(m => !rankedIds.has(m.id)))
  }, [movies, rankedMovies])

  const toggleOverview = (movieId: string) => {
    setShowOverview(prev => ({
      ...prev,
      [movieId]: !prev[movieId]
    }))
  }

  const addToRanking = (movie: Movie) => {
    setAvailableMovies(prev => prev.filter(m => m.id !== movie.id))
    setRankedMovies(prev => [...prev, movie])
  }

  const removeFromRanking = (movie: Movie) => {
    setRankedMovies(prev => prev.filter(m => m.id !== movie.id))
    setAvailableMovies(prev => [...prev, movie])
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const newRanked = [...rankedMovies]
    ;[newRanked[index - 1], newRanked[index]] = [newRanked[index], newRanked[index - 1]]
    setRankedMovies(newRanked)
  }

  const moveDown = (index: number) => {
    if (index === rankedMovies.length - 1) return
    const newRanked = [...rankedMovies]
    ;[newRanked[index], newRanked[index + 1]] = [newRanked[index + 1], newRanked[index]]
    setRankedMovies(newRanked)
  }

  const handleSubmit = async () => {
    if (rankedMovies.length === 0) {
      alert('Please rank at least one movie')
      return
    }
    
    setIsSubmitting(true)
    try {
      await onSubmit(rankedMovies.map(movie => movie.id))
      // Redirect to results page after successful submission
      router.push('/results')
    } catch (error) {
      // Error is already handled in parent component
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Submit Button - Now at the very top */}
      <div className="sticky top-0 bg-neutral-50 dark:bg-neutral-950 pt-2 pb-4 mb-6 border-b border-neutral-200 dark:border-neutral-800 z-20">
        <button
          onClick={handleSubmit}
          disabled={rankedMovies.length === 0 || isSubmitting}
          className="w-full bg-success-600 hover:bg-success-700 active:bg-success-800 disabled:bg-neutral-300 disabled:text-neutral-500 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-600 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Rankings'}
        </button>
      </div>

      {/* Ranked Movies Section */}
      <div className="mb-8">
        <div className="sticky top-0 bg-neutral-50 dark:bg-neutral-950 z-10 pb-3 mb-3 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Your Ranking ({rankedMovies.length})
          </h2>
        </div>
        <div className="space-y-3">
          {rankedMovies.map((movie, index) => (
            <div
              key={movie.id}
              className="bg-success-50 dark:bg-success-950 border-2 border-success-500 dark:border-success-400 rounded-lg p-4 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl font-bold text-success-700 dark:text-success-400 w-8">
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
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">{movie.title}</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                        {movie.vote_average && ` • TMDB: ${safeToFixed(movie.vote_average)}⭐`}
                        {movie.rotten_tomatoes_score && ` • RT: ${movie.rotten_tomatoes_score}%`}
                      </p>
                      {showOverview[movie.id] && (
                        <>
                          {movie.director && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              Director: {movie.director}
                            </p>
                          )}
                          {movie.actors && movie.actors.length > 0 && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              Starring: {movie.actors.slice(0, 3).join(', ')}
                            </p>
                          )}
                          {movie.genres && movie.genres.length > 0 && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                              {movie.genres.join(', ')}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleOverview(movie.id)
                      }}
                      className="ml-2 p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                      title={showOverview[movie.id] ? "Hide details" : "Show details"}
                    >
                      {showOverview[movie.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {movie.overview && showOverview[movie.id] && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                      {movie.overview}
                    </p>
                  )}
                  {movie.rotten_tomatoes_url && showOverview[movie.id] && (
                    <a 
                      href={movie.rotten_tomatoes_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline mt-1 inline-block"
                    >
                      View on Rotten Tomatoes
                    </a>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="flex-1 bg-neutral-200 hover:bg-neutral-300 active:bg-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-400 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:active:bg-neutral-600 dark:disabled:bg-neutral-900 dark:disabled:text-neutral-600 text-neutral-700 dark:text-neutral-300 font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
                >
                  <ChevronUp className="w-5 h-5" />
                  Up
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === rankedMovies.length - 1}
                  className="flex-1 bg-neutral-200 hover:bg-neutral-300 active:bg-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-400 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:active:bg-neutral-600 dark:disabled:bg-neutral-900 dark:disabled:text-neutral-600 text-neutral-700 dark:text-neutral-300 font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
                >
                  <ChevronDown className="w-5 h-5" />
                  Down
                </button>
                <button
                  onClick={() => removeFromRanking(movie)}
                  className="flex-1 bg-danger-600 hover:bg-danger-700 active:bg-danger-800 text-white font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
                >
                  <X className="w-5 h-5" />
                  Remove
                </button>
              </div>
            </div>
          ))}
          {rankedMovies.length === 0 && (
            <p className="text-center text-neutral-600 dark:text-neutral-400 py-8">
              No movies ranked yet. Add movies from below!
            </p>
          )}
        </div>
      </div>

      {/* Add Movie Form - Now in the middle */}
      <MovieSearchForm onAddMovie={onAddMovie} />

      {/* Available Movies Section - Now at the bottom */}
      <div className="mb-8">
        <div className="sticky top-0 bg-neutral-50 dark:bg-neutral-950 z-10 pb-3 mb-3 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Available Movies ({availableMovies.length})
          </h2>
        </div>
        <div className="space-y-3">
          {availableMovies.map((movie) => (
            <div
              key={movie.id}
              className="bg-white dark:bg-neutral-900 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-800 p-4 transition-all"
            >
              <div className="flex items-start gap-3">
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
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">{movie.title}</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                        {movie.vote_average && ` • TMDB: ${safeToFixed(movie.vote_average)}⭐`}
                        {movie.rotten_tomatoes_score && ` • RT: ${movie.rotten_tomatoes_score}%`}
                      </p>
                      {showOverview[movie.id] && (
                        <>
                          {movie.director && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              Director: {movie.director}
                            </p>
                          )}
                          {movie.actors && movie.actors.length > 0 && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              Starring: {movie.actors.slice(0, 3).join(', ')}
                            </p>
                          )}
                          {movie.genres && movie.genres.length > 0 && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                              {movie.genres.join(', ')}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleOverview(movie.id)
                      }}
                      className="ml-2 p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                      title={showOverview[movie.id] ? "Hide details" : "Show details"}
                    >
                      {showOverview[movie.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {movie.overview && showOverview[movie.id] && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                      {movie.overview}
                    </p>
                  )}
                  {movie.rotten_tomatoes_url && showOverview[movie.id] && (
                    <a 
                      href={movie.rotten_tomatoes_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline mt-1 inline-block"
                    >
                      View on Rotten Tomatoes
                    </a>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => addToRanking(movie)}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add to Ranking
                </button>
                {onDeleteMovie && (
                  <button
                    onClick={() => {
                      if (confirm(`⚠️ WARNING: Are you sure you want to permanently delete "${movie.title}"?\n\nThis will BREAK THE VOTING if anyone has already ranked this movie! Only delete if you're certain nobody has voted yet.`)) {
                        onDeleteMovie(movie.id)
                      }
                    }}
                    className="bg-danger-600 hover:bg-danger-700 active:bg-danger-800 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
                    title="Delete movie"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {availableMovies.length === 0 && (
            <p className="text-center text-neutral-600 dark:text-neutral-400 py-8">
              All movies have been ranked!
            </p>
          )}
        </div>
      </div>

    </div>
  )
}