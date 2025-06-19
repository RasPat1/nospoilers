import { useEffect, useRef } from 'react'
import { Movie } from '@/lib/types'

interface MovieUpdateEvent {
  type: 'movie_added' | 'movie_deleted' | 'connected'
  movie?: Movie
  movieId?: string
}

export function useMovieUpdates(
  onMovieAdded: (movie: Movie) => void,
  onMovieDeleted: (movieId: string) => void
) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5
    const reconnectDelay = 1000 // Start with 1 second

    const connect = () => {
      try {
        // Close existing connection if any
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
        }

        const eventSource = new EventSource('/api/movies/events')
        eventSourceRef.current = eventSource

        eventSource.onopen = () => {
          console.log('SSE connection opened')
          reconnectAttempts = 0 // Reset attempts on successful connection
        }

        eventSource.onmessage = (event) => {
          try {
            const data: MovieUpdateEvent = JSON.parse(event.data)
            
            switch (data.type) {
              case 'connected':
                console.log('SSE connected successfully')
                break
              case 'movie_added':
                if (data.movie) {
                  console.log('Movie added via SSE:', data.movie)
                  onMovieAdded(data.movie)
                }
                break
              case 'movie_deleted':
                if (data.movieId) {
                  console.log('Movie deleted via SSE:', data.movieId)
                  onMovieDeleted(data.movieId)
                }
                break
            }
          } catch (error) {
            console.error('Error parsing SSE message:', error)
          }
        }

        eventSource.onerror = (error) => {
          console.error('SSE error:', error)
          eventSource.close()

          // Attempt to reconnect with exponential backoff
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++
            const delay = reconnectDelay * Math.pow(2, reconnectAttempts - 1)
            console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`)
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect()
            }, delay)
          } else {
            console.error('Max reconnection attempts reached')
          }
        }
      } catch (error) {
        console.error('Error creating EventSource:', error)
      }
    }

    // Initial connection
    connect()

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [onMovieAdded, onMovieDeleted])

  // Return a function to manually close the connection if needed
  return () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
  }
}