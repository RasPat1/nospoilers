const puppeteer = require('puppeteer');

async function testDemo() {
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Go to homepage
    console.log('1. Going to homepage...');
    await page.goto('http://localhost:3000');
    await page.waitForSelector('h1', { timeout: 10000 });
    console.log('   ✓ Homepage loaded');
    
    // Take screenshot
    await page.screenshot({ path: 'demo-output/test-homepage.png' });
    
    // Find and click start button
    console.log('2. Looking for start button...');
    const startButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent.includes('Start Voting'));
    });
    
    if (startButton) {
      await startButton.click();
      console.log('   ✓ Clicked start button');
    } else {
      console.log('   ✗ Could not find start button');
    }
    
    // Wait for vote page
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('3. On vote page, URL:', page.url());
    
    // Wait for page to be interactive
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    console.log('   ✓ Vote page loaded with search input');
    
    // Take screenshot
    await page.screenshot({ path: 'demo-output/test-vote.png' });
    
    // Type in search box
    console.log('4. Typing in search box...');
    await page.type('input[type="text"]', 'The Matrix');
    await page.waitForTimeout(2000); // Wait for search results
    
    // Take screenshot of search results
    await page.screenshot({ path: 'demo-output/test-search.png' });
    
    // Check what elements exist
    console.log('5. Checking page structure...');
    const pageInfo = await page.evaluate(() => {
      return {
        inputs: document.querySelectorAll('input').length,
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent),
        divs: document.querySelectorAll('div').length,
        searchResults: document.querySelectorAll('.search-results').length,
        movieCards: document.querySelectorAll('.movie-card').length
      };
    });
    console.log('   Page info:', pageInfo);
    
  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'demo-output/test-error.png' });
  }
  
  // Keep browser open for inspection
  console.log('\\nPress Ctrl+C to close browser...');
}

testDemo();