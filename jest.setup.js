import '@testing-library/jest-dom'
// Skip WebSocket server in test environment to avoid issues
// Tests can mock WebSocket connections as needed

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  usePathname() {
    return ''
  },
}))

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: () => ({
    set: jest.fn(),
    delete: jest.fn(),
  })
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock fetch
global.fetch = jest.fn()

// Mock Request/Response for Next.js API routes
global.Request = jest.fn()
global.Response = jest.fn()