const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testWebSocket() {
  console.log('🧪 Testing WebSocket Real-time Updates\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      slowMo: 50,
      args: ['--window-size=1200,800']
    });

    // User 1 - will add movies
    const user1 = await browser.newPage();
    await user1.goto('http://localhost:3000/vote');
    await sleep(3000); // Give WebSocket time to connect
    
    // User 2 - will watch for updates
    const user2 = await browser.newPage();
    await user2.goto('http://localhost:3000/vote');
    await sleep(3000); // Give WebSocket time to connect
    
    // Check console for WebSocket connection
    user1.on('console', msg => {
      if (msg.text().includes('WebSocket')) {
        console.log(`[User1] ${msg.text()}`);
      }
    });
    
    user2.on('console', msg => {
      if (msg.text().includes('WebSocket') || msg.text().includes('Movie')) {
        console.log(`[User2] ${msg.text()}`);
      }
    });
    
    // Check initial movie count for User 2
    const initialCount = await user2.evaluate(() => {
      const availableSection = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Available Movies'));
      if (availableSection) {
        const match = availableSection.textContent.match(/\((\d+)\)/);
        return match ? parseInt(match[1]) : 0;
      }
      return 0;
    });
    console.log(`\n📊 User 2 sees ${initialCount} movies initially`);
    
    // User 1 adds a movie
    console.log('\n📍 User 1 adding The Matrix...');
    await user1.type('input[placeholder="Search for a movie..."]', 'The Matrix');
    await sleep(3000);
    
    await user1.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img'));
      if (movieBtn) movieBtn.click();
    });
    await sleep(1000);
    
    await user1.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
      if (addBtn) addBtn.click();
    });
    console.log('✅ User 1 added The Matrix');
    
    // Wait for WebSocket update
    await sleep(3000);
    
    // Check if User 2 sees the update without refresh
    const updatedCount = await user2.evaluate(() => {
      const availableSection = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Available Movies'));
      if (availableSection) {
        const match = availableSection.textContent.match(/\((\d+)\)/);
        return match ? parseInt(match[1]) : 0;
      }
      return 0;
    });
    
    const hasMatrix = await user2.evaluate(() => {
      const movieTitles = Array.from(document.querySelectorAll('h3'));
      return movieTitles.some(title => title.textContent.includes('The Matrix'));
    });
    
    console.log(`\n📊 User 2 now sees ${updatedCount} movies`);
    console.log(`🎬 User 2 sees The Matrix: ${hasMatrix ? 'YES ✅' : 'NO ❌'}`);
    
    if (updatedCount > initialCount && hasMatrix) {
      console.log('\n🎉 SUCCESS: WebSocket real-time updates are working!');
    } else {
      console.log('\n❌ FAIL: WebSocket real-time updates not working');
      console.log('   Checking browser console for errors...');
    }
    
    console.log('\n📋 Test Summary:');
    console.log('- WebSocket server running on port 3001');
    console.log('- Movie additions should appear instantly for all users');
    console.log('- Check browser console for WebSocket connection status');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    console.log('\n🔍 Browser will remain open for inspection.');
    console.log('Press Ctrl+C to close and exit.');
  }
}

testWebSocket();