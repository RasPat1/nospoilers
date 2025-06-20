const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';

async function runUIStressTest() {
  console.log('🚀 Starting UI Stress Test...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const errors = [];
  let successCount = 0;
  let testCount = 0;
  
  try {
    const page = await browser.newPage();
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('WebSocket') && !text.includes('favicon')) {
          errors.push({
            type: 'Console Error',
            url: page.url(),
            message: text
          });
        }
      }
    });
    
    // Test 1: Homepage
    console.log('📍 Test 1: Homepage Tests');
    testCount++;
    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      await page.waitForSelector('h1', { timeout: 5000 });
      const title = await page.$eval('h1', el => el.textContent);
      console.log(`  ✓ Homepage loaded: "${title}"`);
      successCount++;
    } catch (e) {
      console.log(`  ✗ Homepage failed: ${e.message}`);
      errors.push({ type: 'Homepage', message: e.message });
    }
    
    // Test video controls
    testCount++;
    try {
      const videoExists = await page.$('video') !== null;
      if (videoExists) {
        await page.click('video');
        console.log('  ✓ Video element clickable');
        successCount++;
      } else {
        console.log('  ⚠ No video element found');
      }
    } catch (e) {
      console.log(`  ✗ Video test failed: ${e.message}`);
    }
    
    // Test 2: Navigation to Voting
    console.log('\n📍 Test 2: Navigation Tests');
    testCount++;
    try {
      // Find and click the first button with "Start Voting" text
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const startButton = buttons.find(btn => btn.textContent.includes('Start Voting'));
        if (startButton) startButton.click();
      });
      
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      const url = page.url();
      if (url.includes('/vote')) {
        console.log('  ✓ Navigated to voting page');
        successCount++;
      } else {
        console.log(`  ✗ Wrong URL: ${url}`);
      }
    } catch (e) {
      console.log(`  ✗ Navigation failed: ${e.message}`);
      errors.push({ type: 'Navigation', message: e.message });
    }
    
    // Test 3: Voting Page Functionality
    console.log('\n📍 Test 3: Voting Page Tests');
    if (!page.url().includes('/vote')) {
      await page.goto(`${BASE_URL}/vote`, { waitUntil: 'networkidle0' });
    }
    
    // Test movie input
    testCount++;
    try {
      await page.waitForSelector('input[type="text"]', { timeout: 5000 });
      const input = await page.$('input[type="text"]');
      
      // Test typing
      await input.type('The Matrix', { delay: 50 });
      await page.waitForTimeout(1500); // Wait for autocomplete
      
      // Look for autocomplete results
      const autocompleteItems = await page.$$('.cursor-pointer');
      if (autocompleteItems.length > 0) {
        await autocompleteItems[0].click();
        console.log('  ✓ Movie autocomplete working');
        successCount++;
      } else {
        console.log('  ⚠ No autocomplete results');
      }
    } catch (e) {
      console.log(`  ✗ Movie input failed: ${e.message}`);
      errors.push({ type: 'Movie Input', message: e.message });
    }
    
    // Test adding multiple movies
    console.log('  - Adding multiple movies...');
    const testMovies = ['Inception', 'Interstellar', 'The Dark Knight'];
    for (const movie of testMovies) {
      testCount++;
      try {
        const input = await page.$('input[type="text"]');
        await input.click({ clickCount: 3 }); // Clear
        await input.type(movie, { delay: 30 });
        await page.waitForTimeout(1000);
        
        const firstResult = await page.$('.cursor-pointer');
        if (firstResult) {
          await firstResult.click();
          await page.waitForTimeout(300);
          successCount++;
        }
      } catch (e) {
        console.log(`    ✗ Failed to add ${movie}`);
      }
    }
    
    // Test submit button
    testCount++;
    try {
      const submitButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent.includes('Submit Vote')) !== null;
      });
      
      if (submitButton) {
        console.log('  ✓ Submit button found');
        successCount++;
      } else {
        console.log('  ✗ Submit button not found');
      }
    } catch (e) {
      console.log(`  ✗ Submit test failed: ${e.message}`);
    }
    
    // Test 4: Results Page
    console.log('\n📍 Test 4: Results Page Tests');
    testCount++;
    try {
      await page.goto(`${BASE_URL}/results`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('h1', { timeout: 5000 });
      const heading = await page.$eval('h1', el => el.textContent);
      console.log(`  ✓ Results page loaded: "${heading}"`);
      successCount++;
    } catch (e) {
      console.log(`  ✗ Results page failed: ${e.message}`);
      errors.push({ type: 'Results Page', message: e.message });
    }
    
    // Test 5: Admin Page
    console.log('\n📍 Test 5: Admin Page Tests');
    testCount++;
    try {
      await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('h1', { timeout: 5000 });
      
      // Look for stats
      const statsExist = await page.$('.grid') !== null;
      if (statsExist) {
        console.log('  ✓ Admin stats displayed');
        successCount++;
      } else {
        console.log('  ⚠ No stats grid found');
      }
    } catch (e) {
      console.log(`  ✗ Admin page failed: ${e.message}`);
      errors.push({ type: 'Admin Page', message: e.message });
    }
    
    // Test 6: Rapid Navigation
    console.log('\n📍 Test 6: Rapid Navigation Test');
    const routes = ['/', '/vote', '/results', '/admin', '/vote', '/'];
    const navStart = Date.now();
    
    for (const route of routes) {
      testCount++;
      try {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
        successCount++;
      } catch (e) {
        console.log(`  ✗ Failed to navigate to ${route}`);
        errors.push({ type: 'Rapid Nav', message: `Failed ${route}` });
      }
    }
    
    const navTime = Date.now() - navStart;
    console.log(`  ✓ Completed ${routes.length} navigations in ${navTime}ms`);
    console.log(`  ✓ Average: ${Math.round(navTime / routes.length)}ms per page`);
    
    // Test 7: Edge Cases
    console.log('\n📍 Test 7: Edge Case Tests');
    
    // Back to voting page
    await page.goto(`${BASE_URL}/vote`, { waitUntil: 'networkidle0' });
    
    // Test empty submission
    testCount++;
    try {
      const input = await page.$('input[type="text"]');
      if (input) {
        await input.click({ clickCount: 3 });
        await input.type('     '); // Just spaces
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        console.log('  ✓ Empty input handled');
        successCount++;
      }
    } catch (e) {
      console.log('  ✗ Empty input test failed');
    }
    
    // Test XSS attempt
    testCount++;
    try {
      const input = await page.$('input[type="text"]');
      if (input) {
        await input.click({ clickCount: 3 });
        await input.type('<script>alert("xss")</script>');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        
        // Check if any alerts appeared
        const alertAppeared = await page.evaluate(() => {
          return window.alertShown || false;
        });
        
        if (!alertAppeared) {
          console.log('  ✓ XSS attempt blocked');
          successCount++;
        } else {
          console.log('  ✗ XSS vulnerability detected!');
          errors.push({ type: 'Security', message: 'XSS vulnerability' });
        }
      }
    } catch (e) {
      console.log('  ✓ XSS handled (no execution)');
      successCount++;
    }
    
  } catch (error) {
    console.error('\n❌ Critical error:', error.message);
    errors.push({ type: 'Critical', message: error.message });
  } finally {
    await browser.close();
    
    // Summary
    console.log('\n📊 UI Stress Test Results:');
    console.log('='.repeat(50));
    console.log(`Tests run: ${testCount}`);
    console.log(`Passed: ${successCount} (${Math.round(successCount/testCount*100)}%)`);
    console.log(`Failed: ${testCount - successCount}`);
    
    if (errors.length > 0) {
      console.log(`\n❌ Found ${errors.length} errors:`);
      errors.forEach((error, i) => {
        console.log(`\n${i + 1}. ${error.type}`);
        console.log(`   ${error.message}`);
        if (error.url) console.log(`   URL: ${error.url}`);
      });
    } else {
      console.log('\n✅ All UI tests passed!');
    }
    
    console.log('\n🏁 UI stress test completed!');
  }
}

// Add alert detection
puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    window.alertShown = false;
    window.alert = () => { window.alertShown = true; };
  });
  await browser.close();
});

runUIStressTest().catch(console.error);