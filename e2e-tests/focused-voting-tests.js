const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper functions
async function createUser(browser, name) {
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/vote');
  await sleep(2000);
  
  // Disable WebSocket logging to reduce noise
  await page.evaluateOnNewDocument(() => {
    const originalLog = console.log;
    console.log = (...args) => {
      if (!args[0]?.toString().includes('WebSocket')) {
        originalLog(...args);
      }
    };
  });
  
  return { page, name };
}

async function addMovie(user, movieTitle) {
  console.log(`  ${user.name} adding ${movieTitle}...`);
  
  // Clear input first
  await user.page.click('input[placeholder="Search for a movie..."]', { clickCount: 3 });
  await user.page.keyboard.press('Backspace');
  
  await user.page.type('input[placeholder="Search for a movie..."]', movieTitle);
  await sleep(3000); // Wait for search results
  
  // Click first result
  const clicked = await user.page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const movieBtn = buttons.find(b => b.querySelector('img'));
    if (movieBtn) {
      movieBtn.click();
      return true;
    }
    return false;
  });
  
  if (!clicked) {
    console.log(`    ⚠️  No search result found for ${movieTitle}`);
    return false;
  }
  
  await sleep(1000);
  
  // Click Add to Ranking
  const added = await user.page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
    if (addBtn) {
      addBtn.click();
      return true;
    }
    return false;
  });
  
  await sleep(1500);
  return added;
}

async function rankMovies(user, rankings) {
  console.log(`  ${user.name} ranking: ${rankings.join(' > ')}`);
  
  for (const movieTitle of rankings) {
    const ranked = await user.page.evaluate((title) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => 
        b.textContent.includes('Add to Ranking') && 
        b.querySelector('svg') &&
        b.closest('div').textContent.includes(title)
      );
      if (addBtns.length > 0) {
        addBtns[0].click();
        return true;
      }
      return false;
    }, movieTitle);
    
    if (!ranked) {
      console.log(`    ⚠️  Could not rank ${movieTitle}`);
    }
    await sleep(500);
  }
}

async function submitVote(user) {
  const submitted = await user.page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
    if (submit && !submit.disabled) {
      submit.click();
      return true;
    }
    return false;
  });
  
  if (submitted) {
    console.log(`  ${user.name} submitted vote ✓`);
  } else {
    console.log(`  ${user.name} failed to submit ✗`);
  }
  
  await sleep(2000);
  return submitted;
}

async function getResults(page) {
  await page.goto('http://localhost:3000/results');
  await sleep(2500);
  
  // Get winner
  const winner = await page.evaluate(() => {
    const winnerEl = Array.from(document.querySelectorAll('h2')).find(h => 
      h.textContent.includes('Winner:')
    );
    if (winnerEl) {
      return winnerEl.textContent.replace('🏆 Winner:', '').trim();
    }
    
    // Check if voting still open
    const stillOpen = document.body.textContent.includes('Voting Open');
    if (stillOpen) {
      return 'VOTING_STILL_OPEN';
    }
    
    return null;
  });
  
  // Get vote counts
  const voteCounts = await page.evaluate(() => {
    const counts = {};
    const movieDivs = document.querySelectorAll('div.bg-white.dark\\:bg-neutral-900');
    
    movieDivs.forEach(div => {
      const titleEl = div.querySelector('h3');
      const voteEl = div.querySelector('p.text-sm');
      if (titleEl && voteEl) {
        const title = titleEl.textContent.trim();
        const voteMatch = voteEl.textContent.match(/(\d+) vote/);
        if (voteMatch) {
          counts[title] = parseInt(voteMatch[1]);
        }
      }
    });
    
    return counts;
  });
  
  // Check for elimination rounds
  const hasElimination = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const elimBtn = buttons.find(b => b.textContent.includes('View Elimination Rounds'));
    return elimBtn !== null;
  });
  
  return { winner, voteCounts, hasElimination };
}

