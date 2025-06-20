const puppeteer = require('puppeteer');
const path = require('path');

async function testWebSocketSync() {
  console.log('Starting WebSocket synchronization test...');
  
  // Check if server is accessible first
  const testUrl = 'http://localhost:8080';
  console.log(`Testing connection to ${testUrl}...`);
  
  // Launch two browser instances in headless mode
  const browser1 = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const browser2 = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Create pages in each browser
    const page1 = await browser1.newPage();
    const page2 = await browser2.newPage();

    // Set viewport for consistent screenshots
    await page1.setViewport({ width: 1280, height: 800 });
    await page2.setViewport({ width: 1280, height: 800 });

    // Navigate to the app
    console.log('Navigating to http://localhost:8080...');
    try {
      await page1.goto('http://localhost:8080', { waitUntil: 'networkidle2', timeout: 10000 });
      await page2.goto('http://localhost:8080', { waitUntil: 'networkidle2', timeout: 10000 });
    } catch (error) {
      console.error('\nERROR: Could not connect to http://localhost:8080');
      console.error('Make sure the app is running with: npm run dev:all');
      console.error('Or run separately:');
      console.error('  npm run dev (in one terminal)');
      console.error('  npm run dev:ws (in another terminal)');
      throw error;
    }

    // Wait for the app to load
    await page1.waitForTimeout(2000);
    await page2.waitForTimeout(2000);

    // Take before screenshots
    console.log('Taking before screenshots...');
    await page1.screenshot({ path: '/tmp/session1_before.png', fullPage: true });
    await page2.screenshot({ path: '/tmp/session2_before.png', fullPage: true });

    // Get initial movie count in both sessions
    const initialMoviesSession1 = await page1.$$eval('.movie-card, [data-testid="movie-item"], .rounded-lg.bg-white', elements => elements.length);
    const initialMoviesSession2 = await page2.$$eval('.movie-card, [data-testid="movie-item"], .rounded-lg.bg-white', elements => elements.length);
    console.log(`Initial movie count - Session 1: ${initialMoviesSession1}, Session 2: ${initialMoviesSession2}`);

    // In session 1, add a movie
    console.log('Adding movie "Inception" in session 1...');
    
    // Look for the search input
    const searchInputSelector = 'input[type="text"], input[placeholder*="movie"], input[placeholder*="search"], input[placeholder*="add"]';
    await page1.waitForSelector(searchInputSelector);
    await page1.click(searchInputSelector);
    await page1.type(searchInputSelector, 'Inception');

    // Look for and click the add/search button
    const addButtonSelector = 'button:has-text("Add"), button:has-text("Search"), button[type="submit"]';
    try {
      await page1.waitForSelector(addButtonSelector, { timeout: 5000 });
      await page1.click(addButtonSelector);
    } catch (e) {
      // Try pressing Enter if no button found
      console.log('No add button found, trying Enter key...');
      await page1.keyboard.press('Enter');
    }

    // Wait for the movie to be added (give WebSocket time to sync)
    console.log('Waiting for WebSocket synchronization...');
    await page1.waitForTimeout(3000);

    // Check if a new movie was added in session 1
    const updatedMoviesSession1 = await page1.$$eval('.movie-card, [data-testid="movie-item"], .rounded-lg.bg-white', elements => elements.length);
    console.log(`Updated movie count in session 1: ${updatedMoviesSession1}`);

    // Check if the movie appeared in session 2 (WebSocket sync)
    const updatedMoviesSession2 = await page2.$$eval('.movie-card, [data-testid="movie-item"], .rounded-lg.bg-white', elements => elements.length);
    console.log(`Updated movie count in session 2: ${updatedMoviesSession2}`);

    // Take after screenshots
    console.log('Taking after screenshots...');
    await page1.screenshot({ path: '/tmp/session1_after.png', fullPage: true });
    await page2.screenshot({ path: '/tmp/session2_after.png', fullPage: true });

    // Analyze results
    const movieAddedInSession1 = updatedMoviesSession1 > initialMoviesSession1;
    const movieSyncedToSession2 = updatedMoviesSession2 > initialMoviesSession2;
    const syncSuccessful = movieAddedInSession1 && movieSyncedToSession2;

    console.log('\n=== TEST RESULTS ===');
    console.log(`Movie added in session 1: ${movieAddedInSession1 ? 'YES' : 'NO'}`);
    console.log(`Movie synced to session 2: ${movieSyncedToSession2 ? 'YES' : 'NO'}`);
    console.log(`WebSocket synchronization: ${syncSuccessful ? 'WORKING' : 'NOT WORKING'}`);

    // Get movie titles from both sessions for verification
    try {
      const moviesInSession1 = await page1.$$eval('.movie-card h3, [data-testid="movie-title"], .text-lg.font-semibold', 
        elements => elements.map(el => el.textContent.trim())
      );
      const moviesInSession2 = await page2.$$eval('.movie-card h3, [data-testid="movie-title"], .text-lg.font-semibold', 
        elements => elements.map(el => el.textContent.trim())
      );
      
      console.log('\nMovies in session 1:', moviesInSession1);
      console.log('Movies in session 2:', moviesInSession2);
    } catch (e) {
      console.log('Could not extract movie titles');
    }

    console.log('\nScreenshots saved to:');
    console.log('- /tmp/session1_before.png');
    console.log('- /tmp/session1_after.png');
    console.log('- /tmp/session2_before.png');
    console.log('- /tmp/session2_after.png');

    return syncSuccessful;

  } catch (error) {
    console.error('Test failed with error:', error);
    throw error;
  } finally {
    // Close browsers
    await browser1.close();
    await browser2.close();
  }
}

// Run the test
testWebSocketSync()
  .then(success => {
    console.log(`\nTest completed. WebSocket sync: ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });