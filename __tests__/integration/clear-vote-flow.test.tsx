import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ResultsPage from '@/app/results/page'
import { useRouter } from 'next/navigation'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

// Mock fetch
global.fetch = jest.fn()

describe('Clear Vote Flow', () => {
  const mockPush = jest.fn()
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    })
    
    // Mock cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'nospoilers-session=test-session-123'
    })
  })

  it('should display "Clear Vote and Vote Again" button', async () => {
    // Mock API responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/movies')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            movies: [
              { id: 'movie-1', title: 'Test Movie 1' },
              { id: 'movie-2', title: 'Test Movie 2' }
            ]
          })
        } as Response)
      }
      if (url.includes('/api/voting-session')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            session: { id: 'session-1', status: 'open' }
          })
        } as Response)
      }
      if (url.includes('/api/votes/results')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            rankings: { 'movie-1': 3, 'movie-2': 1 },
            totalVotes: 1,
            winner: 'movie-1'
          })
        } as Response)
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    render(<ResultsPage />)

    // Wait for results to load
    await waitFor(() => {
      expect(screen.getByText('Clear Vote and Vote Again')).toBeInTheDocument()
    })
  })

  it('should clear vote and redirect when button is clicked', async () => {
    // Setup mocks
    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/api/votes/clear') && options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, deletedCount: 1 })
        } as Response)
      }
      // Return default responses for other endpoints
      return Promise.resolve({
        json: () => Promise.resolve({})
      } as Response)
    })

    render(<ResultsPage />)

    // Wait for button to appear
    await waitFor(() => {
      expect(screen.getByText('Clear Vote and Vote Again')).toBeInTheDocument()
    })

    // Click the button
    const clearButton = screen.getByText('Clear Vote and Vote Again')
    fireEvent.click(clearButton)

    // Verify API call and redirect
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/votes/clear',
        expect.objectContaining({
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: 'test-session-123' })
        })
      )
      expect(mockPush).toHaveBeenCalledWith('/vote')
    })
  })

  it('should redirect even if clear vote fails', async () => {
    // Mock failed API response
    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/api/votes/clear')) {
        return Promise.resolve({
          ok: false,
          status: 500
        } as Response)
      }
      return Promise.resolve({
        json: () => Promise.resolve({})
      } as Response)
    })

    render(<ResultsPage />)

    await waitFor(() => {
      expect(screen.getByText('Clear Vote and Vote Again')).toBeInTheDocument()
    })

    const clearButton = screen.getByText('Clear Vote and Vote Again')
    fireEvent.click(clearButton)

    // Should still redirect even on error
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/vote')
    })
  })
})