import { useEffect, useRef, useCallback } from 'react'
import { Movie } from '@/lib/types'

interface WebSocketMessage {
  type: 'connected' | 'movie_added' | 'movie_deleted' | 'vote_submitted' | 'pong'
  movie?: Movie
  movieId?: string
  votingSessionId?: string
  voteCount?: number
}

export function useWebSocket(
  onMovieAdded: (movie: Movie) => void,
  onMovieDeleted: (movieId: string) => void,
  onVoteSubmitted?: (data: { votingSessionId: string; voteCount: number }) => void
) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    try {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close()
      }

      // Use port 3002 in test environment for consistency
      const wsPort = process.env.NODE_ENV === 'test' ? '3002' : (process.env.NEXT_PUBLIC_WS_PORT || '8081')
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || `ws://localhost:${wsPort}`
      console.log('Attempting WebSocket connection to:', wsUrl)
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        
        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, 30000) // Ping every 30 seconds
      }

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data)
          
          switch (data.type) {
            case 'connected':
              console.log('WebSocket connection confirmed')
              break
            case 'movie_added':
              if (data.movie) {
                console.log('Movie added via WebSocket:', data.movie)
                onMovieAdded(data.movie)
              }
              break
            case 'movie_deleted':
              if (data.movieId) {
                console.log('Movie deleted via WebSocket:', data.movieId)
                onMovieDeleted(data.movieId)
              }
              break
            case 'vote_submitted':
              if (data.votingSessionId && data.voteCount !== undefined && onVoteSubmitted) {
                console.log('Vote submitted via WebSocket:', data)
                onVoteSubmitted({
                  votingSessionId: data.votingSessionId,
                  voteCount: data.voteCount
                })
              }
              break
            case 'pong':
              // Heartbeat response
              break
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
        }
        
        // Attempt to reconnect after 30 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...')
          connect()
        }, 30000)
      }
    } catch (error) {
      console.error('Error creating WebSocket:', error)
    }
  }, [onMovieAdded, onMovieDeleted, onVoteSubmitted])

  useEffect(() => {
    // Initial connection
    connect()

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  // Return a function to manually close the connection if needed
  return () => {
    if (wsRef.current) {
      wsRef.current.close()
    }
  }
}