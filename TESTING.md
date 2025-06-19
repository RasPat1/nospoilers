# Testing Guide for NoSpoilers

This project includes comprehensive tests for all core functionality.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

### Unit Tests

#### API Route Tests
- `/api/movies` - Tests for adding movies with and without TMDB data
- `/api/votes` - Tests for vote submission, duplicate prevention, and session creation
- `/api/votes/results` - Tests for point calculation and ranking logic

#### Component Tests
- `VotingInterface` - Tests drag-and-drop ranking, movie display, and submission
- `Results` - Tests live updates, winner display, and auto-refresh

### Integration Tests
- `voting-flow.test.tsx` - Complete end-to-end voting flow
- Tests manual movie entry when TMDB is unavailable
- Tests duplicate vote prevention

## Key Test Scenarios

### Adding Movies
✅ Add movie with full TMDB data (poster, cast, director, etc.)
✅ Add movie manually without internet/TMDB connection
✅ Reject empty movie titles
✅ Handle special characters in movie titles

### Voting System
✅ Drag and drop movies to create rankings
✅ Reorder movies in ranking
✅ Remove movies from ranking
✅ Submit vote with proper session tracking
✅ Prevent duplicate votes from same session
✅ Create voting session automatically if needed

### Results Display
✅ Calculate points correctly (1st place = most points)
✅ Show live updates as votes come in
✅ Display winner when voting closes
✅ Handle tie scenarios
✅ Auto-refresh every 5 seconds

### Edge Cases
✅ No movies added yet
✅ No votes submitted
✅ Different length rankings (some users rank fewer movies)
✅ Movies without posters or metadata

## Mocking Strategy

- **Supabase**: All database calls are mocked to avoid external dependencies
- **Fetch**: API calls are mocked with realistic responses
- **Router**: Next.js navigation is mocked to test redirects
- **LocalStorage**: Session storage is mocked for testing

## Coverage Goals

The test suite aims for:
- 100% coverage of critical paths (voting, results calculation)
- 90%+ coverage of API routes
- 80%+ coverage of UI components

## Debugging Tests

If tests fail:
1. Check console output for specific error messages
2. Use `screen.debug()` to see current DOM state
3. Verify mock implementations match actual API responses
4. Ensure all async operations use `waitFor()` or `findBy` queries

## Adding New Tests

When adding features:
1. Write tests first (TDD approach)
2. Test both happy path and error cases
3. Include tests for accessibility
4. Mock external dependencies
5. Keep tests focused and isolated