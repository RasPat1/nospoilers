import { render, screen, waitFor } from '@testing-library/react'
import ResultsPage from '@/app/results/page'

// Mock router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock fetch
global.fetch = jest.fn()

describe('Results Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display live results', async () => {
    ;(global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/movies')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            movies: [
              { id: '1', title: 'Movie A', vote_average: 8.5 },
              { id: '2', title: 'Movie B', vote_average: 7.8 },
              { id: '3', title: 'Movie C', vote_average: 6.9 }
            ]
          })
        })
      }
      
      if (url.includes('/api/voting-session')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            session: { 
              id: 'session-1', 
              status: 'open',
              winner_movie_id: null
            }
          })
        })
      }
      
      if (url.includes('/api/votes/results')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            rankings: {
              '1': 10, // Movie A has 10 points
              '2': 8,  // Movie B has 8 points
              '3': 5   // Movie C has 5 points
            },
            totalVotes: 5
          })
        })
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      })
    })

    render(<ResultsPage />)

    // Wait for results to load
    await waitFor(() => {
      expect(screen.getByText('Live Results')).toBeInTheDocument()
    })

    // Check vote count
    expect(screen.getByText('Total Votes:')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()

    // Check rankings display
    expect(screen.getByText('Movie A')).toBeInTheDocument()
    expect(screen.getByText('10 points')).toBeInTheDocument()
    
    expect(screen.getByText('Movie B')).toBeInTheDocument()
    expect(screen.getByText('8 points')).toBeInTheDocument()
    
    expect(screen.getByText('Movie C')).toBeInTheDocument()
    expect(screen.getByText('5 points')).toBeInTheDocument()

    // Voting should show as open
    expect(screen.getByText('Voting Open')).toBeInTheDocument()
  })

  it('should display winner when voting is closed', async () => {
    ;(global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/movies')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            movies: [
              { 
                id: '1', 
                title: 'Inception',
                poster_path: '/inception.jpg',
                director: 'Christopher Nolan',
                actors: ['Leonardo DiCaprio', 'Ellen Page']
              },
              { id: '2', title: 'The Matrix' }
            ]
          })
        })
      }
      
      if (url.includes('/api/voting-session')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            session: { 
              id: 'session-1', 
              status: 'closed',
              winner_movie_id: '1' // Inception wins
            }
          })
        })
      }
      
      if (url.includes('/api/votes/results')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            rankings: {
              '1': 15,
              '2': 10
            },
            totalVotes: 7,
            winner: '1' // Add winner to match component logic
          })
        })
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      })
    })

    render(<ResultsPage />)

    // Wait for results to load
    await waitFor(() => {
      expect(screen.getByText('Final Results')).toBeInTheDocument()
    })

    // Should show winner
    expect(screen.getByText('The winner is:')).toBeInTheDocument()
    
    // Look for the winner title in the winner banner (h2 with success styling)
    const winnerHeading = screen.getAllByText('Inception').find(el => 
      el.tagName === 'H2' && el.className.includes('text-4xl')
    )
    expect(winnerHeading).toBeInTheDocument()

    // Voting should show as closed
    expect(screen.getByText('Voting Closed')).toBeInTheDocument()
  })

  it('should handle no votes', async () => {
    ;(global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/movies')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            movies: [
              { id: '1', title: 'Movie A' }
            ]
          })
        })
      }
      
      if (url.includes('/api/voting-session')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            session: { 
              id: 'session-1', 
              status: 'open'
            }
          })
        })
      }
      
      if (url.includes('/api/votes/results')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            rankings: {},
            totalVotes: 0
          })
        })
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      })
    })

    render(<ResultsPage />)

    // Wait for results to load
    await waitFor(() => {
      expect(screen.getByText('Total Votes:')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    // Should show no votes message
    expect(screen.getByText('No votes have been cast yet. Be the first to vote!')).toBeInTheDocument()
  })

  it('should auto-refresh results', async () => {
    jest.useFakeTimers()
    
    let voteCount = 3
    ;(global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/votes/results')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            rankings: { '1': 10 },
            totalVotes: voteCount
          })
        })
      }
      
      // Return default responses for other endpoints
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          movies: [{ id: '1', title: 'Movie A' }],
          session: { status: 'open' }
        })
      })
    })

    render(<ResultsPage />)

    // Initial load
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    // Update vote count for next fetch
    voteCount = 5

    // Fast-forward 5 seconds
    jest.advanceTimersByTime(5000)

    // Should update to show new vote count
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    jest.useRealTimers()
  })
})