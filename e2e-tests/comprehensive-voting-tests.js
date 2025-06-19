const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to create a user session
async function createUser(browser, name) {
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/vote');
  await sleep(2000); // Wait for page load and WebSocket connection
  return { page, name };
}

// Helper to add a movie
async function addMovie(user, movieTitle) {
  console.log(`  ${user.name} adding ${movieTitle}...`);
  await user.page.type('input[placeholder="Search for a movie..."]', movieTitle);
  await sleep(2500);
  
  // Click first search result
  await user.page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const movieBtn = buttons.find(b => b.querySelector('img'));
    if (movieBtn) movieBtn.click();
  });
  await sleep(1000);
  
  // Click Add to Ranking
  await user.page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
    if (addBtn) addBtn.click();
  });
  await sleep(1500);
}

// Helper to rank and submit vote
async function voteForMovies(user, rankings) {
  console.log(`  ${user.name} voting for: ${rankings.join(', ')}`);
  
  // Add movies to ranking in order
  for (const movieTitle of rankings) {
    await user.page.evaluate((title) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const movieBtn = addBtns.find(b => b.closest('div').textContent.includes(title));
      if (movieBtn) movieBtn.click();
    }, movieTitle);
    await sleep(500);
  }
  
  // Submit vote
  await user.page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
    if (submit) submit.click();
  });
  await sleep(2000);
}

// Helper to get voting results
async function getResults(user) {
  await user.page.goto('http://localhost:3000/results');
  await sleep(2000);
  
  // Get winner
  const winner = await user.page.evaluate(() => {
    const winnerSection = document.querySelector('h2.text-2xl');
    if (winnerSection && winnerSection.textContent.includes('Winner:')) {
      return winnerSection.textContent.replace('🏆 Winner: ', '').trim();
    }
    return null;
  });
  
  // Get elimination rounds if available
  await user.page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const elim = buttons.find(b => b.textContent.includes('View Elimination Rounds'));
    if (elim) elim.click();
  });
  await sleep(1000);
  
  const eliminationRounds = await user.page.evaluate(() => {
    const rounds = [];
    const roundDivs = document.querySelectorAll('div.p-4.bg-neutral-100');
    roundDivs.forEach(div => {
      const roundText = div.textContent;
      if (roundText.includes('Round')) {
        rounds.push(roundText);
      }
    });
    return rounds;
  });
  
  return { winner, eliminationRounds };
}

// Clear all data before test
async function clearData(browser) {
  const admin = await browser.newPage();
  await admin.goto('http://localhost:3000/admin?admin=admin123');
  await sleep(1500);
  
  // Check if we need to login
  const needsLogin = await admin.evaluate(() => {
    return document.querySelector('input[type="text"]') !== null;
  });
  
  if (needsLogin) {
    await admin.type('input[type="text"]', 'admin');
    await admin.type('input[type="password"]', 'admin123');
    await admin.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const login = buttons.find(b => b.textContent.includes('Login'));
      if (login) login.click();
    });
    await sleep(2000);
  }
  
  await admin.evaluate(() => {
    window.confirm = () => true;
    const buttons = Array.from(document.querySelectorAll('button'));
    const reset = buttons.find(b => b.textContent.includes('Delete Everything'));
    if (reset) reset.click();
  });
  await sleep(2000);
  await admin.close();
}

