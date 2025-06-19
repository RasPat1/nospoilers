// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NODE_ENV = 'test'

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

// Mock the entire Supabase module before imports
jest.mock('@supabase/supabase-js', () => {
  const mockFrom = jest.fn()
  
  return {
    createClient: jest.fn(() => ({
      from: mockFrom
    })),
    __mockFrom: mockFrom // Export for test access
  }
})

// Import after mocking
import { GET } from '@/app/api/votes/results/route'

// Get the mock from function
const { __mockFrom } = require('@supabase/supabase-js')

describe('/api/votes/results', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementation
    __mockFrom.mockImplementation((table: string) => {
      if (table === 'voting_sessions') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: { id: 'test-session-id', status: 'open', environment: 'test' },
                  error: null
                }))
              }))
            }))
          }))
        }
      }
      
      if (table === 'votes') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({
              data: [
                { rankings: ['movie-1', 'movie-2', 'movie-3'] },
                { rankings: ['movie-2', 'movie-1', 'movie-3'] },
                { rankings: ['movie-1', 'movie-3', 'movie-2'] }
              ],
              error: null
            }))
          }))
        }
      }
      
      return {
        select: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }
    })
  })

  it('should implement IRV correctly with majority winner', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalVotes).toBe(3)
    
    // With IRV, movie-1 has 2 first-place votes (majority), so it wins immediately
    expect(data.winner).toBe('movie-1')
    
    // All movies should be ranked even with immediate winner
    expect(data.rankings['movie-1']).toBe(3) // 1st place = 3 points
    expect(data.rankings['movie-2']).toBeDefined()
    expect(data.rankings['movie-3']).toBeDefined()
    
    // All three movies should have rankings
    expect(Object.keys(data.rankings).length).toBe(3)
    
    // Should have elimination rounds data
    expect(data.eliminationRounds).toBeDefined()
    expect(data.eliminationRounds.length).toBe(1) // Only one round needed for winner
    expect(data.eliminationRounds[0].winner).toBe('movie-1')
  })

  it('should handle empty votes', async () => {
    // Mock no votes
    __mockFrom.mockImplementation((table: string) => {
      if (table === 'voting_sessions') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: { id: 'test-session-id', status: 'open', environment: 'test' },
                  error: null
                }))
              }))
            }))
          }))
        }
      }
      
      if (table === 'votes') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({
              data: [],
              error: null
            }))
          }))
        }
      }
      
      return {
        select: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalVotes).toBe(0)
    expect(data.rankings).toEqual({})
  })

  it('should handle IRV with elimination rounds', async () => {
    // Mock votes that require elimination
    __mockFrom.mockImplementation((table: string) => {
      if (table === 'voting_sessions') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: { id: 'test-session-id', status: 'open', environment: 'test' },
                  error: null
                }))
              }))
            }))
          }))
        }
      }
      
      if (table === 'votes') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({
              data: [
                { rankings: ['movie-1', 'movie-2', 'movie-3'] },
                { rankings: ['movie-2', 'movie-3', 'movie-1'] },
                { rankings: ['movie-3', 'movie-1', 'movie-2'] },
                { rankings: ['movie-3', 'movie-2', 'movie-1'] }
              ],
              error: null
            }))
          }))
        }
      }
      
      return {
        select: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalVotes).toBe(4)
    
    // First round: movie-1: 1 vote, movie-2: 1 vote, movie-3: 2 votes
    // No majority (need 3 votes), so movie-1 or movie-2 eliminated
    // If movie-1 eliminated, its vote goes to movie-2
    // Final: movie-3 wins with 2 votes vs movie-2 with 2 votes (tie handling)
    
    expect(data.winner).toBeDefined()
    expect(data.eliminationRounds.length).toBeGreaterThan(0)
    
    // All movies should have rankings
    expect(Object.keys(data.rankings).length).toBe(3)
  })
  
  it('should handle partial ballots correctly', async () => {
    // Mock partial ballots
    __mockFrom.mockImplementation((table: string) => {
      if (table === 'voting_sessions') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: { id: 'test-session-id', status: 'open', environment: 'test' },
                  error: null
                }))
              }))
            }))
          }))
        }
      }
      
      if (table === 'votes') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({
              data: [
                { rankings: ['movie-1', 'movie-2'] }, // Didn't rank movie-3
                { rankings: ['movie-2', 'movie-3'] }, // Didn't rank movie-1
                { rankings: ['movie-1'] } // Only ranked movie-1
              ],
              error: null
            }))
          }))
        }
      }
      
      return {
        select: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalVotes).toBe(3)
    
    // IRV handles partial ballots - only counts active preferences
    expect(data.winner).toBeDefined()
    expect(data.eliminationRounds).toBeDefined()
  })
})