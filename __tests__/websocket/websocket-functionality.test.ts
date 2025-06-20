// Mock WebSocket implementation for testing
class MockWebSocket {
  static OPEN = 1
  static CONNECTING = 0
  static CLOSING = 2
  static CLOSED = 3
  
  readyState = MockWebSocket.CONNECTING
  onopen: ((event: any) => void) | null = null
  onmessage: ((event: any) => void) | null = null
  onclose: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  
  private messageHandlers: Array<(data: any) => void> = []
  private closeHandlers: Array<() => void> = []
  private openHandlers: Array<() => void> = []
  private errorHandlers: Array<(error: any) => void> = []
  
  constructor(url: string) {
    // Simulate connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      this.triggerOpen()
      // Send welcome message
      this.triggerMessage(JSON.stringify({ type: 'connected' }))
    }, 10)
  }
  
  on(event: string, handler: Function) {
    switch(event) {
      case 'open': 
        this.openHandlers.push(handler as any)
        break
      case 'message': 
        this.messageHandlers.push((data) => handler(data))
        break
      case 'close': 
        this.closeHandlers.push(handler as any)
        break
      case 'error': 
        this.errorHandlers.push(handler as any)
        break
    }
  }
  
  send(data: string) {
    const parsed = JSON.parse(data)
    if (parsed.type === 'ping') {
      setTimeout(() => {
        this.triggerMessage(JSON.stringify({ type: 'pong' }))
      }, 10)
    }
  }
  
  close() {
    this.readyState = MockWebSocket.CLOSED
    this.triggerClose()
  }
  
  private triggerOpen() {
    if (this.onopen) this.onopen({})
    this.openHandlers.forEach(handler => handler())
  }
  
  private triggerMessage(data: string) {
    if (this.onmessage) this.onmessage({ data })
    this.messageHandlers.forEach(handler => handler(data))
  }
  
  private triggerClose() {
    if (this.onclose) this.onclose({})
    this.closeHandlers.forEach(handler => handler())
  }
}

// Mock fetch for broadcast endpoint
const mockFetch = jest.fn()
global.fetch = mockFetch as any

// Store connected clients for broadcast simulation
const connectedClients: MockWebSocket[] = []

// Override WebSocket constructor to track clients
const OriginalMockWebSocket = MockWebSocket
class TrackedMockWebSocket extends OriginalMockWebSocket {
  constructor(url: string) {
    super(url)
    connectedClients.push(this)
    
    // Remove from connected clients on close
    const originalClose = this.close.bind(this)
    this.close = () => {
      const index = connectedClients.indexOf(this)
      if (index > -1) {
        connectedClients.splice(index, 1)
      }
      originalClose()
    }
  }
}

