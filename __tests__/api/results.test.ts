import { GET } from '@/app/api/votes/results/route'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({
        data: [
          { rankings: ['movie-1', 'movie-2', 'movie-3'] },
          { rankings: ['movie-2', 'movie-1', 'movie-3'] },
          { rankings: ['movie-1', 'movie-3', 'movie-2'] }
        ],
        error: null
      }))
    }))
  }
}))

describe('/api/votes/results', () => {
  it('should calculate correct point totals', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalVotes).toBe(3)
    
    // Movie 1: 3 points + 2 points + 3 points = 8 points
    expect(data.rankings['movie-1']).toBe(8)
    
    // Movie 2: 2 points + 3 points + 1 point = 6 points
    expect(data.rankings['movie-2']).toBe(6)
    
    // Movie 3: 1 point + 1 point + 2 points = 4 points
    expect(data.rankings['movie-3']).toBe(4)
  })

  it('should handle empty votes', async () => {
    jest.clearAllMocks()
    
    // Mock no votes
    const { supabase } = require('@/lib/supabase')
    supabase.from.mockImplementation(() => ({
      select: jest.fn(() => Promise.resolve({
        data: [],
        error: null
      }))
    }))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalVotes).toBe(0)
    expect(data.rankings).toEqual({})
  })

  it('should handle different length rankings', async () => {
    jest.clearAllMocks()
    
    const { supabase } = require('@/lib/supabase')
    supabase.from.mockImplementation(() => ({
      select: jest.fn(() => Promise.resolve({
        data: [
          { rankings: ['movie-1', 'movie-2'] }, // 2 movies ranked
          { rankings: ['movie-2', 'movie-3', 'movie-1'] }, // 3 movies ranked
          { rankings: ['movie-1'] } // Only 1 movie ranked
        ],
        error: null
      }))
    }))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalVotes).toBe(3)
    
    // Points should be calculated based on position
    // Movie 1: 2 + 1 + 1 = 4 points
    expect(data.rankings['movie-1']).toBe(4)
    
    // Movie 2: 1 + 3 + 0 = 4 points
    expect(data.rankings['movie-2']).toBe(4)
    
    // Movie 3: 0 + 2 + 0 = 2 points
    expect(data.rankings['movie-3']).toBe(2)
  })
})