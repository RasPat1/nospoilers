import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '@/app/vote/page'

// Mock fetch
global.fetch = jest.fn()

// Mock router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock session
jest.mock('@/lib/session', () => ({
  getOrCreateSessionId: () => 'test-session-id'
}))

describe('Full Voting Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock initial data fetch
    ;(global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/movies/search')) {
        // Mock search to return no results for manual add to work
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            results: []
          })
        })
      }
      
      if (url.includes('/api/movies')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            movies: [
              {
                id: '1',
                title: 'Existing Movie',
                status: 'candidate',
                created_at: '2024-01-01',
                poster_path: '/poster.jpg',
                vote_average: 8.0
              }
            ]
          })
        })
      }
      
      if (url.includes('/api/voting-session')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            session: { id: 'session-1', status: 'open' },
            hasVoted: false
          })
        })
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      })
    })
  })

  it('should complete full voting flow', async () => {
    const user = userEvent.setup()
    
    render(<Home />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('NoSpoilers Movie Night')).toBeInTheDocument()
    })

    // 1. Add a new movie manually (without TMDB)
    const input = screen.getByPlaceholderText('Search for a movie...')
    await user.type(input, 'My Custom Movie')
    
    // Wait for the search to trigger and show no results, then the manual add button
    await waitFor(() => {
      expect(screen.getByText('Add "My Custom Movie" anyway')).toBeInTheDocument()
    })
    
    const addButton = screen.getByText('Add "My Custom Movie" anyway')
    
    // Mock the add movie response
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          movie: {
            id: '2',
            title: 'My Custom Movie',
            status: 'candidate',
            created_at: '2024-01-01'
          }
        })
      })
    )
    
    await user.click(addButton)

    // Wait for movie to be added
    await waitFor(() => {
      expect(screen.getByText('My Custom Movie')).toBeInTheDocument()
    })

    // 2. Add movies to ranking
    let addButtons = screen.getAllByRole('button', { name: /add to ranking/i })
    await user.click(addButtons[0]) // Add first movie (Existing Movie)
    
    // Get updated buttons after first click
    addButtons = screen.getAllByRole('button', { name: /add to ranking/i })
    await user.click(addButtons[0]) // Add second movie (My Custom Movie)

    // 3. Verify ranking shows both movies
    expect(screen.getByText('Your Ranking (2)')).toBeInTheDocument()

    // 4. Submit vote
    const submitButton = screen.getByText('Submit Rankings')
    
    // Mock vote submission
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    )
    
    await user.click(submitButton)

    // 5. Verify redirect to results
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/results')
    })
  })

  it('should handle voting when TMDB is unavailable', async () => {
    const user = userEvent.setup()
    
    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText('NoSpoilers Movie Night')).toBeInTheDocument()
    })

    // Add multiple movies manually
    const input = screen.getByPlaceholderText('Search for a movie...')
    
    // Add first movie
    await user.type(input, 'Obscure Film 1')
    
    // Wait for search to show no results
    await waitFor(() => {
      expect(screen.getByText('Add "Obscure Film 1" anyway')).toBeInTheDocument()
    })
    
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          movie: {
            id: '2',
            title: 'Obscure Film 1',
            status: 'candidate',
            created_at: '2024-01-01'
          }
        })
      })
    )
    await user.click(screen.getByText('Add "Obscure Film 1" anyway'))
    
    await waitFor(() => {
      expect(screen.getByText('Obscure Film 1')).toBeInTheDocument()
    })

    // Clear input and add second movie
    await user.clear(input)
    await user.type(input, 'Obscure Film 2')
    
    // Wait for search to show no results for second movie
    await waitFor(() => {
      expect(screen.getByText('Add "Obscure Film 2" anyway')).toBeInTheDocument()
    })
    
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          movie: {
            id: '3',
            title: 'Obscure Film 2',
            status: 'candidate',
            created_at: '2024-01-01'
          }
        })
      })
    )
    await user.click(screen.getByText('Add "Obscure Film 2" anyway'))

    await waitFor(() => {
      expect(screen.getByText('Obscure Film 2')).toBeInTheDocument()
    })

    // Verify all movies are present without TMDB data
    expect(screen.getByText('Existing Movie')).toBeInTheDocument()
    expect(screen.getByText('Obscure Film 1')).toBeInTheDocument()
    expect(screen.getByText('Obscure Film 2')).toBeInTheDocument()
  })

  it('should prevent duplicate voting', async () => {
    const user = userEvent.setup()
    
    // Mock as already voted
    ;(global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/voting-session')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            session: { id: 'session-1', status: 'open' },
            hasVoted: true
          })
        })
      }
      
      if (url.includes('/api/movies')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ movies: [] })
        })
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      })
    })

    render(<Home />)

    // Should show already voted message
    await waitFor(() => {
      expect(screen.getByText('Thanks for voting!')).toBeInTheDocument()
      expect(screen.getByText('View Live Results')).toBeInTheDocument()
    })

    // Should not show voting interface
    expect(screen.queryByText('Add to Ranking')).not.toBeInTheDocument()
  })
})