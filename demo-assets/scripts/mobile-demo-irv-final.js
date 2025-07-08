const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runMobileIRVDemo() {
  console.log('🎬 NoSpoilers Mobile IRV Demo\n');

  const screenshots = [];
  let screenIndex = 0;
  let browser;

  try {
    const isHeadless = process.env.HEADLESS === 'true';
    browser = await puppeteer.launch({
      headless: isHeadless,
      slowMo: isHeadless ? 0 : 50,
      defaultViewport: { width: 390, height: 844 },
      args: ['--window-size=400,900', '--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log(`✅ Browser launched (${isHeadless ? 'headless' : 'visible'} mode)`);

    // User colors for identification
    const userColors = {
      Sarah: '#FF6B6B',
      Mike: '#4ECDC4',
      Emma: '#45B7D1',
      Alex: '#96CEB4'
    };

    async function captureScene(page, name, annotation, duration = 3000, userName = null) {
      if (annotation) {
        await page.evaluate((text, user, colors) => {
          // Remove any existing annotation
          const existing = document.getElementById('demo-annotation');
          if (existing) existing.remove();
          
          // Create bottom caption with dark background
          const overlay = document.createElement('div');
          overlay.id = 'demo-annotation';
          overlay.style.cssText = `
            position: fixed;
            bottom: 40px;
            left: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            font-size: 18px;
            font-weight: 600;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            text-align: center;
            line-height: 1.4;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
          `;
          
          if (user && colors[user]) {
            // Add user indicator
            const userBadge = document.createElement('div');
            userBadge.style.cssText = `
              position: absolute;
              top: -15px;
              left: 20px;
              background: ${colors[user]};
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 700;
              display: flex;
              align-items: center;
              gap: 6px;
            `;
            
            // Add person icon
            userBadge.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              ${user}
            `;
            overlay.appendChild(userBadge);
          }
          
          overlay.appendChild(document.createTextNode(text));
          document.body.appendChild(overlay);
        }, annotation, userName, userColors);
        await sleep(300);
      }

      const filename = `mobile_irv_${String(screenIndex++).padStart(3, '0')}_${name}.png`;
      await page.screenshot({ path: `./demo-frames/${filename}` });
      screenshots.push({ filename, duration });
      console.log(`📸 ${name}${userName ? ` (${userName})` : ''}`);

      if (annotation) {
        await page.evaluate(() => {
          const overlay = document.getElementById('demo-annotation');
          if (overlay) overlay.remove();
        });
      }
    }

    // Clear existing data
    console.log('📍 Clearing existing data...');
    const adminPage = await browser.newPage();
    await adminPage.goto('http://localhost:3000/admin?admin=admin123');
    await sleep(1500);
    try {
      await adminPage.type('input[type="text"]', 'admin');
      await adminPage.type('input[type="password"]', 'admin123');
      await adminPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const login = buttons.find(b => b.textContent.includes('Login'));
        if (login) login.click();
      });
      await sleep(2000);
      
      await adminPage.evaluate(() => {
        window.confirm = () => true;
        const buttons = Array.from(document.querySelectorAll('button'));
        const reset = buttons.find(b => b.textContent.includes('Delete Everything'));
        if (reset) reset.click();
      });
      await sleep(2000);
    } catch (e) {
      console.log('⚠️  Could not clear data');
    }
    await adminPage.close();
    console.log('✅ Ready to start\n');

    // Create user pages
    const sarah = await browser.newPage();
    const mike = await browser.newPage();
    const emma = await browser.newPage();
    const alex = await browser.newPage();

    // Scene 1: Landing
    console.log('📍 Scene 1: Introduction');
    await sarah.goto('http://localhost:3000');
    await sleep(2000);
    await captureScene(sarah, 'landing', 'NoSpoilers - Fair Movie Selection for Groups', 4000);

    // Scene 2: Sarah starts
    console.log('📍 Scene 2: Sarah starts movie night');
    await sarah.goto('http://localhost:3000/vote');
    await sleep(2000);
    await captureScene(sarah, 'sarah_starts', 'Sarah creates a movie night vote', 3000, 'Sarah');

    // Scene 3: Sarah adds first movie
    console.log('📍 Scene 3: Sarah adds movies');
    await sarah.type('input[placeholder="Search for a movie..."]', 'The Matrix');
    await sleep(3000);
    await captureScene(sarah, 'search_movies', 'Search movies from TMDB database', 3000, 'Sarah');
    
    // Click result and add
    await sarah.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img') || b.textContent.includes('(1999)'));
      if (movieBtn) movieBtn.click();
    });
    await sleep(1500);
    await sarah.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
      if (addBtn) addBtn.click();
    });
    await sleep(1500);
    
    // Add second movie
    await sarah.click('input[placeholder="Search for a movie..."]', { clickCount: 3 });
    await sarah.type('input[placeholder="Search for a movie..."]', 'Inception');
    await sleep(2500);
    await sarah.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img') || b.textContent.includes('(2010)'));
      if (movieBtn) movieBtn.click();
    });
    await sleep(1000);
    await sarah.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
      if (addBtn) addBtn.click();
    });
    await sleep(1500);
    await captureScene(sarah, 'sarah_movies', 'Sarah added 2 movies to vote on', 3000, 'Sarah');

    // Scene 4: Mike joins and sees movies
    console.log('📍 Scene 4: Mike joins');
    await mike.goto('http://localhost:3000/vote');
    await sleep(2000);
    await captureScene(mike, 'mike_sees', 'Mike instantly sees Sarah\'s movies!', 4000, 'Mike');

    // Mike adds a movie
    await mike.type('input[placeholder="Search for a movie..."]', 'Interstellar');
    await sleep(2500);
    await mike.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img') || b.textContent.includes('(2014)'));
      if (movieBtn) movieBtn.click();
    });
    await sleep(1000);
    await mike.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
      if (addBtn) addBtn.click();
    });
    await sleep(1500);
    await captureScene(mike, 'mike_adds', 'Mike adds his favorite movie', 3000, 'Mike');

    // Scene 5: Emma joins
    console.log('📍 Scene 5: Emma joins');
    await emma.goto('http://localhost:3000/vote');
    await sleep(2000);
    await captureScene(emma, 'emma_sees', 'Emma sees all 3 movies from others', 3500, 'Emma');
    
    // Emma adds movie
    await emma.type('input[placeholder="Search for a movie..."]', 'Parasite');
    await sleep(2500);
    await emma.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img') || b.textContent.includes('(2019)'));
      if (movieBtn) movieBtn.click();
    });
    await sleep(1000);
    await emma.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
      if (addBtn) addBtn.click();
    });
    await sleep(1500);

    // Scene 6: Everyone votes
    console.log('📍 Scene 6: Ranked Choice Voting');
    await sarah.reload();
    await sleep(2000);
    await captureScene(sarah, 'ready_to_vote', 'Now everyone ranks their favorites', 3500, 'Sarah');

    // Sarah votes by adding movies to ranking
    await sarah.evaluate(() => {
      // Find and click "Add to Ranking" buttons for movies
      const buttons = Array.from(document.querySelectorAll('button'));
      const addButtons = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      
      // Add Inception first
      const inceptionCard = addButtons.find(b => b.closest('div').textContent.includes('Inception'));
      if (inceptionCard) inceptionCard.click();
    });
    await sleep(800);
    
    await sarah.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addButtons = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      
      // Add Matrix second
      const matrixCard = addButtons.find(b => b.closest('div').textContent.includes('Matrix'));
      if (matrixCard) matrixCard.click();
    });
    await sleep(800);
    
    await sarah.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addButtons = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      
      // Add Parasite third
      const parasiteCard = addButtons.find(b => b.closest('div').textContent.includes('Parasite'));
      if (parasiteCard) parasiteCard.click();
    });
    await sleep(1000);
    await captureScene(sarah, 'sarah_ranked', 'Sarah ranked her top 3 choices', 3000, 'Sarah');
    
    await sarah.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(2000);

    // Mike votes
    console.log('📍 Mike voting...');
    await mike.reload();
    await sleep(1500);
    
    // Mike adds his rankings
    await mike.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addButtons = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      // Add Interstellar first
      const interstellar = addButtons.find(b => b.closest('div').textContent.includes('Interstellar'));
      if (interstellar) interstellar.click();
    });
    await sleep(500);
    await mike.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addButtons = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      // Add Inception second
      const inception = addButtons.find(b => b.closest('div').textContent.includes('Inception'));
      if (inception) inception.click();
    });
    await sleep(1000);
    
    await mike.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(1500);

    // Emma votes
    console.log('📍 Emma voting...');
    await emma.reload();
    await sleep(1500);
    
    // Emma's rankings
    await emma.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addButtons = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      // Add Parasite first
      const parasite = addButtons.find(b => b.closest('div').textContent.includes('Parasite'));
      if (parasite) parasite.click();
    });
    await sleep(500);
    await emma.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addButtons = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      // Add Inception second
      const inception = addButtons.find(b => b.closest('div').textContent.includes('Inception'));
      if (inception) inception.click();
    });
    await sleep(800);
    
    await emma.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(1500);

    // Alex votes quickly
    await alex.goto('http://localhost:3000/vote');
    await sleep(1500);
    
    // Alex adds just two movies
    await alex.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addButtons = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      // Add Matrix first
      const matrix = addButtons.find(b => b.closest('div').textContent.includes('Matrix'));
      if (matrix) matrix.click();
    });
    await sleep(500);
    await alex.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addButtons = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      // Add Interstellar second
      const interstellar = addButtons.find(b => b.closest('div').textContent.includes('Interstellar'));
      if (interstellar) interstellar.click();
    });
    await sleep(500);
    
    await alex.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(1500);

    // Scene 7: Results
    console.log('📍 Scene 7: Instant-Runoff Results');
    await sarah.goto('http://localhost:3000/results');
    await sleep(2500);
    await captureScene(sarah, 'results_live', '4 people voted - checking results...', 4000, 'Sarah');
    
    // Show IRV rounds
    await sarah.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const elim = buttons.find(b => b.textContent.includes('View Elimination Rounds'));
      if (elim) elim.click();
    });
    await sleep(2000);
    
    await sarah.evaluate(() => {
      const rounds = document.querySelector('div[class*="mt-4 space-y-4"]');
      if (rounds) rounds.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    await sleep(1500);
    
    await captureScene(sarah, 'irv_elimination', 'IRV eliminates lowest votes each round', 5000, 'Sarah');

    // Final winner
    await sarah.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    await sleep(1500);
    
    await captureScene(sarah, 'final_winner', 'Fair winner selected by ranked choice! 🎬', 4000);
    
    // Bonus: Show clear vote functionality
    console.log('📍 Bonus: Clear vote demo');
    await sarah.goto('http://localhost:3000/vote');
    await sleep(2000);
    
    // Should see "already voted" screen
    await captureScene(sarah, 'already_voted', 'Sarah can clear her vote to change it', 3000, 'Sarah');
    
    // Click clear vote
    await sarah.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const clearBtn = buttons.find(b => b.textContent.includes('Clear Vote'));
      if (clearBtn) clearBtn.click();
    });
    await sleep(2000);
    
    await captureScene(sarah, 'vote_cleared', 'Vote cleared - ready to vote again!', 3000, 'Sarah');

    console.log('\n✅ Demo complete!');

    // Create video
    console.log('\n🎥 Creating video...');
    
    let concatContent = screenshots.map(s => 
      `file '${path.resolve('./demo-frames', s.filename)}'\nduration ${s.duration / 1000}`
    ).join('\n');
    concatContent += `\nfile '${path.resolve('./demo-frames', screenshots[screenshots.length - 1].filename)}'`;
    
    await fs.writeFile('./demo-frames/concat_mobile_irv.txt', concatContent);
    
    const cmd = `ffmpeg -y -f concat -safe 0 -i "./demo-frames/concat_mobile_irv.txt" ` +
      `-vf "scale=390:844,fps=30" ` +
      `-c:v libx264 -pix_fmt yuv420p "./demo-frames/nospoilers_mobile_irv_final.mp4"`;
    
    await execPromise(cmd);
    console.log('✅ Video: nospoilers_mobile_irv_final.mp4');

    // 30-second version
    const totalDuration = screenshots.reduce((sum, s) => sum + s.duration, 0) / 1000;
    const speedFactor = totalDuration / 30;
    
    if (speedFactor > 1) {
      const cmd30 = `ffmpeg -y -i "./demo-frames/nospoilers_mobile_irv_final.mp4" ` +
        `-filter:v "setpts=${1/speedFactor}*PTS" -an "./demo-frames/nospoilers_mobile_irv_final_30sec.mp4"`;
      await execPromise(cmd30);
      console.log('✅ 30-sec: nospoilers_mobile_irv_final_30sec.mp4');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n✅ Done');
    }
  }
}

runMobileIRVDemo();