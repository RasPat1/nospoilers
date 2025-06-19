import { NextRequest } from 'next/server'
import { POST } from '@/app/api/votes/route'

// Mock database abstraction
const mockDb = {
  from: jest.fn()
}

jest.mock('@/lib/database', () => ({
  db: {
    from: jest.fn()
  }
}))

// Import db after mocking
const { db } = require('@/lib/database')

describe('/api/votes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementation
    db.from.mockImplementation((table) => {
      if (table === 'voting_sessions') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({
              data: [{ id: 'session-1', status: 'open' }],
              error: null
            }))
          })),
          insert: jest.fn(() => ({
            select: jest.fn(() => Promise.resolve({
              data: [{ id: 'session-1', status: 'open' }],
              error: null
            }))
          }))
        }
      }
      
      if (table === 'user_sessions') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: { id: 'user-session-1' },
                error: null
              }))
            }))
          })),
          insert: jest.fn(() => Promise.resolve({ error: null }))
        }
      }
      
      if (table === 'votes') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: null,
                  error: null
                }))
              }))
            }))
          })),
          insert: jest.fn(() => Promise.resolve({ error: null }))
        }
      }
    })
  })

  it('should submit a vote with rankings', async () => {
    const request = new NextRequest('http://localhost:3000/api/votes', {
      method: 'POST',
      body: JSON.stringify({
        rankings: ['movie-1', 'movie-2', 'movie-3'],
        sessionId: 'user-session-1'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should reject empty rankings', async () => {
    const request = new NextRequest('http://localhost:3000/api/votes', {
      method: 'POST',
      body: JSON.stringify({
        rankings: [],
        sessionId: 'user-session-1'
      })
    })

    const response = await POST(request)
    
    expect(response.status).toBe(400)
  })

  it('should reject duplicate votes', async () => {
    // Mock existing vote
    db.from.mockImplementation((table) => {
      if (table === 'votes') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: { id: 'existing-vote' }, // Vote exists
                  error: null
                }))
              }))
            }))
          }))
        }
      }
      // Return default mocks for other tables
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: [{ id: 'session-1', status: 'open' }],
            error: null
          }))
        }))
      }
    })

    const request = new NextRequest('http://localhost:3000/api/votes', {
      method: 'POST',
      body: JSON.stringify({
        rankings: ['movie-1', 'movie-2'],
        sessionId: 'user-session-1'
      })
    })

    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('You have already voted')
  })

  it('should create voting session if none exists', async () => {
    // Mock no existing session
    db.from.mockImplementation((table) => {
      if (table === 'voting_sessions') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({
              data: [], // No sessions
              error: null
            }))
          })),
          insert: jest.fn(() => ({
            select: jest.fn(() => Promise.resolve({
              data: [{ id: 'new-session', status: 'open' }],
              error: null
            }))
          }))
        }
      }
      // Return default mocks for other tables
      if (table === 'user_sessions') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: null,
                error: null
              }))
            }))
          })),
          insert: jest.fn(() => Promise.resolve({ error: null }))
        }
      }
      if (table === 'votes') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: null,
                  error: null
                }))
              }))
            }))
          })),
          insert: jest.fn(() => Promise.resolve({ error: null }))
        }
      }
    })

    const request = new NextRequest('http://localhost:3000/api/votes', {
      method: 'POST',
      body: JSON.stringify({
        rankings: ['movie-1'],
        sessionId: 'user-session-1'
      })
    })

    const response = await POST(request)
    
    expect(response.status).toBe(200)
  })
})