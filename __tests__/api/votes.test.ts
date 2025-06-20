import { POST } from '@/app/api/votes/route'

// Mock environment
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_WS_URL = 'http://localhost:3001'

// Mock fetch for WebSocket broadcast
global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({})
}))

// Mock NextRequest
jest.mock('next/server', () => ({
  NextRequest: jest.fn((url, init) => ({
    json: () => Promise.resolve(JSON.parse(init.body)),
    url: url
  })),
  NextResponse: {
    json: (data, init) => ({
      status: init?.status || 200,
      json: async () => data
    })
  }
}))

// Mock database abstraction
jest.mock('@/lib/database', () => {
  const mockVotingSession = {
    getCurrent: jest.fn(),
    create: jest.fn()
  }

  const mockUserSessions = {
    get: jest.fn(),
    upsert: jest.fn()
  }

  const mockVotes = {
    getByUserAndSession: jest.fn(),
    create: jest.fn(),
    count: jest.fn()
  }

  return {
    db: {
      votingSession: mockVotingSession,
      userSessions: mockUserSessions,
      votes: mockVotes,
      from: jest.fn()
    },
    __mockVotingSession: mockVotingSession,
    __mockUserSessions: mockUserSessions,
    __mockVotes: mockVotes
  }
})

// Get mocks after defining them
const { __mockVotingSession, __mockUserSessions, __mockVotes } = require('@/lib/database')

describe('/api/votes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should submit a vote with rankings', async () => {
    // Setup mocks for successful vote submission
    __mockVotingSession.getCurrent.mockResolvedValue({
      id: 'session-1',
      status: 'open',
      environment: 'development'
    })
    
    __mockUserSessions.get.mockResolvedValue(null)
    __mockUserSessions.upsert.mockResolvedValue({
      id: 'user-session-1'
    })
    
    __mockVotes.getByUserAndSession.mockResolvedValue(null)
    __mockVotes.create.mockResolvedValue({
      id: 'vote-1',
      rankings: ['movie-1', 'movie-2', 'movie-3']
    })
    __mockVotes.count.mockResolvedValue(1)

    const request = {
      json: async () => ({
        rankings: ['movie-1', 'movie-2', 'movie-3'],
        sessionId: 'user-session-1'
      })
    }

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should reject empty rankings', async () => {
    const request = {
      json: async () => ({
        rankings: [],
        sessionId: 'user-session-1'
      })
    }

    const response = await POST(request)
    
    expect(response.status).toBe(400)
  })

  it('should reject duplicate votes', async () => {
    // Mock existing vote
    __mockVotingSession.getCurrent.mockResolvedValue({
      id: 'session-1',
      status: 'open',
      environment: 'development'
    })
    
    __mockUserSessions.get.mockResolvedValue({
      id: 'user-session-1'
    })
    
    __mockVotes.getByUserAndSession.mockResolvedValue({
      id: 'existing-vote'
    })

    const request = {
      json: async () => ({
        rankings: ['movie-1', 'movie-2'],
        sessionId: 'user-session-1'
      })
    }

    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('You have already voted')
  })

  it('should create voting session if none exists', async () => {
    // Mock no existing session
    __mockVotingSession.getCurrent.mockResolvedValue(null)
    __mockVotingSession.create.mockResolvedValue({
      id: 'new-session',
      status: 'open',
      environment: 'development'
    })
    
    __mockUserSessions.get.mockResolvedValue(null)
    __mockUserSessions.upsert.mockResolvedValue({
      id: 'user-session-1'
    })
    
    __mockVotes.getByUserAndSession.mockResolvedValue(null)
    __mockVotes.create.mockResolvedValue({
      id: 'vote-1',
      rankings: ['movie-1']
    })
    __mockVotes.count.mockResolvedValue(1)

    const request = {
      json: async () => ({
        rankings: ['movie-1'],
        sessionId: 'user-session-1'
      })
    }

    const response = await POST(request)
    
    expect(response.status).toBe(200)
  })
})