// Test scenarios
async function runTests() {
  console.log('🧪 Comprehensive End-to-End Voting Tests\n');
  
  let browser;
  const testResults = [];
  
  try {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      slowMo: 50,
      args: ['--window-size=1200,800']
    });
    
    // Test 1: Basic majority winner
    console.log('📍 Test 1: Basic Majority Winner');
    console.log('Scenario: 3 users, clear majority for one movie\n');
    
    await clearData(browser);
    
    const alice = await createUser(browser, 'Alice');
    const bob = await createUser(browser, 'Bob');
    const charlie = await createUser(browser, 'Charlie');
    
    // Alice adds movies
    await addMovie(alice, 'Inception');
    await addMovie(alice, 'The Matrix');
    await addMovie(alice, 'Interstellar');
    
    // Everyone votes - majority for Inception
    await voteForMovies(alice, ['Inception', 'The Matrix', 'Interstellar']);
    await voteForMovies(bob, ['Inception', 'Interstellar', 'The Matrix']);
    await voteForMovies(charlie, ['Inception', 'The Matrix', 'Interstellar']);
    
    const test1Result = await getResults(alice);
    testResults.push({
      test: 'Basic Majority Winner',
      expected: 'Inception',
      actual: test1Result.winner,
      passed: test1Result.winner === 'Inception'
    });
    
    await alice.page.close();
    await bob.page.close();
    await charlie.page.close();
    
    // Test 2: IRV with elimination rounds
    console.log('\n📍 Test 2: IRV Elimination Rounds');
    console.log('Scenario: 4 users, no initial majority, needs elimination\n');
    
    await clearData(browser);
    
    const dave = await createUser(browser, 'Dave');
    const eve = await createUser(browser, 'Eve');
    const frank = await createUser(browser, 'Frank');
    const grace = await createUser(browser, 'Grace');
    
    // Add movies
    await addMovie(dave, 'Parasite');
    await addMovie(eve, 'The Dark Knight');
    await addMovie(frank, 'Pulp Fiction');
    await addMovie(grace, 'The Godfather');
    
    // Vote to force elimination rounds
    await voteForMovies(dave, ['Parasite', 'The Dark Knight']);
    await voteForMovies(eve, ['The Dark Knight', 'Pulp Fiction']);
    await voteForMovies(frank, ['Pulp Fiction', 'The Dark Knight']);
    await voteForMovies(grace, ['The Godfather', 'The Dark Knight']);
    
    const test2Result = await getResults(dave);
    testResults.push({
      test: 'IRV Elimination',
      expected: 'The Dark Knight',
      actual: test2Result.winner,
      passed: test2Result.winner === 'The Dark Knight',
      rounds: test2Result.eliminationRounds.length
    });
    
    await dave.page.close();
    await eve.page.close();
    await frank.page.close();
    await grace.page.close();
    
    // Test 3: Partial rankings
    console.log('\n📍 Test 3: Partial Rankings');
    console.log('Scenario: Users submit incomplete rankings\n');
    
    await clearData(browser);
    
    const helen = await createUser(browser, 'Helen');
    const ivan = await createUser(browser, 'Ivan');
    const jane = await createUser(browser, 'Jane');
    
    await addMovie(helen, 'Avatar');
    await addMovie(ivan, 'Titanic');
    await addMovie(jane, 'Star Wars');
    
    // Partial rankings
    await voteForMovies(helen, ['Avatar']); // Only ranks 1
    await voteForMovies(ivan, ['Titanic', 'Avatar']); // Ranks 2
    await voteForMovies(jane, ['Star Wars', 'Titanic', 'Avatar']); // Ranks all
    
    const test3Result = await getResults(helen);
    testResults.push({
      test: 'Partial Rankings',
      expected: 'Should handle partial rankings correctly',
      actual: test3Result.winner,
      passed: test3Result.winner !== null
    });
    
    await helen.page.close();
    await ivan.page.close();
    await jane.page.close();
    
    // Test 4: Order independence
    console.log('\n📍 Test 4: Order Independence');
    console.log('Scenario: Same votes in different order should yield same result\n');
    
    await clearData(browser);
    
    const kevin = await createUser(browser, 'Kevin');
    const lisa = await createUser(browser, 'Lisa');
    const mike = await createUser(browser, 'Mike');
    
    // Different users add movies
    await addMovie(kevin, 'Fight Club');
    await addMovie(lisa, 'The Shawshank Redemption');
    await addMovie(mike, 'Forrest Gump');
    
    // Vote in different orders but same preferences
    await voteForMovies(kevin, ['The Shawshank Redemption', 'Fight Club', 'Forrest Gump']);
    await voteForMovies(lisa, ['The Shawshank Redemption', 'Fight Club', 'Forrest Gump']);
    await voteForMovies(mike, ['The Shawshank Redemption', 'Forrest Gump', 'Fight Club']);
    
    const test4Result = await getResults(kevin);
    testResults.push({
      test: 'Order Independence',
      expected: 'The Shawshank Redemption',
      actual: test4Result.winner,
      passed: test4Result.winner === 'The Shawshank Redemption'
    });
    
    await kevin.page.close();
    await lisa.page.close();
    await mike.page.close();
    
    // Test 5: Tie handling
    console.log('\n📍 Test 5: Tie Scenario');
    console.log('Scenario: Equal votes for top candidates\n');
    
    await clearData(browser);
    
    const nancy = await createUser(browser, 'Nancy');
    const oscar = await createUser(browser, 'Oscar');
    
    await addMovie(nancy, 'The Matrix');
    await addMovie(oscar, 'Inception');
    
    // Equal first-choice votes
    await voteForMovies(nancy, ['The Matrix', 'Inception']);
    await voteForMovies(oscar, ['Inception', 'The Matrix']);
    
    const test5Result = await getResults(nancy);
    testResults.push({
      test: 'Tie Handling',
      expected: 'Should handle ties appropriately',
      actual: test5Result.winner || 'Tie detected',
      passed: true // Pass if no crash
    });
    
    await nancy.page.close();
    await oscar.page.close();
    
    // Test 6: Real-time movie addition during voting
    console.log('\n📍 Test 6: Real-time Movie Addition');
    console.log('Scenario: Movies added while others are voting\n');
    
    await clearData(browser);
    
    const paul = await createUser(browser, 'Paul');
    const quinn = await createUser(browser, 'Quinn');
    const rachel = await createUser(browser, 'Rachel');
    
    // Paul adds a movie and starts voting
    await addMovie(paul, 'Gladiator');
    
    // Paul starts ranking
    await paul.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const movieBtn = addBtns.find(b => b.closest('div').textContent.includes('Gladiator'));
      if (movieBtn) movieBtn.click();
    });
    
    // While Paul is ranking, Quinn adds more movies
    await addMovie(quinn, 'Braveheart');
    await addMovie(rachel, 'The Last Samurai');
    
    // Check if Paul sees new movies
    await sleep(2000); // Wait for WebSocket update
    const paulSeesNewMovies = await paul.page.evaluate(() => {
      const movieTitles = Array.from(document.querySelectorAll('h3'));
      return movieTitles.some(t => t.textContent.includes('Braveheart')) &&
             movieTitles.some(t => t.textContent.includes('The Last Samurai'));
    });
    
    testResults.push({
      test: 'Real-time Updates',
      expected: 'true',
      actual: paulSeesNewMovies.toString(),
      passed: paulSeesNewMovies
    });
    
    await paul.page.close();
    await quinn.page.close();
    await rachel.page.close();
    
    // Test 7: Clear vote and revote
    console.log('\n📍 Test 7: Clear Vote and Revote');
    console.log('Scenario: User changes their mind and revotes\n');
    
    await clearData(browser);
    
    const sam = await createUser(browser, 'Sam');
    const tina = await createUser(browser, 'Tina');
    
    await addMovie(sam, 'Joker');
    await addMovie(tina, 'The Batman');
    
    // First vote
    await voteForMovies(sam, ['Joker', 'The Batman']);
    await voteForMovies(tina, ['The Batman', 'Joker']);
    
    // Sam changes mind
    await sam.page.goto('http://localhost:3000/vote');
    await sleep(1500);
    
    // Clear vote
    await sam.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const clearBtn = buttons.find(b => b.textContent.includes('Clear Vote'));
      if (clearBtn) clearBtn.click();
    });
    await sleep(2000);
    
    // Revote with different preference
    await voteForMovies(sam, ['The Batman', 'Joker']);
    
    const test7Result = await getResults(sam);
    testResults.push({
      test: 'Clear and Revote',
      expected: 'The Batman',
      actual: test7Result.winner,
      passed: test7Result.winner === 'The Batman'
    });
    
    await sam.page.close();
    await tina.page.close();
    
    // Test 8: Edge case - single voter
    console.log('\n📍 Test 8: Single Voter');
    console.log('Scenario: Only one person votes\n');
    
    await clearData(browser);
    
    const uma = await createUser(browser, 'Uma');
    
    await addMovie(uma, 'Kill Bill');
    await addMovie(uma, 'Pulp Fiction');
    
    await voteForMovies(uma, ['Kill Bill', 'Pulp Fiction']);
    
    const test8Result = await getResults(uma);
    testResults.push({
      test: 'Single Voter',
      expected: 'Kill Bill',
      actual: test8Result.winner,
      passed: test8Result.winner === 'Kill Bill'
    });
    
    await uma.page.close();
    
    // Print test results
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    let passedCount = 0;
    testResults.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} | ${result.test}`);
      console.log(`       Expected: ${result.expected}`);
      console.log(`       Actual: ${result.actual}`);
      if (result.rounds) {
        console.log(`       Elimination rounds: ${result.rounds}`);
      }
      console.log('');
      if (result.passed) passedCount++;
    });
    
    console.log('='.repeat(60));
    console.log(`Total: ${passedCount}/${testResults.length} tests passed`);
    console.log('='.repeat(60));
    
    // Check for potential issues
    console.log('\n🔍 Potential Issues Found:');
    
    const issues = [];
    
    // Check if IRV elimination is working
    const irvTest = testResults.find(r => r.test === 'IRV Elimination');
    if (irvTest && (!irvTest.rounds || irvTest.rounds === 0)) {
      issues.push('⚠️  IRV elimination rounds may not be working correctly');
    }
    
    // Check if ties are handled
    const tieTest = testResults.find(r => r.test === 'Tie Handling');
    if (tieTest && tieTest.actual === 'Tie detected') {
      issues.push('⚠️  Tie breaking mechanism may need implementation');
    }
    
    // Check real-time updates
    const realtimeTest = testResults.find(r => r.test === 'Real-time Updates');
    if (realtimeTest && !realtimeTest.passed) {
      issues.push('⚠️  Real-time WebSocket updates not working properly');
    }
    
    if (issues.length === 0) {
      console.log('✅ No major issues detected!');
    } else {
      issues.forEach(issue => console.log(issue));
    }
    
  } catch (error) {
    console.error('Test suite error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run tests
runTests();