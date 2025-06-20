const BASE_URL = 'http://localhost:3000';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function debugVotes() {
  console.log('🔍 Debugging vote submission issue...\n');
  
  const sessionId = generateUUID();
  console.log(`Session ID: ${sessionId}`);
  
  try {
    // Step 1: Get current voting session
    let response = await fetch(`${BASE_URL}/api/voting-session?sessionId=${sessionId}`);
    const sessionData = await response.json();
    console.log('\n1. Voting Session:', sessionData);
    
    // Step 2: Add some movies
    console.log('\n2. Adding movies...');
    const movieIds = [];
    for (let i = 0; i < 3; i++) {
      response = await fetch(`${BASE_URL}/api/movies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Debug Movie ${i}`,
          sessionId: sessionId,
          tmdb_id: 100 + i,
          vote_average: 7.5
        })
      });
      const movieData = await response.json();
      console.log(`   Added movie ${i}:`, movieData);
      if (movieData.movie) {
        movieIds.push(movieData.movie.id);
      }
    }
    
    // Step 3: Try to create user session explicitly
    console.log('\n3. Testing user session creation...');
    response = await fetch(`${BASE_URL}/api/debug/user-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    if (response.ok) {
      const userData = await response.json();
      console.log('   User session:', userData);
    } else {
      console.log('   No debug endpoint available');
    }
    
    // Step 4: Submit vote
    console.log('\n4. Submitting vote...');
    response = await fetch(`${BASE_URL}/api/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rankings: movieIds,
        sessionId: sessionId
      })
    });
    
    const voteResult = await response.json();
    console.log('   Vote result:', {
      status: response.status,
      data: voteResult
    });
    
    // Step 5: Check if user session was created
    console.log('\n5. Checking database state...');
    response = await fetch(`${BASE_URL}/api/admin/stats`);
    const stats = await response.json();
    console.log('   Stats:', stats);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

debugVotes().catch(console.error);