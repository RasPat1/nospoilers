/**
 * Integration tests to ensure pages render without runtime errors
 * Focused on testing the vote_average handling and other potential issues
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { useRouter, usePathname } from 'next/navigation'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}))

// Mock WebSocket to prevent connection attempts in tests
jest.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: false,
    sendMessage: jest.fn(),
  }),
}))

// Mock fetch globally
global.fetch = jest.fn()

describe('Page Rendering Tests', () => {
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
    
    // Default fetch mock
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })
  })

  test('Results page handles various vote_average types', async () => {
    const { default: ResultsPage } = await import('@/app/results/page')
    
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/movies')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            movies: [
              {
                id: '1',
                title: 'Movie with number vote',
                vote_average: 8.5,
                release_date: '2024-01-01',
              },
              {
                id: '2',
                title: 'Movie with string vote',
                vote_average: '7.3',
                release_date: '2024-01-01',
              },
              {
                id: '3',
                title: 'Movie with null vote',
                vote_average: null,
                release_date: '2024-01-01',
              },
              {
                id: '4',
                title: 'Movie with undefined vote',
                release_date: '2024-01-01',
              },
              {
                id: '5',
                title: 'Movie with zero vote',
                vote_average: 0,
                release_date: '2024-01-01',
              },
              {
                id: '6',
                title: 'Movie with invalid string',
                vote_average: 'invalid',
                release_date: '2024-01-01',
              },
            ] 
          }),
        })
      }
      if (url.includes('/api/votes/results')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            rankings: { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6 },
            firstChoiceVotes: { '1': 3, '2': 2, '3': 1, '4': 1, '5': 1, '6': 0 },
            totalVotes: 8,
            eliminationRounds: []
          }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ session: { status: 'open' } }),
      })
    })

    // Should not throw any errors
    expect(() => {
      render(<ResultsPage />)
    }).not.toThrow()
  })

  test('VotingInterface handles various vote_average types', async () => {
    const { default: VotingInterface } = await import('@/components/VotingInterface')
    
    const movies = [
      {
        id: '1',
        title: 'Test Movie 1',
        vote_average: 8.5,
        status: 'active',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Test Movie 2',
        vote_average: '7.3',
        status: 'active',
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        title: 'Test Movie 3',
        vote_average: null,
        status: 'active',
        created_at: new Date().toISOString(),
      },
      {
        id: '4',
        title: 'Test Movie 4',
        vote_average: 'invalid',
        status: 'active',
        created_at: new Date().toISOString(),
      },
    ]

    const handleSubmit = jest.fn()

    // Should not throw any errors
    expect(() => {
      render(
        <VotingInterface 
          movies={movies} 
          onSubmit={handleSubmit}
          hasVoted={false}
          isVotingOpen={true}
        />
      )
    }).not.toThrow()
  })

  test('MovieSearch handles various vote_average types', async () => {
    const { default: MovieSearch } = await import('@/components/MovieSearch')
    
    const handleSelect = jest.fn()
    
    // Mock the search API response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: [
          {
            id: 1,
            title: 'Movie 1',
            vote_average: 8.5,
            release_date: '2024-01-01',
          },
          {
            id: 2,
            title: 'Movie 2',
            vote_average: '7.3',
            release_date: '2024-01-01',
          },
          {
            id: 3,
            title: 'Movie 3',
            vote_average: null,
            release_date: '2024-01-01',
          },
        ]
      }),
    })

    // Should not throw any errors
    expect(() => {
      render(
        <MovieSearch 
          onSelect={handleSelect}
          existingMovieIds={[]}
        />
      )
    }).not.toThrow()
  })
})