async function clearData(browser) {
  console.log('📋 Clearing database...');
  const admin = await browser.newPage();
  await admin.goto('http://localhost:3000/admin?admin=admin123');
  await sleep(2000);
  
  // Check if already logged in
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
  
  // Click reset
  await admin.evaluate(() => {
    window.confirm = () => true;
    const buttons = Array.from(document.querySelectorAll('button'));
    const reset = buttons.find(b => b.textContent.includes('Delete Everything'));
    if (reset) reset.click();
  });
  
  await sleep(2000);
  await admin.close();
  console.log('✓ Database cleared\n');
}

// Run focused tests
async function runFocusedTests() {
  console.log('🧪 Focused Voting System Tests\n');
  console.log('Testing IRV algorithm and real-time updates...\n');
  
  let browser;
  const results = [];
  
  try {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      slowMo: 20,
      args: ['--window-size=1400,900']
    });
    
    // Test 1: Simple Majority (3 voters, clear winner)
    console.log('═══════════════════════════════════════════');
    console.log('TEST 1: Simple Majority Winner');
    console.log('═══════════════════════════════════════════\n');
    
    await clearData(browser);
    
    const alice = await createUser(browser, 'Alice');
    const bob = await createUser(browser, 'Bob');
    const charlie = await createUser(browser, 'Charlie');
    
    // Add movies
    await addMovie(alice, 'Inception');
    await addMovie(bob, 'The Matrix');
    await addMovie(charlie, 'Interstellar');
    
    // Vote: Inception should win with 2/3 votes
    await rankMovies(alice, ['Inception', 'The Matrix']);
    await submitVote(alice);
    
    await rankMovies(bob, ['Inception', 'Interstellar']);
    await submitVote(bob);
    
    await rankMovies(charlie, ['Interstellar', 'The Matrix']);
    await submitVote(charlie);
    
    const test1 = await getResults(alice.page);
    console.log('\nResults:');
    console.log(`  Winner: ${test1.winner}`);
    console.log(`  Votes:`, test1.voteCounts);
    console.log(`  Expected: Inception (2 first-choice votes)`);
    
    results.push({
      name: 'Simple Majority',
      expected: 'Inception',
      actual: test1.winner,
      passed: test1.winner === 'Inception'
    });
    
    await alice.page.close();
    await bob.page.close();
    await charlie.page.close();
    
    // Test 2: IRV Elimination Required
    console.log('\n═══════════════════════════════════════════');
    console.log('TEST 2: IRV with Elimination Rounds');
    console.log('═══════════════════════════════════════════\n');
    
    await clearData(browser);
    
    const dave = await createUser(browser, 'Dave');
    const eve = await createUser(browser, 'Eve');
    const frank = await createUser(browser, 'Frank');
    const grace = await createUser(browser, 'Grace');
    
    // Add 4 movies
    await addMovie(dave, 'Pulp Fiction');
    await addMovie(eve, 'The Godfather');
    await addMovie(frank, 'Goodfellas');
    await addMovie(grace, 'Scarface');
    
    // Vote pattern that requires elimination
    // No movie gets >50% on first round
    await rankMovies(dave, ['Pulp Fiction', 'The Godfather', 'Goodfellas']);
    await submitVote(dave);
    
    await rankMovies(eve, ['The Godfather', 'Goodfellas', 'Pulp Fiction']);
    await submitVote(eve);
    
    await rankMovies(frank, ['Goodfellas', 'The Godfather', 'Pulp Fiction']);
    await submitVote(frank);
    
    await rankMovies(grace, ['Scarface', 'The Godfather', 'Goodfellas']);
    await submitVote(grace);
    
    const test2 = await getResults(dave.page);
    console.log('\nResults:');
    console.log(`  Winner: ${test2.winner}`);
    console.log(`  Votes:`, test2.voteCounts);
    console.log(`  Has elimination rounds: ${test2.hasElimination}`);
    console.log(`  Expected: The Godfather (after Scarface elimination)`);
    
    results.push({
      name: 'IRV Elimination',
      expected: 'The Godfather',
      actual: test2.winner,
      passed: test2.winner === 'The Godfather' && test2.hasElimination
    });
    
    await dave.page.close();
    await eve.page.close();
    await frank.page.close();
    await grace.page.close();
    
    // Test 3: Real-time Updates
    console.log('\n═══════════════════════════════════════════');
    console.log('TEST 3: Real-time Movie Updates');
    console.log('═══════════════════════════════════════════\n');
    
    await clearData(browser);
    
    const helen = await createUser(browser, 'Helen');
    const ivan = await createUser(browser, 'Ivan');
    
    // Helen adds a movie
    await addMovie(helen, 'Avatar');
    
    // Check if Ivan sees it without refresh
    await sleep(2000); // Wait for WebSocket
    const ivanSeesAvatar = await ivan.page.evaluate(() => {
      const titles = Array.from(document.querySelectorAll('h3'));
      return titles.some(t => t.textContent.includes('Avatar'));
    });
    
    console.log(`\n  Real-time update test:`);
    console.log(`  Helen added Avatar`);
    console.log(`  Ivan sees Avatar: ${ivanSeesAvatar ? 'YES ✓' : 'NO ✗'}`);
    
    results.push({
      name: 'Real-time Updates',
      expected: true,
      actual: ivanSeesAvatar,
      passed: ivanSeesAvatar
    });
    
    await helen.page.close();
    await ivan.page.close();
    
    // Test 4: Partial Rankings
    console.log('\n═══════════════════════════════════════════');
    console.log('TEST 4: Partial Rankings');
    console.log('═══════════════════════════════════════════\n');
    
    await clearData(browser);
    
    const jane = await createUser(browser, 'Jane');
    const kevin = await createUser(browser, 'Kevin');
    const lisa = await createUser(browser, 'Lisa');
    
    // Add movies
    await addMovie(jane, 'Star Wars');
    await addMovie(kevin, 'Star Trek');
    await addMovie(lisa, 'Dune');
    
    // Partial rankings
    await rankMovies(jane, ['Star Wars']); // Only ranks 1
    await submitVote(jane);
    
    await rankMovies(kevin, ['Star Trek', 'Dune']); // Ranks 2 of 3
    await submitVote(kevin);
    
    await rankMovies(lisa, ['Dune', 'Star Wars', 'Star Trek']); // Ranks all
    await submitVote(lisa);
    
    const test4 = await getResults(jane.page);
    console.log('\nResults:');
    console.log(`  Winner: ${test4.winner}`);
    console.log(`  Votes:`, test4.voteCounts);
    console.log(`  Expected: System handles partial rankings`);
    
    results.push({
      name: 'Partial Rankings',
      expected: 'No crashes',
      actual: test4.winner || 'Handled',
      passed: test4.winner !== null
    });
    
    await jane.page.close();
    await kevin.page.close();
    await lisa.page.close();
    
    // Summary
    console.log('\n═══════════════════════════════════════════');
    console.log('TEST SUMMARY');
    console.log('═══════════════════════════════════════════\n');
    
    results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.name}`);
      if (!result.passed) {
        console.log(`     Expected: ${result.expected}`);
        console.log(`     Actual: ${result.actual}`);
      }
    });
    
    const passed = results.filter(r => r.passed).length;
    console.log(`\nTotal: ${passed}/${results.length} tests passed`);
    
    // Identify issues
    console.log('\n🔍 Analysis:');
    
    if (!results.find(r => r.name === 'Real-time Updates').passed) {
      console.log('⚠️  WebSocket real-time updates may not be working');
    }
    
    if (!results.find(r => r.name === 'IRV Elimination').passed) {
      console.log('⚠️  IRV elimination algorithm may have issues');
    }
    
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the tests
runFocusedTests();