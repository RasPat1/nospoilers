import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { useRouter, usePathname } from 'next/navigation'
import HomePage from '@/app/page'
import VotePage from '@/app/vote/page'
import ResultsPage from '@/app/results/page'
import AdminPage from '@/app/admin/page'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}))

// Mock fetch globally
global.fetch = jest.fn()

describe('Page Availability and Error Tests', () => {
  const mockPush = jest.fn()
  const mockRouter = {
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(usePathname as jest.Mock).mockReturnValue('/')
    
    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'nospoilers-session=test-session-id',
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Home Page', () => {
    it('should render without errors', () => {
      expect(() => {
        render(<HomePage />)
      }).not.toThrow()
    })

    it('should display the main heading', () => {
      render(<HomePage />)
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })
  })

  describe('Vote Page', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/movies')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              movies: [
                {
                  id: '1',
                  title: 'Test Movie 1',
                  status: 'active',
                  created_at: new Date().toISOString(),
                  vote_average: 7.5, // Ensure this is a number
                  release_date: '2024-01-01',
                },
                {
                  id: '2',
                  title: 'Test Movie 2',
                  status: 'active',
                  created_at: new Date().toISOString(),
                  vote_average: '8.2', // Test string value
                  release_date: '2024-02-01',
                },
                {
                  id: '3',
                  title: 'Test Movie 3',
                  status: 'active',
                  created_at: new Date().toISOString(),
                  // No vote_average to test undefined
                  release_date: '2024-03-01',
                },
              ] 
            }),
          })
        }
        if (url.includes('/api/voting-session')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              session: { 
                id: '1', 
                status: 'open',
                winner_movie_id: null,
              } 
            }),
          })
        }
        if (url.includes('/api/votes/count')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ hasVoted: false }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      })
    })

    it('should render without errors', async () => {
      expect(() => {
        render(<VotePage />)
      }).not.toThrow()
      
      // Wait for async operations
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('should handle different vote_average types without errors', async () => {
      render(<VotePage />)
      
      // Wait for movies to load
      await waitFor(() => {
        expect(screen.getByText('Test Movie 1')).toBeInTheDocument()
      })
      
      // Should not throw any errors with different vote_average types
      expect(screen.getByText('Test Movie 2')).toBeInTheDocument()
      expect(screen.getByText('Test Movie 3')).toBeInTheDocument()
    })
  })

  describe('Results Page', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/movies')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              movies: [
                {
                  id: '1',
                  title: 'Winner Movie',
                  status: 'active',
                  created_at: new Date().toISOString(),
                  vote_average: 9.0,
                  release_date: '2024-01-01',
                },
                {
                  id: '2',
                  title: 'Runner Up',
                  status: 'active',
                  created_at: new Date().toISOString(),
                  vote_average: '7.5', // String to test conversion
                  release_date: '2024-02-01',
                },
              ] 
            }),
          })
        }
        if (url.includes('/api/voting-session')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              session: { 
                id: '1', 
                status: 'closed',
                winner_movie_id: '1',
              } 
            }),
          })
        }
        if (url.includes('/api/votes/results')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              rankings: { '1': 1, '2': 2 },
              firstChoiceVotes: { '1': 5, '2': 3 },
              totalVotes: 8,
              winner: '1',
              eliminationRounds: [
                {
                  round: 1,
                  voteCounts: { '1': 5, '2': 3 },
                  winner: '1',
                }
              ]
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      })
    })

    it('should render without errors', async () => {
      expect(() => {
        render(<ResultsPage />)
      }).not.toThrow()
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('should handle different vote_average types in results', async () => {
      render(<ResultsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Final Results')).toBeInTheDocument()
      })
      
      // Should display movies without errors
      expect(screen.getByText('Winner Movie')).toBeInTheDocument()
      expect(screen.getByText('Runner Up')).toBeInTheDocument()
    })

    it('should display first-choice votes instead of points', async () => {
      render(<ResultsPage />)
      
      await waitFor(() => {
        expect(screen.getByText(/5 first-choice votes/)).toBeInTheDocument()
        expect(screen.getByText(/3 first-choice votes/)).toBeInTheDocument()
      })
      
      // Should not display "points"
      expect(screen.queryByText(/points/)).not.toBeInTheDocument()
    })
  })

  describe('Admin Page', () => {
    beforeEach(() => {
      ;(usePathname as jest.Mock).mockReturnValue('/admin')
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/voting-session')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              session: { 
                id: '1', 
                status: 'open',
                winner_movie_id: null,
              } 
            }),
          })
        }
        if (url.includes('/api/admin/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              totalMovies: 5,
              totalVotes: 10,
              sessionStatus: 'open',
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      })
    })

    it('should render without errors', () => {
      expect(() => {
        render(<AdminPage />)
      }).not.toThrow()
    })

    it('should show login form initially', () => {
      render(<AdminPage />)
      expect(screen.getByPlaceholderText('Enter admin password')).toBeInTheDocument()
    })
  })

  describe('Error Boundary Testing', () => {
    it('should handle movies with invalid data gracefully', async () => {
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/movies')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              movies: [
                {
                  id: '1',
                  title: 'Movie with null vote',
                  status: 'active',
                  created_at: new Date().toISOString(),
                  vote_average: null,
                },
                {
                  id: '2',
                  title: 'Movie with invalid vote',
                  status: 'active',
                  created_at: new Date().toISOString(),
                  vote_average: 'invalid',
                },
                {
                  id: '3',
                  title: 'Movie with zero vote',
                  status: 'active',
                  created_at: new Date().toISOString(),
                  vote_average: 0,
                },
              ] 
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ session: { id: '1', status: 'open' } }),
        })
      })

      expect(() => {
        render(<VotePage />)
      }).not.toThrow()

      await waitFor(() => {
        expect(screen.getByText('Movie with null vote')).toBeInTheDocument()
        expect(screen.getByText('Movie with invalid vote')).toBeInTheDocument()
        expect(screen.getByText('Movie with zero vote')).toBeInTheDocument()
      })
    })
  })
})