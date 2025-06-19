const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSimpleIRVTest() {
  console.log('🧪 Simple IRV Algorithm Test\n');
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      slowMo: 100,
      args: ['--window-size=1200,800']
    });
    
    // Clear data first
    console.log('1️⃣ Clearing database...');
    const admin = await browser.newPage();
    await admin.goto('http://localhost:3000/admin?admin=admin123');
    await sleep(2000);
    
    // Login if needed
    const needsLogin = await admin.evaluate(() => {
      return document.querySelector('input[type="password"]') !== null;
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
    console.log('✅ Database cleared\n');
    
    // Create 4 users for IRV test
    console.log('2️⃣ Creating 4 users...');
    const users = [];
    for (let i = 0; i < 4; i++) {
      const page = await browser.newPage();
      await page.goto('http://localhost:3000/vote');
      await sleep(1500);
      users.push({ page, name: `User${i+1}` });
    }
    console.log('✅ Users created\n');
    
    // User 1 adds all movies
    console.log('3️⃣ Adding movies...');
    const movies = ['The Matrix', 'Inception', 'Interstellar', 'The Dark Knight'];
    
    for (const movie of movies) {
      await users[0].page.type('input[placeholder="Search for a movie..."]', movie);
      await sleep(3000);
      
      // Click search result
      await users[0].page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const movieBtn = buttons.find(b => b.querySelector('img'));
        if (movieBtn) movieBtn.click();
      });
      await sleep(1000);
      
      // Add to available movies
      await users[0].page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
        if (addBtn) addBtn.click();
      });
      await sleep(1500);
      
      // Clear search
      await users[0].page.click('input[placeholder="Search for a movie..."]', { clickCount: 3 });
      await users[0].page.keyboard.press('Backspace');
    }
    console.log('✅ Movies added\n');
    
    // Voting pattern to test IRV:
    // User1: Matrix, Inception
    // User2: Inception, Dark Knight  
    // User3: Interstellar, Inception
    // User4: Dark Knight, Inception
    // Expected: No majority first round, lowest (Interstellar) eliminated, Inception wins
    
    console.log('4️⃣ Users voting...');
    
    // User 1 votes
    console.log('  User1: Matrix > Inception');
    await users[0].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const matrix = addBtns.find(b => b.closest('div').textContent.includes('Matrix'));
      if (matrix) matrix.click();
    });
    await sleep(500);
    await users[0].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const inception = addBtns.find(b => b.closest('div').textContent.includes('Inception'));
      if (inception) inception.click();
    });
    await sleep(500);
    await users[0].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(2000);
    
    // User 2 votes
    console.log('  User2: Inception > Dark Knight');
    await users[1].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const inception = addBtns.find(b => b.closest('div').textContent.includes('Inception'));
      if (inception) inception.click();
    });
    await sleep(500);
    await users[1].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const dark = addBtns.find(b => b.closest('div').textContent.includes('Dark Knight'));
      if (dark) dark.click();
    });
    await sleep(500);
    await users[1].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(2000);
    
    // User 3 votes
    console.log('  User3: Interstellar > Inception');
    await users[2].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const inter = addBtns.find(b => b.closest('div').textContent.includes('Interstellar'));
      if (inter) inter.click();
    });
    await sleep(500);
    await users[2].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const inception = addBtns.find(b => b.closest('div').textContent.includes('Inception'));
      if (inception) inception.click();
    });
    await sleep(500);
    await users[2].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(2000);
    
    // User 4 votes
    console.log('  User4: Dark Knight > Inception');
    await users[3].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const dark = addBtns.find(b => b.closest('div').textContent.includes('Dark Knight'));
      if (dark) dark.click();
    });
    await sleep(500);
    await users[3].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const inception = addBtns.find(b => b.closest('div').textContent.includes('Inception'));
      if (inception) inception.click();
    });
    await sleep(500);
    await users[3].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(2000);
    console.log('✅ All votes submitted\n');
    
    // Check results
    console.log('5️⃣ Checking results...');
    await users[0].page.goto('http://localhost:3000/results');
    await sleep(3000);
    
    // Get winner
    const winner = await users[0].page.evaluate(() => {
      const winnerEl = Array.from(document.querySelectorAll('h2')).find(h => 
        h.textContent.includes('Winner:')
      );
      return winnerEl ? winnerEl.textContent.replace('🏆 Winner:', '').trim() : null;
    });
    
    // Get first round votes
    const firstRoundVotes = await users[0].page.evaluate(() => {
      const votes = {};
      const movieCards = document.querySelectorAll('div.bg-white');
      movieCards.forEach(card => {
        const title = card.querySelector('h3')?.textContent;
        const voteText = card.querySelector('p.text-sm')?.textContent;
        if (title && voteText) {
          const match = voteText.match(/(\d+) vote/);
          if (match) {
            votes[title.trim()] = parseInt(match[1]);
          }
        }
      });
      return votes;
    });
    
    // Check for elimination rounds
    await users[0].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const elim = buttons.find(b => b.textContent.includes('View Elimination Rounds'));
      if (elim) elim.click();
    });
    await sleep(1500);
    
    const eliminationInfo = await users[0].page.evaluate(() => {
      const rounds = [];
      const roundDivs = document.querySelectorAll('div.p-4.bg-neutral-100');
      roundDivs.forEach(div => {
        if (div.textContent.includes('Round')) {
          rounds.push(div.textContent);
        }
      });
      return rounds;
    });
    
    console.log('\n📊 Results:');
    console.log('First round votes:', firstRoundVotes);
    console.log('Winner:', winner);
    console.log('Elimination rounds:', eliminationInfo.length);
    
    console.log('\n✅ Expected outcome:');
    console.log('- First round: Matrix=1, Inception=1, Interstellar=1, Dark Knight=1');
    console.log('- No majority (need 3/4 votes)');
    console.log('- Lowest vote getter(s) eliminated');
    console.log('- Second preferences redistribute');
    console.log('- Inception should win with 3 votes after redistribution');
    
    console.log('\n🔍 Analysis:');
    if (winner === 'Inception') {
      console.log('✅ IRV algorithm working correctly!');
    } else {
      console.log('❌ IRV algorithm may have issues');
      console.log(`   Expected: Inception, Got: ${winner}`);
    }
    
    if (eliminationInfo.length > 0) {
      console.log('✅ Elimination rounds detected');
    } else {
      console.log('⚠️  No elimination rounds found');
    }
    
    // Test real-time update
    console.log('\n6️⃣ Testing real-time updates...');
    
    // User 2 adds a new movie
    await users[1].page.goto('http://localhost:3000/vote');
    await sleep(2000);
    
    const beforeCount = await users[2].page.evaluate(() => {
      return document.querySelectorAll('h3').length;
    });
    
    // Add movie
    await users[1].page.type('input[placeholder="Search for a movie..."]', 'Avatar');
    await sleep(3000);
    await users[1].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img'));
      if (movieBtn) movieBtn.click();
    });
    await sleep(1000);
    await users[1].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
      if (addBtn) addBtn.click();
    });
    
    // Wait for WebSocket
    await sleep(2000);
    
    const afterCount = await users[2].page.evaluate(() => {
      return document.querySelectorAll('h3').length;
    });
    
    console.log(`Movie count before: ${beforeCount}`);
    console.log(`Movie count after: ${afterCount}`);
    
    if (afterCount > beforeCount) {
      console.log('✅ Real-time updates working!');
    } else {
      console.log('❌ Real-time updates not working');
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    console.log('\n🔍 Browser will remain open for inspection.');
    console.log('Press Ctrl+C to close and exit.');
  }
}

runSimpleIRVTest();