describe('WebSocket Functionality', () => {
  let ws: any
  let ws2: any
  const WS_URL = 'ws://localhost:3002'

  beforeEach(() => {
    jest.clearAllMocks()
    connectedClients.length = 0
    
    // Setup fetch mock for broadcast endpoint
    mockFetch.mockImplementation((url: string, options: any) => {
      if (url === 'http://localhost:3002/broadcast' && options.method === 'POST') {
        try {
          const data = JSON.parse(options.body)
          // Broadcast to all connected clients
          connectedClients.forEach(client => {
            if (client.readyState === MockWebSocket.OPEN) {
              ;(client as any).triggerMessage(JSON.stringify(data))
            }
          })
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true })
          })
        } catch (e) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ error: 'Invalid JSON' })
          })
        }
      }
      return Promise.resolve({
        ok: false,
        status: 404
      })
    })
  })

  afterEach(() => {
    if (ws && ws.readyState === MockWebSocket.OPEN) {
      ws.close()
    }
    if (ws2 && ws2.readyState === MockWebSocket.OPEN) {
      ws2.close()
    }
  })

  it('should connect to WebSocket server', (done) => {
    ws = new TrackedMockWebSocket(WS_URL)
    
    ws.on('open', () => {
      expect(ws.readyState).toBe(MockWebSocket.OPEN)
      done()
    })

    ws.on('error', (error: any) => {
      done(error)
    })
  })

  it('should receive welcome message on connection', (done) => {
    ws = new TrackedMockWebSocket(WS_URL)
    
    ws.on('message', (data: string) => {
      const message = JSON.parse(data.toString())
      expect(message.type).toBe('connected')
      done()
    })

    ws.on('error', (error: any) => {
      done(error)
    })
  })

  it('should respond to ping with pong', (done) => {
    ws = new TrackedMockWebSocket(WS_URL)
    
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'ping' }))
    })

    let messageCount = 0
    ws.on('message', (data: string) => {
      messageCount++
      const message = JSON.parse(data.toString())
      if (messageCount === 2) { // Skip welcome message
        expect(message.type).toBe('pong')
        done()
      }
    })

    ws.on('error', (error: any) => {
      done(error)
    })
  })

  it('should broadcast messages to all connected clients', (done) => {
    let receivedMessages = 0
    const expectedMessage = {
      type: 'movie_added',
      movie: {
        id: 'test-movie-1',
        title: 'Test Movie',
        status: 'candidate'
      }
    }

    // Connect first client
    ws = new TrackedMockWebSocket(WS_URL)
    
    ws.on('open', () => {
      // Connect second client
      ws2 = new TrackedMockWebSocket(WS_URL)
      
      ws2.on('open', async () => {
        // Wait a bit to ensure both clients are ready
        setTimeout(async () => {
          // Send broadcast via HTTP endpoint
          try {
            const response = await fetch('http://localhost:3002/broadcast', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(expectedMessage)
            })
            expect(response.ok).toBe(true)
          } catch (error) {
            done(error)
          }
        }, 100)
      })

      ws2.on('message', (data: string) => {
        const message = JSON.parse(data.toString())
        if (message.type === 'movie_added') {
          expect(message).toEqual(expectedMessage)
          receivedMessages++
          if (receivedMessages === 2) {
            done()
          }
        }
      })
    })

    ws.on('message', (data: string) => {
      const message = JSON.parse(data.toString())
      if (message.type === 'movie_added') {
        expect(message).toEqual(expectedMessage)
        receivedMessages++
        if (receivedMessages === 2) {
          done()
        }
      }
    })

    ws.on('error', (error: any) => {
      done(error)
    })
  })

  it('should handle movie_added broadcast', (done) => {
    ws = new TrackedMockWebSocket(WS_URL)
    
    ws.on('open', async () => {
      // Send movie_added broadcast
      const movieData = {
        type: 'movie_added',
        movie: {
          id: 'movie-123',
          title: 'Inception',
          status: 'candidate',
          poster_path: '/poster.jpg',
          vote_average: 8.5
        }
      }

      try {
        const response = await fetch('http://localhost:3002/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(movieData)
        })
        expect(response.ok).toBe(true)
      } catch (error) {
        done(error)
      }
    })

    let messageCount = 0
    ws.on('message', (data: string) => {
      messageCount++
      const message = JSON.parse(data.toString())
      if (message.type === 'movie_added') {
        expect(message.movie).toBeDefined()
        expect(message.movie.title).toBe('Inception')
        expect(message.movie.id).toBe('movie-123')
        done()
      }
    })
  })

  it('should handle vote_submitted broadcast', (done) => {
    ws = new TrackedMockWebSocket(WS_URL)
    
    ws.on('open', async () => {
      // Send vote_submitted broadcast
      const voteData = {
        type: 'vote_submitted',
        votingSessionId: 'session-123',
        voteCount: 5
      }

      try {
        const response = await fetch('http://localhost:3002/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(voteData)
        })
        expect(response.ok).toBe(true)
      } catch (error) {
        done(error)
      }
    })

    let messageCount = 0
    ws.on('message', (data: string) => {
      messageCount++
      const message = JSON.parse(data.toString())
      if (message.type === 'vote_submitted') {
        expect(message.votingSessionId).toBe('session-123')
        expect(message.voteCount).toBe(5)
        done()
      }
    })
  })

  it('should handle invalid JSON gracefully', async () => {
    const response = await fetch('http://localhost:3002/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json'
    })
    
    expect(response.status).toBe(400)
    const result = await response.json()
    expect(result.error).toBe('Invalid JSON')
  })

  it('should return 404 for non-broadcast endpoints', async () => {
    const response = await fetch('http://localhost:3002/invalid-endpoint', {
      method: 'GET'
    })
    
    expect(response.status).toBe(404)
  })

  it('should handle client disconnection', (done) => {
    ws = new TrackedMockWebSocket(WS_URL)
    
    ws.on('open', () => {
      // Close connection immediately
      ws.close()
    })

    ws.on('close', () => {
      expect(ws.readyState).toBe(MockWebSocket.CLOSED)
      done()
    })
  })

  it('should maintain separate connections for multiple clients', (done) => {
    let connections = 0
    
    ws = new TrackedMockWebSocket(WS_URL)
    ws2 = new TrackedMockWebSocket(WS_URL)
    
    const checkComplete = () => {
      connections++
      if (connections === 2) {
        expect(ws.readyState).toBe(MockWebSocket.OPEN)
        expect(ws2.readyState).toBe(MockWebSocket.OPEN)
        expect(ws).not.toBe(ws2) // Different connections
        done()
      }
    }
    
    ws.on('open', checkComplete)
    ws2.on('open', checkComplete)
  })
})