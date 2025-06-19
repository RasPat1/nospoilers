const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runMobileDemo() {
  console.log('🎬 NoSpoilers Mobile Demo\n');

  const screenshots = [];
  let screenIndex = 0;
  let browser;

  try {
    // Launch browser with mobile viewport
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      slowMo: 50,
      defaultViewport: { width: 390, height: 844 },
      args: ['--window-size=400,900', '--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log('✅ Browser launched');

    // Helper to capture scene with annotation
    async function captureScene(page, name, annotation, duration = 3000) {
      if (annotation) {
        await page.addStyleTag({
          content: `
            #demo-annotation {
              position: fixed !important;
              top: 20px !important;
              left: 20px !important;
              right: 20px !important;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
              color: white !important;
              padding: 16px 20px !important;
              border-radius: 12px !important;
              font-size: 18px !important;
              font-weight: 600 !important;
              text-align: center !important;
              box-shadow: 0 8px 20px rgba(0,0,0,0.25) !important;
              z-index: 999999 !important;
              font-family: -apple-system, BlinkMacSystemFont, sans-serif !important;
            }
          `
        });
        
        await page.evaluate((text) => {
          const existing = document.getElementById('demo-annotation');
          if (existing) existing.remove();
          
          const overlay = document.createElement('div');
          overlay.id = 'demo-annotation';
          overlay.textContent = text;
          document.body.appendChild(overlay);
        }, annotation);
      }

      await sleep(200); // Let annotation render
      
      const filename = `mobile_${String(screenIndex++).padStart(3, '0')}_${name}.png`;
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

    // Create page
    const page = await browser.newPage();
    
    // Scene 1: Landing
    console.log('\n📍 Scene 1: Landing Page');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await sleep(1500);
    await captureScene(page, 'landing', 'Welcome to NoSpoilers!', 3500);

    // Scene 2: Vote page empty
    console.log('\n📍 Scene 2: Starting Fresh');
    await page.goto('http://localhost:3000/vote', { waitUntil: 'networkidle2' });
    await sleep(1500);
    await captureScene(page, 'vote_empty', 'Sarah starts a new vote', 3000);

    // Scene 3: Sarah adds first movie
    console.log('\n📍 Scene 3: Adding Movies');
    await page.type('input[placeholder="Search for a movie..."]', 'Inception', { delay: 100 });
    await sleep(2000);
    await captureScene(page, 'search_inception', 'Searching movies...', 2500);
    
    // Wait for and click first result
    try {
      await page.waitForSelector('button[class*="hover:bg-neutral-100"]', { timeout: 5000 });
      await page.click('button[class*="hover:bg-neutral-100"]');
      await sleep(1000);
    } catch (e) {
      console.log('⚠️  No search results found');
      return;
    }
    
    // Click Add to Ranking
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Add to Ranking'));
      if (btn) btn.click();
    });
    await sleep(1500);
    await captureScene(page, 'first_movie', 'First movie added by Sarah', 3000);

    // Add second movie
    await page.click('input[placeholder="Search for a movie..."]', { clickCount: 3 });
    await page.type('input[placeholder="Search for a movie..."]', 'Dark Knight', { delay: 100 });
    await sleep(2000);
    await page.waitForSelector('button[class*="hover:bg-neutral-100"]', { timeout: 5000 });
    await page.click('button[class*="hover:bg-neutral-100"]');
    await sleep(1000);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Add to Ranking'));
      if (btn) btn.click();
    });
    await sleep(1500);
    await captureScene(page, 'sarah_two', 'Sarah added 2 movies', 3000);

    // Scene 4: Mike's view
    console.log('\n📍 Scene 4: Mike Joins');
    const page2 = await browser.newPage();
    await page2.goto('http://localhost:3000/vote', { waitUntil: 'networkidle2' });
    await sleep(2000);
    await captureScene(page2, 'mike_view', 'Mike sees Sarah\'s movies!', 4000);

    // Mike adds movie
    await page2.type('input[placeholder="Search for a movie..."]', 'Interstellar', { delay: 100 });
    await sleep(2000);
    await page2.waitForSelector('button[class*="hover:bg-neutral-100"]', { timeout: 5000 });
    await page2.click('button[class*="hover:bg-neutral-100"]');
    await sleep(1000);
    await page2.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Add to Ranking'));
      if (btn) btn.click();
    });
    await sleep(1500);
    await captureScene(page2, 'mike_adds', 'Mike adds his choice', 3000);

    // Scene 5: Everyone votes
    console.log('\n📍 Scene 5: Voting Time');
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(2000);
    await captureScene(page, 'all_movies', 'Everyone can vote on all movies!', 3500);

    // Sarah votes
    const moviesToRank = ['Inception', 'Interstellar'];
    for (const movie of moviesToRank) {
      await page.evaluate((title) => {
        const cards = Array.from(document.querySelectorAll('h3'));
        const card = cards.find(h => h.textContent.includes(title));
        if (card) {
          const movieCard = card.closest('div[class*="border"]');
          if (movieCard) movieCard.click();
        }
      }, movie);
      await sleep(800);
    }
    
    await captureScene(page, 'sarah_ranked', 'Sarah picks her favorites', 3000);

    // Submit vote
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(2000);
    await captureScene(page, 'voted', 'Vote submitted!', 3000);

    // Scene 6: Results
    console.log('\n📍 Scene 6: Results');
    await page.goto('http://localhost:3000/results', { waitUntil: 'networkidle2' });
    await sleep(2500);
    await captureScene(page, 'results', 'Live results update!', 4000);

    // Scene 7: Admin
    console.log('\n📍 Scene 7: Admin Panel');
    await page.goto('http://localhost:3000/admin?admin=admin123', { waitUntil: 'networkidle2' });
    await sleep(1500);
    await page.type('input[type="text"]', 'admin', { delay: 100 });
    await page.type('input[type="password"]', 'admin123', { delay: 100 });
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const login = buttons.find(b => b.textContent.includes('Login'));
      if (login) login.click();
    });
    await sleep(2000);
    await captureScene(page, 'admin', 'Admin controls', 3500);

    // Final scene
    await captureScene(page, 'final', 'Movie night ready! 🍿', 4000);

    console.log('\n✅ Screenshots captured!');

    // Create video
    console.log('\n🎥 Creating video...');
    
    // Clean up old mobile screenshots first
    const files = await fs.readdir('./demo-frames');
    for (const file of files) {
      if (file.startsWith('mobile_') && file.endsWith('.png')) {
        // Keep only the ones we just created
        if (!screenshots.some(s => s.filename === file)) {
          await fs.unlink(path.join('./demo-frames', file));
        }
      }
    }
    
    // Create concat file
    let concatContent = screenshots.map(s => 
      `file '${path.resolve('./demo-frames', s.filename)}'\nduration ${s.duration / 1000}`
    ).join('\n');
    concatContent += `\nfile '${path.resolve('./demo-frames', screenshots[screenshots.length - 1].filename)}'`;
    
    await fs.writeFile('./demo-frames/concat_mobile_final.txt', concatContent);
    
    // Generate video with mobile aspect ratio
    const cmd = `ffmpeg -y -f concat -safe 0 -i "./demo-frames/concat_mobile_final.txt" ` +
      `-vf "scale=390:844,fps=30" ` +
      `-c:v libx264 -pix_fmt yuv420p -preset medium -crf 23 "./demo-frames/nospoilers_mobile_demo.mp4"`;
    
    await execPromise(cmd);
    console.log('✅ Video created: nospoilers_mobile_demo.mp4');

    // Create 30-second version
    const totalDuration = screenshots.reduce((sum, s) => sum + s.duration, 0) / 1000;
    const speedFactor = Math.max(1, totalDuration / 30);
    
    const cmd30 = `ffmpeg -y -i "./demo-frames/nospoilers_mobile_demo.mp4" ` +
      `-filter:v "setpts=${1/speedFactor}*PTS" -an "./demo-frames/nospoilers_mobile_demo_30sec.mp4"`;
    
    await execPromise(cmd30);
    console.log('✅ 30-second version: nospoilers_mobile_demo_30sec.mp4');

    console.log(`\n📊 Summary:`);
    console.log(`- Screenshots: ${screenshots.length}`);
    console.log(`- Full video: nospoilers_mobile_demo.mp4`);
    console.log(`- Short video: nospoilers_mobile_demo_30sec.mp4`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n✅ Browser closed');
    }
  }
}

// Run it
runMobileDemo();