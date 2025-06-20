const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '@supabase/supabase-js': '<rootDir>/__mocks__/@supabase/supabase-js.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@supabase|@supabase/supabase-js|@supabase/realtime-js|@supabase/functions-js|@supabase/storage-js|@supabase/postgrest-js|@supabase/auth-js|@supabase/gotrue-js|@supabase/node-fetch|whatwg-url|tr46|webidl-conversions|fetch-blob|formdata-polyfill|node-fetch|data-uri-to-buffer|web-streams-polyfill)/)',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)