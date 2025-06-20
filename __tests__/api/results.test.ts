// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.DATABASE_TYPE = 'postgres'
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/nospoilers_test'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => {
      return {
        status: init?.status || 200,
        json: async () => data
      }
    }
  }
}))

// Mock database abstraction
jest.mock('@/lib/database', () => {
  const mockVotingSession = {
    getCurrent: jest.fn()
  }

  const mockVotes = {
    getBySession: jest.fn()
  }

  const mockMovies = {
    getByIds: jest.fn()
  }

  return {
    db: {
      votingSession: mockVotingSession,
      votes: mockVotes,
      movies: mockMovies,
      from: jest.fn()
    },
    __mockVotingSession: mockVotingSession,
    __mockVotes: mockVotes,
    __mockMovies: mockMovies
  }
})

// Import after mocking
import { GET } from '@/app/api/votes/results/route'

// Get mocks after defining them
const { __mockVotingSession, __mockVotes, __mockMovies } = require('@/lib/database')

describe('/api/votes/results', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should calculate results correctly with multiple votes', async () => {
    // Mock voting session
    __mockVotingSession.getCurrent.mockResolvedValue({
      id: 'test-session-id',
      status: 'open',
      environment: 'test'
    })
    
    // Mock votes
    __mockVotes.getBySession.mockResolvedValue([
      { id: 'vote-1', rankings: ['movie-a', 'movie-b', 'movie-c'] },
      { id: 'vote-2', rankings: ['movie-b', 'movie-a', 'movie-c'] },
      { id: 'vote-3', rankings: ['movie-a', 'movie-c', 'movie-b'] }
    ])
    
    // Mock movies
    __mockMovies.getByIds.mockResolvedValue([
      { id: 'movie-a', title: 'Movie A', tmdb_rating: 8.0 },
      { id: 'movie-b', title: 'Movie B', tmdb_rating: 7.5 },
      { id: 'movie-c', title: 'Movie C', tmdb_rating: 9.0 }
    ])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.rankings).toBeDefined()
    expect(data.totalVotes).toBe(3)
    expect(data.winner).toBeDefined()
    // Movie A should have more points than Movie C
    expect(data.rankings['movie-a']).toBeGreaterThan(data.rankings['movie-c'])
  })

  it('should return empty results when no voting session exists', async () => {
    __mockVotingSession.getCurrent.mockResolvedValue(null)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.rankings).toEqual({})
    expect(data.totalVotes).toBe(0)
  })

  it('should handle empty votes', async () => {
    __mockVotingSession.getCurrent.mockResolvedValue({
      id: 'test-session-id',
      status: 'open',
      environment: 'test'
    })
    
    __mockVotes.getBySession.mockResolvedValue([])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalVotes).toBe(0)
    expect(data.rankings).toEqual({})
    expect(data.winner).toBeNull()
  })
})