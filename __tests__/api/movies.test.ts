import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/movies/route'

// Mock database abstraction
jest.mock('@/lib/database', () => ({
  db: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: [
              { id: '1', title: 'Movie 1', status: 'candidate' },
              { id: '2', title: 'Movie 2', status: 'candidate' }
            ],
            error: null
          })),
          single: jest.fn(() => Promise.resolve({
            data: null,
            error: null
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: '3', title: 'New Movie', status: 'candidate' },
            error: null
          }))
        }))
      }))
    }))
  }
}))

describe('/api/movies', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return list of candidate movies', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.movies).toHaveLength(2)
      expect(data.movies[0].title).toBe('Movie 1')
    })
  })

  describe('POST', () => {
    it('should add a movie with just a title', async () => {
      const request = new NextRequest('http://localhost:3000/api/movies', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Movie',
          sessionId: 'test-session'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.movie.title).toBe('New Movie')
    })

    it('should add a movie with full TMDB details', async () => {
      const request = new NextRequest('http://localhost:3000/api/movies', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Inception',
          sessionId: 'test-session',
          tmdb_id: 27205,
          poster_path: '/poster.jpg',
          backdrop_path: '/backdrop.jpg',
          release_date: '2010-07-16',
          vote_average: 8.8,
          director: 'Christopher Nolan',
          actors: ['Leonardo DiCaprio', 'Ellen Page'],
          plot: 'A mind-bending thriller',
          rotten_tomatoes_url: 'https://rottentomatoes.com/m/inception'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.movie.title).toBe('Inception')
    })

    it('should reject empty title', async () => {
      const request = new NextRequest('http://localhost:3000/api/movies', {
        method: 'POST',
        body: JSON.stringify({
          title: '',
          sessionId: 'test-session'
        })
      })

      const response = await POST(request)
      
      expect(response.status).toBe(400)
    })

    it('should handle manual movie entry without TMDB data', async () => {
      const request = new NextRequest('http://localhost:3000/api/movies', {
        method: 'POST',
        body: JSON.stringify({
          title: 'My Indie Film',
          sessionId: 'test-session'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.movie.title).toBe('My Indie Film')
      expect(data.movie.tmdb_id).toBeUndefined()
    })
  })
})