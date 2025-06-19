'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Search, Loader2 } from 'lucide-react'

interface MovieSearchResult {
  id: number
  title: string
  release_date: string
  poster_path: string | null
  vote_average: number
  overview: string
  director?: string
  actors?: string[]
}

interface MovieSearchFormProps {
  onAddMovie: (movie: any) => void
}

export default function MovieSearchForm({ onAddMovie }: MovieSearchFormProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MovieSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetch(`/api/movies/search?query=${encodeURIComponent(searchQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data.results || [])
          setShowResults(true)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const handleSelectMovie = async (movie: MovieSearchResult) => {
    const movieData = {
      title: movie.title,
      tmdb_id: movie.id,
      release_date: movie.release_date,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      overview: movie.overview,
      director: movie.director,
      actors: movie.actors
    }
    
    onAddMovie(movieData)
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
  }

  const handleManualAdd = () => {
    if (searchQuery.trim()) {
      onAddMovie({ title: searchQuery.trim() })
      setSearchQuery('')
      setShowResults(false)
    }
  }

  return (
    <div ref={formRef} className="relative mb-8">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          placeholder="Search for a movie..."
          className="w-full px-4 py-3 pl-10 text-base text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-neutral-400" />
          )}
        </div>
      </div>

      {showResults && (searchResults.length > 0 || searchQuery.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {searchResults.length > 0 ? (
            <>
              {searchResults.map((movie) => (
                <button
                  key={movie.id}
                  onClick={() => handleSelectMovie(movie)}
                  className="w-full px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    {movie.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                        alt={movie.title}
                        width={40}
                        height={60}
                        className="rounded"
                      />
                    ) : (
                      <div className="w-10 h-15 bg-neutral-200 dark:bg-neutral-700 rounded" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {movie.title}
                      </h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                        {movie.vote_average > 0 && ` • ${movie.vote_average.toFixed(1)}⭐`}
                        {movie.director && ` • Dir: ${movie.director}`}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </>
          ) : (
            <div className="px-4 py-3">
              <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-2">
                No movies found matching "{searchQuery}"
              </p>
              <button
                onClick={handleManualAdd}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors"
              >
                Add "{searchQuery}" anyway
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}