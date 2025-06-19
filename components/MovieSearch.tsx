'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Search, Loader2 } from 'lucide-react'

interface MovieSearchResult {
  id: number
  title: string
  year: number | null
  release_date: string
  poster_path: string | null
  vote_average: number
  overview: string
}

interface MovieSearchProps {
  onSelectMovie: (movie: MovieSearchResult) => void
  placeholder?: string
}

export default function MovieSearch({ onSelectMovie, placeholder = "Search for a movie..." }: MovieSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MovieSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<NodeJS.Timeout>()

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/movies/search?query=${encodeURIComponent(query)}`)
        const data = await response.json()
        setResults(data.results || [])
        setShowResults(true)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(debounceTimer.current)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelectMovie(results[selectedIndex])
        }
        break
      case 'Escape':
        setShowResults(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSelectMovie = async (movie: MovieSearchResult) => {
    setLoading(true)
    try {
      // Fetch full movie details
      const response = await fetch(`/api/movies/search?movieId=${movie.id}`)
      const fullDetails = await response.json()
      
      onSelectMovie(fullDetails)
      setQuery('')
      setResults([])
      setShowResults(false)
      setSelectedIndex(-1)
    } catch (error) {
      console.error('Error fetching movie details:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-10 text-base text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-neutral-400" />
          )}
        </div>
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.map((movie, index) => (
            <button
              key={movie.id}
              onClick={() => handleSelectMovie(movie)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left ${
                index === selectedIndex ? 'bg-neutral-100 dark:bg-neutral-800' : ''
              }`}
            >
              {movie.poster_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                  alt={movie.title}
                  width={45}
                  height={67}
                  className="rounded"
                />
              ) : (
                <div className="w-[45px] h-[67px] bg-neutral-200 dark:bg-neutral-700 rounded flex items-center justify-center text-xs text-neutral-500">
                  No Image
                </div>
              )}
              <div className="flex-1">
                <div className="font-medium text-neutral-900 dark:text-neutral-100">
                  {movie.title}
                  {movie.year && (
                    <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">
                      ({movie.year})
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-1">
                  {movie.overview}
                </p>
                {movie.vote_average > 0 && (
                  <div className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                    TMDB: {movie.vote_average.toFixed(1)}/10
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}