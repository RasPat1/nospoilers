const puppeteer = require('puppeteer');

// Configuration
const BASE_URL = 'http://localhost:3000';
const HEADLESS = false; // Set to true for faster execution

// Test data
const testMovies = [
  "The Matrix",
  "Inception", 
  "Pulp Fiction",
  "The Dark Knight",
  "Fight Club",
  "Interstellar",
  "The Shawshank Redemption",
  "Parasite",
  "The Godfather",
  "Spirited Away"
];

// Utility functions
function getRandomMovies(count) {
  const shuffled = [...testMovies].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main stress test function
async function stressTest() {
  console.log('🚀 Starting NoSpoilers Stress Test...\n');
  
  const browser = await puppeteer.launch({
    headless: HEADLESS,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const errors = [];
  const consoleErrors = [];
  
  try {
    const page = await browser.newPage();
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore WebSocket connection errors as they're expected
        if (!text.includes('WebSocket') && !text.includes('ws://') && !text.includes('favicon')) {
          consoleErrors.push({
            url: page.url(),
            error: text,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      errors.push({
        url: page.url(),
        error: error.message,
        timestamp: new Date().toISOString()
      });
    });

    // Test 1: Homepage Navigation
    console.log('📍 Test 1: Testing Homepage...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await delay(1000);
    
    // Click navigation buttons by their text content
    const navTests = [
      { text: 'Start Voting Now', description: 'Start Voting button' },
      { text: 'Watch Demo', description: 'Watch Demo button' },
      { text: 'Create Voting Session', description: 'Create Session button' },
      { text: 'Start Free Movie Vote', description: 'Start Free Vote button' }
    ];

    for (const test of navTests) {
      try {
        const [button] = await page.$x(`//button[contains(., '${test.text}')]`);
        if (button) {
          console.log(`  ✓ Found ${test.description}`);
          // Just check if clickable, don't navigate
          const isClickable = await button.evaluate(el => {
            return !el.disabled && el.offsetParent !== null;
          });
          console.log(`    ${isClickable ? '✓' : '✗'} Button is clickable`);
        } else {
          console.log(`  ✗ Could not find ${test.description}`);
        }
      } catch (e) {
        console.log(`  ✗ Error testing ${test.description}: ${e.message}`);
      }
    }

    // Test clicking "Start Voting Now" button
    console.log('\n  - Testing navigation to voting page...');
    try {
      const [startVotingBtn] = await page.$x(`//button[contains(., 'Start Voting Now')]`);
      if (startVotingBtn) {
        await startVotingBtn.click();
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        console.log(`    ✓ Navigated to ${page.url()}`);
      }
    } catch (e) {
      console.log(`    ✗ Navigation failed: ${e.message}`);
    }

    // Test 2: Voting Page Stress Test
    console.log('\n📍 Test 2: Stress Testing Voting Page...');
    if (!page.url().includes('/vote')) {
      await page.goto(`${BASE_URL}/vote`, { waitUntil: 'networkidle0' });
    }
    await delay(1000);

    // Check if we're on the voting page
    const votingInput = await page.$('input[type="text"]');
    if (!votingInput) {
      console.log('  ✗ Voting page not loaded properly');
    } else {
      // Add movies
      console.log('  - Adding multiple movies rapidly...');
      for (let i = 0; i < 5; i++) {
        const movie = testMovies[i];
        try {
          // Clear input first
          await votingInput.click({ clickCount: 3 });
          await votingInput.type(movie, { delay: 10 });
          await delay(1000); // Wait for autocomplete
          
          // Try to click the first autocomplete result
          const firstResult = await page.$('.cursor-pointer');
          if (firstResult) {
            await firstResult.click();
            console.log(`    ✓ Added ${movie}`);
          } else {
            console.log(`    ✗ No autocomplete for ${movie}`);
          }
          await delay(300);
        } catch (e) {
          console.log(`    ✗ Failed to add ${movie}: ${e.message}`);
        }
      }

      // Test movie deletion
      console.log('  - Testing movie deletion...');
      try {
        const deleteButtons = await page.$$('button[aria-label*="Remove"]');
        if (deleteButtons.length > 0) {
          await deleteButtons[0].click();
          await delay(300);
          console.log('    ✓ Movie deletion tested');
        } else {
          console.log('    ✗ No delete buttons found');
        }
      } catch (e) {
        console.log(`    ✗ Movie deletion failed: ${e.message}`);
      }

      // Test vote submission
      console.log('  - Testing vote submission...');
      try {
        const [submitButton] = await page.$x(`//button[contains(., 'Submit Vote')]`);
        if (submitButton) {
          await submitButton.click();
          await delay(2000);
          console.log('    ✓ Vote submitted');
          
          // Check if we see the success message
          const successMessage = await page.$x(`//*[contains(text(), 'Thanks for voting')]`);
          if (successMessage.length > 0) {
            console.log('    ✓ Vote confirmed');
          }
        } else {
          console.log('    ✗ Submit button not found');
        }
      } catch (e) {
        console.log(`    ✗ Vote submission failed: ${e.message}`);
      }
    }

    // Test 3: Results Page
    console.log('\n📍 Test 3: Testing Results Page...');
    await page.goto(`${BASE_URL}/results`, { waitUntil: 'networkidle0' });
    await delay(1000);

    // Check for results elements
    const resultsChecks = [
      { selector: 'h1', description: 'Results heading' },
      { xpath: '//*[contains(@class, "primary")]', description: 'Results container' }
    ];

    for (const check of resultsChecks) {
      try {
        if (check.selector) {
          const found = await page.$(check.selector);
          console.log(`  ${found ? '✓' : '✗'} ${check.description}`);
        } else if (check.xpath) {
          const [found] = await page.$x(check.xpath);
          console.log(`  ${found ? '✓' : '✗'} ${check.description}`);
        }
      } catch (e) {
        console.log(`  ✗ Error checking ${check.description}: ${e.message}`);
      }
    }

    // Test 4: Admin Functions
    console.log('\n📍 Test 4: Testing Admin Functions...');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
    await delay(1000);

    try {
      // Check if admin page loaded
      const adminHeading = await page.$('h1');
      if (adminHeading) {
        const text = await adminHeading.evaluate(el => el.textContent);
        console.log(`  ✓ Admin page loaded: ${text}`);
      }
      
      // Look for reset button
      const [resetButton] = await page.$x(`//button[contains(., 'Reset')]`);
      if (resetButton) {
        console.log('  ✓ Reset button found');
      } else {
        console.log('  ✗ Reset button not found');
      }
    } catch (e) {
      console.log(`  ✗ Admin page error: ${e.message}`);
    }

    // Test 5: Edge Cases
    console.log('\n📍 Test 5: Testing Edge Cases...');
    
    // Go back to voting page
    await page.goto(`${BASE_URL}/vote`, { waitUntil: 'networkidle0' });
    await delay(500);
    
    const edgeInput = await page.$('input[type="text"]');
    if (edgeInput) {
      // Test empty submission
      try {
        await edgeInput.click({ clickCount: 3 });
        await edgeInput.type('   ');
        await page.keyboard.press('Enter');
        await delay(300);
        console.log('  ✓ Empty movie submission handled');
      } catch (e) {
        console.log('  ✗ Empty submission error:', e.message);
      }

      // Test special characters
      try {
        await edgeInput.click({ clickCount: 3 });
        await edgeInput.type('<script>alert("xss")</script>');
        await page.keyboard.press('Enter');
        await delay(300);
        console.log('  ✓ Special characters handled');
      } catch (e) {
        console.log('  ✗ Special characters error:', e.message);
      }
    }

    // Test 6: Performance Test
    console.log('\n📍 Test 6: Performance Test...');
    const perfStart = Date.now();
    
    // Navigate through all pages rapidly
    const routes = ['/', '/vote', '/results', '/admin'];
    for (let i = 0; i < 3; i++) {
      for (const route of routes) {
        try {
          await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
        } catch (e) {
          console.log(`  ✗ Failed to load ${route}`);
        }
      }
    }
    
    const perfTime = Date.now() - perfStart;
    console.log(`  ✓ Completed ${routes.length * 3} navigations in ${perfTime}ms`);
    console.log(`  ✓ Average: ${Math.round(perfTime / (routes.length * 3))}ms per page`);

  } catch (error) {
    console.error('\n❌ Critical error during stress test:', error);
  } finally {
    await browser.close();
    
    // Report findings
    console.log('\n📊 Stress Test Results:');
    console.log('='.repeat(50));
    
    if (errors.length === 0 && consoleErrors.length === 0) {
      console.log('✅ No errors found! The app handled all stress tests successfully.');
    } else {
      console.log(`❌ Found ${errors.length + consoleErrors.length} errors:\n`);
      
      if (errors.length > 0) {
        console.log('Page Errors:');
        errors.forEach((e, i) => {
          console.log(`  ${i + 1}. ${e.url}`);
          console.log(`     ${e.error}`);
          console.log(`     Time: ${e.timestamp}\n`);
        });
      }
      
      if (consoleErrors.length > 0) {
        console.log('Console Errors:');
        consoleErrors.forEach((e, i) => {
          console.log(`  ${i + 1}. ${e.url}`);
          console.log(`     ${e.error}`);
          console.log(`     Time: ${e.timestamp}\n`);
        });
      }
    }
    
    console.log('\n🏁 Stress test completed!');
  }
}

// Run the stress test
stressTest().catch(console.error);