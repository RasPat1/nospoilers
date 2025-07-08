const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runIRVDemo() {
  console.log('🎬 NoSpoilers IRV Feature Demo\n');

  const screenshots = [];
  let screenIndex = 0;
  let browser;

  try {
    const isHeadless = process.env.HEADLESS === 'true';
    browser = await puppeteer.launch({
      headless: isHeadless,
      slowMo: isHeadless ? 0 : 50,
      args: ['--window-size=1280,900', '--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log(`✅ Browser launched (${isHeadless ? 'headless' : 'visible'} mode)`);

    async function captureScene(page, name, annotation, duration = 3000) {
      if (annotation) {
        await page.evaluate((text) => {
          // Remove any existing annotation
          const existing = document.getElementById('demo-annotation');
          if (existing) existing.remove();
          
          const overlay = document.createElement('div');
          overlay.id = 'demo-annotation';
          overlay.style.cssText = `
            position: fixed;
            top: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 20px 40px;
            border-radius: 16px;
            font-size: 24px;
            font-weight: 600;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            text-align: center;
            line-height: 1.4;
          `;
          overlay.textContent = text;
          document.body.appendChild(overlay);
        }, annotation);
        await sleep(300);
      }

      const filename = `irv_${String(screenIndex++).padStart(3, '0')}_${name}.png`;
      await page.screenshot({ path: `./demo-frames/${filename}` });
      screenshots.push({ filename, duration });
      console.log(`📸 ${name}`);

      if (annotation) {
        await page.evaluate(() => {
          const overlay = document.getElementById('demo-annotation');
          if (overlay) overlay.remove();
        });
      }
    }

    // First, clear existing data via admin
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
      
      // Override confirm dialog for reset
      await adminPage.evaluate(() => {
        window.confirm = () => true;
      });
      
      // Click the full reset button
      await adminPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const reset = buttons.find(b => b.textContent.includes('Delete Everything'));
        if (reset) reset.click();
      });
      await sleep(2000);
    } catch (e) {
      console.log('⚠️  Could not clear data, continuing anyway');
    }
    await adminPage.close();
    console.log('✅ Ready to start demo\n');

    // Create user pages
    const sarah = await browser.newPage();
    const mike = await browser.newPage();
    const emma = await browser.newPage();
    const alex = await browser.newPage();

    // Scene 1: Landing
    console.log('📍 Scene 1: Introduction');
    await sarah.goto('http://localhost:3000');
    await sleep(2000);
    await captureScene(sarah, 'landing', 'NoSpoilers: Fair Movie Selection with IRV', 4000);

    // Scene 2: Sarah starts voting
    console.log('📍 Scene 2: Starting the vote');
    await sarah.goto('http://localhost:3000/vote');
    await sleep(2000);
    await captureScene(sarah, 'empty_vote', 'Sarah starts adding movies', 3000);

    // Scene 3: Sarah adds movies
    console.log('📍 Scene 3: Adding movies');
    
    // Add first movie
    await sarah.type('input[placeholder="Search for a movie..."]', 'The Matrix');
    await sleep(3000);
    await captureScene(sarah, 'search_results', 'Real-time TMDB search', 3000);
    
    // Click first result
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

    // Scene 4: Mike sees the movie instantly
    console.log('📍 Scene 4: Real-time sharing');
    await mike.goto('http://localhost:3000/vote');
    await sleep(2000);
    await captureScene(mike, 'mike_sees_movie', 'Mike instantly sees Sarah\'s movie!', 4000);

    // Add more movies quickly
    console.log('📍 Adding more movies...');
    
    // Sarah adds Inception
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
    await sleep(1000);

    // Mike adds movies
    await mike.click('input[placeholder="Search for a movie..."]', { clickCount: 3 });
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
    await sleep(1000);

    // Emma joins and adds
    await emma.goto('http://localhost:3000/vote');
    await sleep(1500);
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

    // Scene 5: Everyone votes
    console.log('📍 Scene 5: Ranked voting');
    await sarah.reload();
    await sleep(2000);
    await captureScene(sarah, 'all_movies', 'Time to rank the movies!', 3500);

    // Sarah votes: 1. Inception, 2. Matrix
    await sarah.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div[class*="border-2"]'));
      const inception = cards.find(c => c.textContent.includes('Inception'));
      if (inception) inception.click();
    });
    await sleep(800);
    await sarah.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div[class*="border-2"]'));
      const matrix = cards.find(c => c.textContent.includes('Matrix'));
      if (matrix) matrix.click();
    });
    await sleep(1000);
    await captureScene(sarah, 'sarah_ranked', 'Sarah submits her rankings', 3000);
    
    await sarah.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(1500);

    // Mike votes: 1. Interstellar, 2. Inception
    await mike.reload();
    await sleep(1500);
    await mike.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div[class*="border-2"]'));
      const inter = cards.find(c => c.textContent.includes('Interstellar'));
      if (inter) inter.click();
    });
    await sleep(800);
    await mike.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div[class*="border-2"]'));
      const incep = cards.find(c => c.textContent.includes('Inception'));
      if (incep) incep.click();
    });
    await sleep(800);
    await mike.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(1500);

    // Emma votes: 1. Parasite, 2. Matrix
    await emma.reload();
    await sleep(1500);
    await emma.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div[class*="border-2"]'));
      const para = cards.find(c => c.textContent.includes('Parasite'));
      if (para) para.click();
    });
    await sleep(800);
    await emma.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div[class*="border-2"]'));
      const matrix = cards.find(c => c.textContent.includes('Matrix'));
      if (matrix) matrix.click();
    });
    await sleep(800);
    await emma.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(1500);

    // Alex joins late and votes
    await alex.goto('http://localhost:3000/vote');
    await sleep(1500);
    await alex.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div[class*="border-2"]'));
      const matrix = cards.find(c => c.textContent.includes('Matrix'));
      if (matrix) matrix.click();
    });
    await sleep(800);
    await alex.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div[class*="border-2"]'));
      const inter = cards.find(c => c.textContent.includes('Interstellar'));
      if (inter) inter.click();
    });
    await sleep(800);
    await alex.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(1500);

    // Scene 6: Results with IRV
    console.log('📍 Scene 6: IRV Results');
    await sarah.goto('http://localhost:3000/results');
    await sleep(2500);
    await captureScene(sarah, 'results_initial', 'Live results - no majority yet!', 4000);

    // Open elimination rounds
    await sarah.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const elim = buttons.find(b => b.textContent.includes('View Elimination Rounds'));
      if (elim) elim.click();
    });
    await sleep(2000);
    
    // Scroll to show rounds
    await sarah.evaluate(() => {
      const rounds = document.querySelector('div[class*="mt-4 space-y-4"]');
      if (rounds) rounds.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    await sleep(1500);
    
    await captureScene(sarah, 'elimination_rounds', 'IRV eliminates lowest votes each round', 5000);

    // Show winner
    await sarah.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    await sleep(1500);
    
    await captureScene(sarah, 'final_winner', 'Fair winner by ranked choice voting! 🎬', 4000);

    console.log('\n✅ Demo complete!');

    // Create video
    console.log('\n🎥 Creating video...');
    
    let concatContent = screenshots.map(s => 
      `file '${path.resolve('./demo-frames', s.filename)}'\nduration ${s.duration / 1000}`
    ).join('\n');
    concatContent += `\nfile '${path.resolve('./demo-frames', screenshots[screenshots.length - 1].filename)}'`;
    
    await fs.writeFile('./demo-frames/concat_irv.txt', concatContent);
    
    const cmd = `ffmpeg -y -f concat -safe 0 -i "./demo-frames/concat_irv.txt" ` +
      `-vf "scale=1280:800:force_original_aspect_ratio=decrease,pad=1280:800:(ow-iw)/2:(oh-ih)/2,fps=30" ` +
      `-c:v libx264 -pix_fmt yuv420p "./demo-frames/nospoilers_irv_demo.mp4"`;
    
    await execPromise(cmd);
    console.log('✅ Video: nospoilers_irv_demo.mp4');

    // 60-second version
    const totalDuration = screenshots.reduce((sum, s) => sum + s.duration, 0) / 1000;
    const speedFactor = totalDuration / 60;
    
    if (speedFactor > 1) {
      const cmd60 = `ffmpeg -y -i "./demo-frames/nospoilers_irv_demo.mp4" ` +
        `-filter:v "setpts=${1/speedFactor}*PTS" -an "./demo-frames/nospoilers_irv_demo_60sec.mp4"`;
      await execPromise(cmd60);
      console.log('✅ 60-sec: nospoilers_irv_demo_60sec.mp4');
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

runIRVDemo();