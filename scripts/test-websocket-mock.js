const WebSocket = require('ws');
const http = require('http');

async function testWebSocketSync() {
  console.log('=== WebSocket Synchronization Test (Mock) ===\n');
  
  const wsUrl = 'ws://localhost:8081';
  const broadcastUrl = 'http://localhost:8081/broadcast';
  
  // Test 1: Check if WebSocket server is running
  console.log('1. Testing WebSocket server connection...');
  
  try {
    // Create two WebSocket clients to simulate two browser sessions
    const ws1 = new WebSocket(wsUrl);
    const ws2 = new WebSocket(wsUrl);
    
    // Arrays to store received messages
    const messagesSession1 = [];
    const messagesSession2 = [];
    
    // Set up message handlers
    ws1.on('message', (data) => {
      const message = JSON.parse(data.toString());
      messagesSession1.push(message);
      console.log('Session 1 received:', message);
    });
    
    ws2.on('message', (data) => {
      const message = JSON.parse(data.toString());
      messagesSession2.push(message);
      console.log('Session 2 received:', message);
    });
    
    // Wait for connections
    await new Promise((resolve) => {
      let connectedCount = 0;
      ws1.on('open', () => {
        console.log('✓ Session 1 connected to WebSocket server');
        connectedCount++;
        if (connectedCount === 2) resolve();
      });
      ws2.on('open', () => {
        console.log('✓ Session 2 connected to WebSocket server');
        connectedCount++;
        if (connectedCount === 2) resolve();
      });
    });
    
    // Give time for welcome messages
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('\n2. Testing broadcast functionality...');
    
    // Simulate adding a movie by sending a broadcast message
    const movieData = {
      type: 'movie_added',
      movie: {
        id: 'tt1375666',
        title: 'Inception',
        year: 2010,
        director: 'Christopher Nolan',
        timestamp: new Date().toISOString()
      }
    };
    
    // Send broadcast message via HTTP endpoint
    const postData = JSON.stringify(movieData);
    
    const options = {
      hostname: 'localhost',
      port: 8081,
      path: '/broadcast',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const broadcastPromise = new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('✓ Broadcast sent successfully');
            resolve();
          } else {
            reject(new Error(`Broadcast failed with status ${res.statusCode}`));
          }
        });
      });
      
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
    
    await broadcastPromise;
    
    // Wait for messages to be received
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('\n3. Analyzing results...');
    
    // Check if both sessions received the broadcast
    const session1ReceivedMovie = messagesSession1.some(msg => 
      msg.type === 'movie_added' && msg.movie?.title === 'Inception'
    );
    const session2ReceivedMovie = messagesSession2.some(msg => 
      msg.type === 'movie_added' && msg.movie?.title === 'Inception'
    );
    
    console.log(`\n=== TEST RESULTS ===`);
    console.log(`WebSocket server running: YES`);
    console.log(`Session 1 connected: YES`);
    console.log(`Session 2 connected: YES`);
    console.log(`Broadcast sent: YES`);
    console.log(`Session 1 received movie update: ${session1ReceivedMovie ? 'YES' : 'NO'}`);
    console.log(`Session 2 received movie update: ${session2ReceivedMovie ? 'YES' : 'NO'}`);
    console.log(`\nWebSocket synchronization: ${session1ReceivedMovie && session2ReceivedMovie ? 'WORKING ✓' : 'NOT WORKING ✗'}`);
    
    // Clean up
    ws1.close();
    ws2.close();
    
    return session1ReceivedMovie && session2ReceivedMovie;
    
  } catch (error) {
    console.error('\nERROR:', error.message);
    console.log('\nMake sure the WebSocket server is running:');
    console.log('  npm run dev:ws');
    console.log('Or for all services:');
    console.log('  npm run dev:all');
    return false;
  }
}

// Run the test
testWebSocketSync()
  .then(success => {
    console.log(`\nTest completed. Overall result: ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });