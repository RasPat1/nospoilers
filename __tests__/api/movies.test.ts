import { GET, POST } from '@/app/api/movies/route'

// Mock environment
process.env.NODE_ENV = 'test'

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
  const mockMovies = {
    getAll: jest.fn(),
    getByStatus: jest.fn(),
    findByTitle: jest.fn(),
    getByTmdbId: jest.fn(),
    create: jest.fn()
  }

  return {
    db: {
      movies: mockMovies,
      from: jest.fn()
    },
    __mockMovies: mockMovies
  }
})

// Get mocks after defining them
const { __mockMovies } = require('@/lib/database')

describe('/api/movies', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/movies', () => {
    it('should return a list of movies', async () => {
      __mockMovies.getByStatus.mockResolvedValue([
        { id: '1', title: 'Movie 1', status: 'candidate' },
        { id: '2', title: 'Movie 2', status: 'candidate' }
      ])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.movies).toHaveLength(2)
      expect(data.movies[0].title).toBe('Movie 1')
    })

    it('should handle empty movie list', async () => {
      __mockMovies.getByStatus.mockResolvedValue([])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.movies).toHaveLength(0)
    })
  })

  describe('POST /api/movies', () => {
    it('should add a new movie', async () => {
      __mockMovies.findByTitle.mockResolvedValue(null)
      __mockMovies.create.mockResolvedValue({
        id: 'new-movie-id',
        title: 'New Movie',
        added_by_session: 'test-session'
      })

      const request = {
        json: async () => ({
          title: 'New Movie',
          sessionId: 'test-session'
        })
      }

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.movie.title).toBe('New Movie')
    })

    it('should reject duplicate movies', async () => {
      __mockMovies.getByTmdbId.mockResolvedValue({
        id: 'existing-movie',
        title: 'Existing Movie',
        tmdb_id: 123
      })

      const request = {
        json: async () => ({
          title: 'Existing Movie',
          tmdb_id: 123,
          sessionId: 'test-session'
        })
      }

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('This movie has already been added')
    })

    it('should reject missing title', async () => {
      const request = {
        json: async () => ({
          sessionId: 'test-session'
        })
      }

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})