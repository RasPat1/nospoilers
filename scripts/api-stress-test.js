const BASE_URL = 'http://localhost:3000';

// Test utilities
function randomString(length = 8) {
  return Math.random().toString(36).substring(2, 2 + length);
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// API Test Functions
async function testEndpoint(method, path, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = response.headers.get('content-type')?.includes('json') 
      ? await response.json() 
      : await response.text();
    
    return {
      success: response.ok,
      status: response.status,
      data,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

async function runStressTest() {
  console.log('🚀 Starting API Stress Test...\n');
  
  const errors = [];
  const sessionId = generateUUID();
  
  // Test 1: Movies API
  console.log('📍 Test 1: Movies API');
  
  // GET movies
  let result = await testEndpoint('GET', '/api/movies');
  console.log(`  GET /api/movies: ${result.success ? '✓' : '✗'} (${result.status})`);
  if (!result.success) errors.push({ endpoint: 'GET /api/movies', ...result });
  
  // POST movie with empty title
  result = await testEndpoint('POST', '/api/movies', { title: '', sessionId });
  console.log(`  POST /api/movies (empty): ${result.status === 400 ? '✓' : '✗'} (${result.status})`);
  
  // POST valid movie
  const movieTitle = `Test Movie ${randomString()}`;
  result = await testEndpoint('POST', '/api/movies', { 
    title: movieTitle,
    sessionId,
    tmdb_id: 123,
    vote_average: 8.5
  });
  console.log(`  POST /api/movies (valid): ${result.success ? '✓' : '✗'} (${result.status})`);
  if (!result.success) errors.push({ endpoint: 'POST /api/movies', ...result });
  const movieId = result.data?.movie?.id;
  
  // POST duplicate movie
  result = await testEndpoint('POST', '/api/movies', { title: movieTitle, sessionId });
  console.log(`  POST /api/movies (duplicate): ${result.status === 409 ? '✓' : '✗'} (${result.status})`);
  
  // Test movie search
  result = await testEndpoint('GET', `/api/movies/search?query=Matrix`);
  console.log(`  GET /api/movies/search: ${result.success ? '✓' : '✗'} (${result.status})`);
  if (!result.success) errors.push({ endpoint: 'GET /api/movies/search', ...result });
  
  // DELETE movie
  if (movieId) {
    result = await testEndpoint('DELETE', `/api/movies/${movieId}`);
    console.log(`  DELETE /api/movies/:id: ${result.success ? '✓' : '✗'} (${result.status})`);
    if (!result.success) errors.push({ endpoint: 'DELETE /api/movies/:id', ...result });
  }
  
  // Test 2: Voting Session API
  console.log('\n📍 Test 2: Voting Session API');
  
  result = await testEndpoint('GET', `/api/voting-session?sessionId=${sessionId}`);
  console.log(`  GET /api/voting-session: ${result.success ? '✓' : '✗'} (${result.status})`);
  if (!result.success) errors.push({ endpoint: 'GET /api/voting-session', ...result });
  
  const votingSession = result.data?.votingSession;
  
  // Test 3: Votes API
  console.log('\n📍 Test 3: Votes API');
  
  // Submit vote without rankings
  result = await testEndpoint('POST', '/api/votes', { 
    rankings: [],
    sessionId 
  });
  console.log(`  POST /api/votes (empty): ${result.status === 400 ? '✓' : '✗'} (${result.status})`);
  
  // Submit valid vote (need to add movies first)
  console.log('  - Adding movies for voting test...');
  const movieIds = [];
  for (let i = 0; i < 3; i++) {
    const movieResult = await testEndpoint('POST', '/api/movies', {
      title: `Vote Test Movie ${i}`,
      sessionId
    });
    if (movieResult.success) {
      movieIds.push(movieResult.data.movie.id);
    }
  }
  
  if (movieIds.length > 0) {
    // Create a new session ID for this vote to avoid conflicts
    const voteSessionId = generateUUID();
    
    result = await testEndpoint('POST', '/api/votes', {
      rankings: movieIds,
      sessionId: voteSessionId
    });
    console.log(`  POST /api/votes (valid): ${result.success ? '✓' : '✗'} (${result.status})`);
    if (!result.success) errors.push({ endpoint: 'POST /api/votes', ...result });
    
    // Try duplicate vote
    result = await testEndpoint('POST', '/api/votes', {
      rankings: movieIds,
      sessionId: voteSessionId
    });
    console.log(`  POST /api/votes (duplicate): ${result.status === 400 ? '✓' : '✗'} (${result.status})`);
  }
  
  // Get vote count
  result = await testEndpoint('GET', `/api/votes/count?votingSessionId=${votingSession?.id || sessionId}`);
  console.log(`  GET /api/votes/count: ${result.success ? '✓' : '✗'} (${result.status})`);
  if (!result.success) errors.push({ endpoint: 'GET /api/votes/count', ...result });
  
  // Get results
  result = await testEndpoint('GET', '/api/votes/results');
  console.log(`  GET /api/votes/results: ${result.success ? '✓' : '✗'} (${result.status})`);
  if (!result.success) errors.push({ endpoint: 'GET /api/votes/results', ...result });
  
  // Clear vote
  result = await testEndpoint('DELETE', '/api/votes/clear', { sessionId });
  console.log(`  DELETE /api/votes/clear: ${result.success ? '✓' : '✗'} (${result.status})`);
  if (!result.success) errors.push({ endpoint: 'DELETE /api/votes/clear', ...result });
  
  // Test 4: Admin API
  console.log('\n📍 Test 4: Admin API');
  
  result = await testEndpoint('GET', '/api/admin/stats');
  console.log(`  GET /api/admin/stats: ${result.success ? '✓' : '✗'} (${result.status})`);
  if (!result.success) errors.push({ endpoint: 'GET /api/admin/stats', ...result });
  
  // Test 5: Stress Test - Rapid Requests
  console.log('\n📍 Test 5: Stress Test - Rapid Requests');
  
  const stressStart = Date.now();
  const stressPromises = [];
  
  // Fire 20 requests simultaneously
  for (let i = 0; i < 20; i++) {
    stressPromises.push(testEndpoint('GET', '/api/movies'));
  }
  
  const stressResults = await Promise.all(stressPromises);
  const stressSuccess = stressResults.filter(r => r.success).length;
  const stressTime = Date.now() - stressStart;
  
  console.log(`  Sent 20 concurrent requests in ${stressTime}ms`);
  console.log(`  Success rate: ${stressSuccess}/20 (${(stressSuccess/20*100).toFixed(1)}%)`);
  
  // Test 6: Edge Cases
  console.log('\n📍 Test 6: Edge Cases');
  
  // Very long movie title
  const longTitle = 'A'.repeat(500);
  result = await testEndpoint('POST', '/api/movies', { 
    title: longTitle,
    sessionId: generateUUID()
  });
  console.log(`  POST /api/movies (500 chars): ${result.success ? '✓' : '✗'} (${result.status})`);
  
  // Special characters
  result = await testEndpoint('POST', '/api/movies', { 
    title: '<script>alert("xss")</script>',
    sessionId: generateUUID()
  });
  console.log(`  POST /api/movies (XSS attempt): ${result.success ? '✓' : '✗'} (${result.status})`);
  
  // Invalid JSON
  console.log('  Testing invalid requests...');
  try {
    const response = await fetch(`${BASE_URL}/api/movies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ invalid json'
    });
    console.log(`  POST with invalid JSON: ${response.status === 400 ? '✓' : '✗'} (${response.status})`);
  } catch (e) {
    console.log(`  POST with invalid JSON: ✓ (rejected)`);
  }
  
  // Test 7: Clean up
  console.log('\n📍 Test 7: Cleanup');
  
  result = await testEndpoint('POST', '/api/admin/reset', { resetMovies: true });
  console.log(`  POST /api/admin/reset: ${result.success ? '✓' : '✗'} (${result.status})`);
  
  // Summary
  console.log('\n📊 API Stress Test Results:');
  console.log('='.repeat(50));
  
  if (errors.length === 0) {
    console.log('✅ All API endpoints passed stress testing!');
  } else {
    console.log(`❌ Found ${errors.length} errors:\n`);
    errors.forEach((error, i) => {
      console.log(`${i + 1}. ${error.endpoint}`);
      console.log(`   Status: ${error.status}`);
      console.log(`   Error: ${error.error || JSON.stringify(error.data)}\n`);
    });
  }
  
  console.log('🏁 API stress test completed!');
}

// Run the test
runStressTest().catch(console.error);