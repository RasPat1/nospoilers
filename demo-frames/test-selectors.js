const puppeteer = require('puppeteer');

async function testSelectors() {
  console.log('🧪 Testing NoSpoilers selectors...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    devtools: true
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Test 1: Landing page
    console.log('1️⃣ Testing landing page...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);
    console.log('✅ Landing page loaded');

    // Test 2: Vote page
    console.log('\n2️⃣ Testing vote page...');
    await page.goto('http://localhost:3000/vote');
    await page.waitForTimeout(1000);
    
    // Test 3: Movie search input
    console.log('\n3️⃣ Testing movie search...');
    const searchInput = await page.$('input[placeholder="Search for a movie..."]');
    if (searchInput) {
      console.log('✅ Found search input');
      await searchInput.type('The Matrix');
      await page.waitForTimeout(2000);
      
      // Check for autocomplete results
      const autocompleteResults = await page.$$('button[class*="hover:bg-neutral-100"]');
      console.log(`✅ Found ${autocompleteResults.length} autocomplete results`);
    } else {
      console.log('❌ Search input not found');
    }

    // Test 4: Results page
    console.log('\n4️⃣ Testing results page...');
    await page.goto('http://localhost:3000/results');
    await page.waitForTimeout(1000);
    console.log('✅ Results page loaded');

    // Test 5: Admin page
    console.log('\n5️⃣ Testing admin page...');
    await page.goto('http://localhost:3000/admin?admin=admin123');
    await page.waitForTimeout(1000);
    
    const usernameInput = await page.$('input[type="text"]');
    const passwordInput = await page.$('input[type="password"]');
    
    if (usernameInput && passwordInput) {
      console.log('✅ Found admin login form');
    } else {
      console.log('❌ Admin login form not found');
    }

    console.log('\n✅ All selector tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testSelectors();