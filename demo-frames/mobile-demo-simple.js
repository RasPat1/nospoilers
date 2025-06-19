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
  console.log('🎬 NoSpoilers Mobile Demo (Simple)\n');

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
            top: 20px;
            left: 20px;
            right: 20px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 20px 24px;
            border-radius: 16px;
            font-size: 20px;
            font-weight: 600;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.3;
          `;
          overlay.textContent = text;
          document.body.appendChild(overlay);
        }, annotation);
        await sleep(300);
      }

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

    // First, let's clear existing data via admin
    console.log('📍 Clearing existing data...');
    const adminPage = await browser.newPage();
    await adminPage.goto('http://localhost:3000/admin?admin=admin123');
    await sleep(1500);
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
    
    // Click the full reset button (delete everything)
    await adminPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const reset = buttons.find(b => b.textContent.includes('Delete Everything'));
      if (reset) reset.click();
    });
    await sleep(2000);
    await adminPage.close();
    console.log('✅ Data cleared\n');

    // Now start the demo
    const page = await browser.newPage();
    
    // Scene 1: Landing
    console.log('📍 Scene 1: Landing Page');
    await page.goto('http://localhost:3000');
    await sleep(2000);
    await captureScene(page, 'landing', 'Welcome to NoSpoilers!', 3500);

    // Scene 2: Vote page
    console.log('📍 Scene 2: Start Voting');
    await page.goto('http://localhost:3000/vote');
    await sleep(2000);
    await captureScene(page, 'empty_vote', 'Sarah starts a movie night', 3000);

    // Scene 3: Add movies manually
    console.log('📍 Scene 3: Sarah adds movies');
    
    // Type a movie name and wait
    await page.type('input[placeholder="Search for a movie..."]', 'Inception');
    await sleep(3000); // Give TMDB time to respond
    
    // Try to capture with search results visible
    await captureScene(page, 'search_results', 'Real-time movie search', 3000);
    
    // Look for any clickable result
    const hasResults = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieButtons = buttons.filter(b => {
        const text = b.textContent || '';
        return text.includes('(20') || b.querySelector('img'); // Year or has image
      });
      if (movieButtons.length > 0) {
        movieButtons[0].click();
        return true;
      }
      return false;
    });

    if (!hasResults) {
      console.log('⚠️  No search results, using manual add');
      // Click "Add anyway" button if no results
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addAnyway = buttons.find(b => b.textContent.includes('Add') && b.textContent.includes('anyway'));
        if (addAnyway) addAnyway.click();
      });
    }
    
    await sleep(1500);
    
    // Click Add to Ranking if movie details are shown
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
      if (addBtn) addBtn.click();
    });
    
    await sleep(1500);
    await captureScene(page, 'first_movie', 'First movie added!', 3000);

    // Add second movie
    await page.click('input[placeholder="Search for a movie..."]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[placeholder="Search for a movie..."]', 'The Dark Knight');
    await sleep(3000);
    
    // Try to click result or add anyway
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.textContent.includes('(2008)') || b.querySelector('img'));
      if (movieBtn) {
        movieBtn.click();
      } else {
        const addAnyway = buttons.find(b => b.textContent.includes('Add') && b.textContent.includes('anyway'));
        if (addAnyway) addAnyway.click();
      }
    });
    
    await sleep(1500);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
      if (addBtn) addBtn.click();
    });
    
    await sleep(1500);
    await captureScene(page, 'sarah_movies', 'Sarah added 2 movies', 3000);

    // Scene 4: Mike joins
    console.log('📍 Scene 4: Mike joins');
    const mikePage = await browser.newPage();
    await mikePage.goto('http://localhost:3000/vote');
    await sleep(2000);
    await captureScene(mikePage, 'mike_sees', 'Mike sees Sarah\'s movies!', 4000);

    // Mike adds a movie
    await mikePage.type('input[placeholder="Search for a movie..."]', 'Interstellar');
    await sleep(3000);
    await mikePage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.textContent.includes('(2014)') || b.querySelector('img'));
      if (movieBtn) {
        movieBtn.click();
      } else {
        const addAnyway = buttons.find(b => b.textContent.includes('Add') && b.textContent.includes('anyway'));
        if (addAnyway) addAnyway.click();
      }
    });
    await sleep(1500);
    await mikePage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
      if (addBtn) addBtn.click();
    });
    await sleep(1500);
    await captureScene(mikePage, 'mike_adds', 'Mike adds his favorite', 3000);

    // Scene 5: Ana joins
    console.log('📍 Scene 5: Ana joins');
    const anaPage = await browser.newPage();
    await anaPage.goto('http://localhost:3000/vote');
    await sleep(2000);
    await captureScene(anaPage, 'ana_sees_all', 'Ana sees everyone\'s choices', 4000);

    // Scene 6: Voting
    console.log('📍 Scene 6: Voting time');
    await page.reload();
    await sleep(2000);
    await captureScene(page, 'ready_to_vote', 'Time to rank favorites!', 3000);

    // Sarah clicks movies to rank
    const movies = ['Inception', 'Interstellar'];
    for (const movie of movies) {
      await page.evaluate((title) => {
        const elements = Array.from(document.querySelectorAll('h3'));
        const movieEl = elements.find(el => el.textContent.includes(title));
        if (movieEl) {
          const card = movieEl.closest('div[class*="border"]');
          if (card) card.click();
        }
      }, movie);
      await sleep(1000);
    }
    
    await captureScene(page, 'sarah_ranked', 'Sarah ranked her top picks', 3000);

    // Submit
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(2000);
    await captureScene(page, 'voted', 'Vote submitted!', 3000);

    // Mike votes
    await mikePage.reload();
    await sleep(1500);
    await mikePage.evaluate(() => {
      // Click first available movie
      const cards = document.querySelectorAll('div[class*="border-2"]');
      if (cards[0]) cards[0].click();
    });
    await sleep(800);
    await mikePage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });

    // Scene 7: Results
    console.log('📍 Scene 7: Results');
    await page.goto('http://localhost:3000/results');
    await sleep(2500);
    await captureScene(page, 'results', 'Live voting results!', 4000);

    // Final
    await captureScene(page, 'final', 'Movie night democracy! 🍿', 4000);

    console.log('\n✅ Demo complete!');

    // Create video
    console.log('\n🎥 Creating video...');
    
    let concatContent = screenshots.map(s => 
      `file '${path.resolve('./demo-frames', s.filename)}'\nduration ${s.duration / 1000}`
    ).join('\n');
    concatContent += `\nfile '${path.resolve('./demo-frames', screenshots[screenshots.length - 1].filename)}'`;
    
    await fs.writeFile('./demo-frames/concat_mobile.txt', concatContent);
    
    const cmd = `ffmpeg -y -f concat -safe 0 -i "./demo-frames/concat_mobile.txt" ` +
      `-vf "scale=390:844,fps=30" ` +
      `-c:v libx264 -pix_fmt yuv420p "./demo-frames/nospoilers_mobile_demo.mp4"`;
    
    await execPromise(cmd);
    console.log('✅ Video: nospoilers_mobile_demo.mp4');

    // 30-second version
    const totalDuration = screenshots.reduce((sum, s) => sum + s.duration, 0) / 1000;
    const speedFactor = totalDuration / 30;
    
    if (speedFactor > 1) {
      const cmd30 = `ffmpeg -y -i "./demo-frames/nospoilers_mobile_demo.mp4" ` +
        `-filter:v "setpts=${1/speedFactor}*PTS" -an "./demo-frames/nospoilers_mobile_demo_30sec.mp4"`;
      await execPromise(cmd30);
      console.log('✅ 30-sec: nospoilers_mobile_demo_30sec.mp4');
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

runMobileDemo();