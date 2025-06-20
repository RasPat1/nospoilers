import { DELETE } from '@/app/api/votes/clear/route'
import { NextRequest } from 'next/server'

// Mock the database module before importing the route
jest.mock('@/lib/database', () => ({
  db: {
    votingSession: {
      getCurrent: jest.fn()
    },
    votes: {
      getByUserAndSession: jest.fn(),
      delete: jest.fn()
    }
  }
}))

// Mock NextRequest
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, options) => ({
    json: jest.fn().mockImplementation(() => 
      Promise.resolve(JSON.parse(options.body))
    ),
    url,
    method: options.method
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((data, options = {}) => ({
      json: () => Promise.resolve(data),
      status: options.status || 200
    }))
  }
}))

// Get the mocked database functions after mocking
const { db } = require('@/lib/database')

describe('/api/votes/clear', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should clear vote successfully', async () => {
    const mockVotingSession = { id: 'session-1', status: 'open' }
    const mockExistingVote = { id: 'vote-1' }
    
    db.votingSession.getCurrent.mockResolvedValueOnce(mockVotingSession)
    db.votes.getByUserAndSession
      .mockResolvedValueOnce(mockExistingVote) // First check
      .mockResolvedValueOnce(null) // After deletion
    db.votes.delete.mockResolvedValueOnce(undefined)

    const request = new NextRequest('http://localhost:3000/api/votes/clear', {
      method: 'DELETE',
      body: JSON.stringify({ sessionId: 'user-session-1' })
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      message: 'Vote cleared successfully',
      deletedCount: 1
    })
    expect(db.votes.delete).toHaveBeenCalledWith('user-session-1', 'session-1')
  })

  it('should return success when no vote exists', async () => {
    const mockVotingSession = { id: 'session-1', status: 'open' }
    
    db.votingSession.getCurrent.mockResolvedValueOnce(mockVotingSession)
    db.votes.getByUserAndSession.mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/votes/clear', {
      method: 'DELETE',
      body: JSON.stringify({ sessionId: 'user-session-1' })
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      message: 'No vote to clear',
      deletedCount: 0
    })
    expect(db.votes.delete).not.toHaveBeenCalled()
  })

  it('should return error when sessionId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/votes/clear', {
      method: 'DELETE',
      body: JSON.stringify({})
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'Session ID is required' })
  })

  it('should return error when no voting session exists', async () => {
    db.votingSession.getCurrent.mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/votes/clear', {
      method: 'DELETE',
      body: JSON.stringify({ sessionId: 'user-session-1' })
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toEqual({ error: 'No active voting session' })
  })

  it('should handle database errors', async () => {
    const mockVotingSession = { id: 'session-1', status: 'open' }
    
    db.votingSession.getCurrent.mockResolvedValueOnce(mockVotingSession)
    db.votes.getByUserAndSession.mockRejectedValueOnce(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/votes/clear', {
      method: 'DELETE',
      body: JSON.stringify({ sessionId: 'user-session-1' })
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to clear vote' })
  })
})