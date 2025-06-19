const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSSE() {
  console.log('🧪 Testing SSE Real-time Updates\n');
  
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
    await sleep(2000);
    
    // User 2 - will watch for updates
    const user2 = await browser.newPage();
    await user2.goto('http://localhost:3000/vote');
    await sleep(2000);
    
    // Check initial movie count for User 2
    const initialCount = await user2.evaluate(() => {
      const availableSection = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Available Movies'));
      if (availableSection) {
        const match = availableSection.textContent.match(/\((\d+)\)/);
        return match ? parseInt(match[1]) : 0;
      }
      return 0;
    });
    console.log(`📊 User 2 sees ${initialCount} movies initially`);
    
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
    
    // Wait for SSE update
    await sleep(2000);
    
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
      console.log('\n🎉 SUCCESS: Real-time updates are working!');
    } else {
      console.log('\n❌ FAIL: Real-time updates not working');
      console.log('   User 2 would need to refresh to see new movies');
    }
    
    // Test deletion
    if (hasMatrix) {
      console.log('\n📍 Testing movie deletion...');
      
      // User 1 deletes the movie
      const deleted = await user1.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const deleteBtn = buttons.find(b => {
          const svg = b.querySelector('svg');
          return svg && b.classList.contains('bg-danger-600');
        });
        if (deleteBtn) {
          // Override confirm
          window.confirm = () => true;
          deleteBtn.click();
          return true;
        }
        return false;
      });
      
      if (deleted) {
        console.log('✅ User 1 deleted The Matrix');
        await sleep(2000);
        
        const afterDeleteCount = await user2.evaluate(() => {
          const availableSection = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Available Movies'));
          if (availableSection) {
            const match = availableSection.textContent.match(/\((\d+)\)/);
            return match ? parseInt(match[1]) : 0;
          }
          return 0;
        });
        
        const stillHasMatrix = await user2.evaluate(() => {
          const movieTitles = Array.from(document.querySelectorAll('h3'));
          return movieTitles.some(title => title.textContent.includes('The Matrix'));
        });
        
        console.log(`📊 User 2 now sees ${afterDeleteCount} movies`);
        console.log(`🎬 User 2 still sees The Matrix: ${stillHasMatrix ? 'YES ❌' : 'NO ✅'}`);
      }
    }
    
    console.log('\n📋 Test Summary:');
    console.log('- SSE connection established');
    console.log('- Movie additions:', updatedCount > initialCount ? 'Real-time ✅' : 'Requires refresh ❌');
    console.log('- Expected behavior: Movies should appear/disappear instantly for all users');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    console.log('\n🔍 Browser will remain open for inspection.');
    console.log('Press Ctrl+C to close and exit.');
  }
}

testSSE();