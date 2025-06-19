const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function runMobileDemo() {
  console.log('🎬 NoSpoilers Mobile Demo\n');

  // Mobile viewport settings
  const viewport = { width: 390, height: 844 }; // iPhone 14 Pro
  const screenshots = [];
  let screenIndex = 0;

  // Clean up old screenshots
  try {
    const files = await fs.readdir('./demo-frames');
    for (const file of files) {
      if (file.startsWith('mobile_') && file.endsWith('.png')) {
        await fs.unlink(path.join('./demo-frames', file));
      }
    }
  } catch (e) {}

  const browser = await puppeteer.launch({
    headless: process.env.HEADLESS !== 'false',
    slowMo: 100,
    args: ['--window-size=400,900']
  });

  async function captureScene(page, name, annotation, duration = 3000) {
    // Add annotation
    if (annotation) {
      await page.evaluate((text) => {
        const overlay = document.createElement('div');
        overlay.id = 'demo-annotation';
        overlay.style.cssText = `
          position: fixed;
          top: 20px;
          left: 20px;
          right: 20px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(139, 92, 246, 0.95) 100%);
          color: white;
          padding: 20px 24px;
          border-radius: 16px;
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 20px;
          font-weight: 600;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          text-align: center;
          line-height: 1.3;
        `;
        overlay.textContent = text;
        document.body.appendChild(overlay);
      }, annotation);
    }

    const filename = `mobile_${String(screenIndex++).padStart(3, '0')}_${name}.png`;
    await page.screenshot({ path: `./demo-frames/${filename}` });
    screenshots.push({ filename, duration });
    console.log(`📸 ${name}`);

    // Remove annotation
    if (annotation) {
      await page.evaluate(() => {
        const overlay = document.getElementById('demo-annotation');
        if (overlay) overlay.remove();
      });
    }

    await new Promise(r => setTimeout(r, 500));
  }

  async function addMovie(page, movie) {
    // Clear and type
    const input = await page.$('input[placeholder="Search for a movie..."]');
    await input.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await input.type(movie, { delay: 100 });
    
    // Wait for results
    await new Promise(r => setTimeout(r, 2000));
    
    // Click first result
    try {
      await page.waitForSelector('button[class*="hover:bg-neutral-100"]', { timeout: 3000 });
      await page.click('button[class*="hover:bg-neutral-100"]');
      await new Promise(r => setTimeout(r, 1000));
      
      // Click Add to Ranking
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addBtn = buttons.find(b => b.textContent.includes('Add to Ranking'));
        if (addBtn) addBtn.click();
      });
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      console.log(`⚠️  Could not add ${movie}`);
    }
  }

  try {
    // Create browser contexts for different users
    const sarahContext = await browser.createBrowserContext();
    const sarahPage = await sarahContext.newPage();
    await sarahPage.setViewport(viewport);

    const mikeContext = await browser.createBrowserContext();
    const mikePage = await mikeContext.newPage();
    await mikePage.setViewport(viewport);

    const anaContext = await browser.createBrowserContext();
    const anaPage = await anaContext.newPage();
    await anaPage.setViewport(viewport);

    // SCENE 1: Landing
    console.log('\n📍 Scene 1: Landing Page');
    await sarahPage.goto('http://localhost:3000');
    await new Promise(r => setTimeout(r, 2000));
    await captureScene(sarahPage, 'landing', 'Welcome to NoSpoilers!', 3500);

    // SCENE 2: Sarah starts
    console.log('\n📍 Scene 2: Sarah starts voting');
    await sarahPage.goto('http://localhost:3000/vote');
    await new Promise(r => setTimeout(r, 2000));
    await captureScene(sarahPage, 'sarah_empty', 'Sarah starts a new vote', 3000);

    // SCENE 3: Sarah adds movies
    console.log('\n📍 Scene 3: Sarah adds movies');
    await addMovie(sarahPage, 'Inception');
    await captureScene(sarahPage, 'sarah_inception', 'Sarah adds Inception', 3000);
    
    await addMovie(sarahPage, 'The Dark Knight');
    await captureScene(sarahPage, 'sarah_two_movies', 'Sarah added 2 movies', 3000);

    // SCENE 4: Mike sees Sarah's movies
    console.log('\n📍 Scene 4: Mike joins');
    await mikePage.goto('http://localhost:3000/vote');
    await new Promise(r => setTimeout(r, 2000));
    await captureScene(mikePage, 'mike_sees_movies', 'Mike sees Sarah\'s movies!', 4000);

    // Mike adds his movie
    await addMovie(mikePage, 'Interstellar');
    await captureScene(mikePage, 'mike_adds', 'Mike adds his favorite', 3000);

    // SCENE 5: Ana sees all movies
    console.log('\n📍 Scene 5: Ana joins');
    await anaPage.goto('http://localhost:3000/vote');
    await new Promise(r => setTimeout(r, 2000));
    await captureScene(anaPage, 'ana_sees_all', 'Ana sees everyone\'s movies', 4000);

    await addMovie(anaPage, 'Parasite');
    await captureScene(anaPage, 'ana_adds', '4 movies from 3 users!', 3500);

    // SCENE 6: Sarah votes
    console.log('\n📍 Scene 6: Voting');
    await sarahPage.reload();
    await new Promise(r => setTimeout(r, 2000));
    await captureScene(sarahPage, 'sarah_all_movies', 'Time to vote!', 3000);

    // Sarah clicks movies to rank them
    console.log('Sarah ranking movies...');
    const movies = ['Inception', 'Parasite', 'Interstellar'];
    for (const movie of movies) {
      await sarahPage.evaluate((title) => {
        const cards = Array.from(document.querySelectorAll('h3'));
        const card = cards.find(h => h.textContent.includes(title));
        if (card) card.closest('div[class*="border"]').click();
      }, movie);
      await new Promise(r => setTimeout(r, 800));
    }
    
    await captureScene(sarahPage, 'sarah_ranked', 'Sarah picks her top 3', 3000);

    // Submit
    await sarahPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await captureScene(sarahPage, 'sarah_voted', 'Vote submitted!', 3000);

    // Quick votes from Mike and Ana
    console.log('\n📍 Others voting...');
    await mikePage.reload();
    await anaPage.reload();
    await new Promise(r => setTimeout(r, 2000));

    // SCENE 7: Results
    console.log('\n📍 Scene 7: Results');
    await sarahPage.goto('http://localhost:3000/results');
    await new Promise(r => setTimeout(r, 2500));
    await captureScene(sarahPage, 'results', 'Live voting results!', 4000);

    // SCENE 8: Admin
    console.log('\n📍 Scene 8: Admin');
    const adminPage = await browser.newPage();
    await adminPage.setViewport(viewport);
    await adminPage.goto('http://localhost:3000/admin?admin=admin123');
    await new Promise(r => setTimeout(r, 1500));
    
    await adminPage.type('input[type="text"]', 'admin');
    await adminPage.type('input[type="password"]', 'admin123');
    await adminPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const login = buttons.find(b => b.textContent.includes('Login'));
      if (login) login.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await captureScene(adminPage, 'admin', 'Admin can reset votes', 3500);

    // Final
    await captureScene(sarahPage, 'final', 'Ready for movie night! 🍿', 4000);

    console.log('\n✅ Demo complete!');

    // Create video
    console.log('\n🎥 Creating video...');
    
    // Create concat file
    let concatContent = screenshots.map(s => 
      `file '${path.resolve('./demo-frames', s.filename)}'\nduration ${s.duration / 1000}`
    ).join('\n');
    concatContent += `\nfile '${path.resolve('./demo-frames', screenshots[screenshots.length - 1].filename)}'`;
    
    await fs.writeFile('./demo-frames/concat_mobile.txt', concatContent);
    
    // Generate video
    const cmd = `ffmpeg -y -f concat -safe 0 -i "./demo-frames/concat_mobile.txt" ` +
      `-vf "scale=390:844:force_original_aspect_ratio=decrease,pad=390:844:(ow-iw)/2:(oh-ih)/2,fps=30" ` +
      `-c:v libx264 -pix_fmt yuv420p -preset slow -crf 22 "./demo-frames/nospoilers_mobile_demo.mp4"`;
    
    await execPromise(cmd);
    console.log('✅ Video created: nospoilers_mobile_demo.mp4');

    // 30-second version
    const totalDuration = screenshots.reduce((sum, s) => sum + s.duration, 0) / 1000;
    const speedFactor = totalDuration / 30;
    
    if (speedFactor > 1) {
      const cmd30 = `ffmpeg -y -i "./demo-frames/nospoilers_mobile_demo.mp4" ` +
        `-filter:v "setpts=${1/speedFactor}*PTS" -an "./demo-frames/nospoilers_mobile_demo_30sec.mp4"`;
      await execPromise(cmd30);
      console.log('✅ 30-sec version: nospoilers_mobile_demo_30sec.mp4');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

// Run the demo
runMobileDemo();