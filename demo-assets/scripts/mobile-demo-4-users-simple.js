const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run4UserDemoSimple() {
  console.log('🎬 NoSpoilers 4-User Side-by-Side Demo (Simplified)\n');

  const screenshots = [];
  let screenIndex = 0;
  let browser;

  try {
    const isHeadless = process.env.HEADLESS === 'true';
    browser = await puppeteer.launch({
      headless: isHeadless,
      slowMo: 0,
      defaultViewport: { width: 390, height: 844 },
      args: ['--window-size=400,900', '--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log(`✅ Browser launched (${isHeadless ? 'headless' : 'visible'} mode)`);

    // User colors
    const userColors = {
      Sarah: '#FF6B6B',
      Mike: '#4ECDC4',
      Emma: '#45B7D1',
      Alex: '#96CEB4'
    };

    async function addUserBadge(page, userName, color) {
      await page.evaluate((data) => {
        const badge = document.createElement('div');
        badge.id = 'user-badge';
        badge.style.cssText = `
          position: fixed;
          top: 10px;
          left: 10px;
          right: 10px;
          background: ${data.color};
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 16px;
          font-weight: 700;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        `;
        
        badge.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          ${data.user}
        `;
        document.body.appendChild(badge);
      }, { user: userName, color });
    }

    async function captureComposite(pages, name, caption, duration = 3000) {
      // Take screenshots
      const files = [];
      for (let i = 0; i < 4; i++) {
        const filename = `temp_${i}.png`;
        await pages[i].screenshot({ path: `./demo-frames/${filename}` });
        files.push(filename);
      }

      // Create composite
      const outputFile = `composite_${String(screenIndex++).padStart(3, '0')}_${name}.png`;
      
      // Add caption if provided
      let filterComplex = '[0:v][1:v][2:v][3:v]hstack=inputs=4[stacked]';
      if (caption) {
        filterComplex += `;[stacked]drawtext=text='${caption}':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=48:fontcolor=white:box=1:boxcolor=black@0.7:boxborderw=20:x=(w-text_w)/2:y=h-120[final]`;
      } else {
        filterComplex += '[final]';
      }
      
      const cmd = `ffmpeg -y -i ./demo-frames/${files[0]} -i ./demo-frames/${files[1]} -i ./demo-frames/${files[2]} -i ./demo-frames/${files[3]} ` +
        `-filter_complex "${filterComplex}" -map "[final]" ` +
        `./demo-frames/${outputFile}`;
      
      await execPromise(cmd);
      
      // Cleanup
      for (const file of files) {
        await fs.unlink(`./demo-frames/${file}`);
      }
      
      screenshots.push({ filename: outputFile, duration });
      console.log(`📸 ${name}: ${caption || ''}`);
    }

    // Clear data
    console.log('📍 Clearing data...');
    const admin = await browser.newPage();
    await admin.goto('http://localhost:3000/admin?admin=admin123');
    await sleep(1000);
    await admin.type('input[type="text"]', 'admin');
    await admin.type('input[type="password"]', 'admin123');
    await admin.click('button');
    await sleep(1500);
    await admin.evaluate(() => {
      window.confirm = () => true;
      const buttons = Array.from(document.querySelectorAll('button'));
      const reset = buttons.find(b => b.textContent.includes('Delete Everything'));
      if (reset) reset.click();
    });
    await sleep(1500);
    await admin.close();

    // Create users
    const sarah = await browser.newPage();
    const mike = await browser.newPage();
    const emma = await browser.newPage();
    const alex = await browser.newPage();
    const pages = [sarah, mike, emma, alex];
    const names = ['Sarah', 'Mike', 'Emma', 'Alex'];

    // Setup badges and go to vote page
    for (let i = 0; i < 4; i++) {
      await pages[i].goto('http://localhost:3000/vote');
      await addUserBadge(pages[i], names[i], userColors[names[i]]);
    }
    await sleep(1000);

    // Scene 1: Everyone ready
    await captureComposite(pages, 'start', '4 friends planning movie night', 3000);

    // Scene 2: Sarah adds Matrix
    await sarah.type('input[placeholder="Search for a movie..."]', 'The Matrix');
    await sleep(2000);
    await sarah.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movie = buttons.find(b => b.querySelector('img'));
      if (movie) movie.click();
    });
    await sleep(800);
    await sarah.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const add = buttons.find(b => b.textContent === 'Add to Ranking');
      if (add) add.click();
    });
    await sleep(1000);
    
    await captureComposite(pages, 'matrix_added', 'Sarah adds Matrix - everyone sees it instantly!', 4000);

    // Scene 3: Mike adds Interstellar
    await mike.type('input[placeholder="Search for a movie..."]', 'Interstellar');
    await sleep(2000);
    await mike.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movie = buttons.find(b => b.querySelector('img'));
      if (movie) movie.click();
    });
    await sleep(800);
    await mike.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const add = buttons.find(b => b.textContent === 'Add to Ranking');
      if (add) add.click();
    });
    await sleep(1000);
    
    await captureComposite(pages, 'interstellar_added', 'Mike adds Interstellar - real-time sync!', 3500);

    // Scene 4: Sarah votes first
    await sarah.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      if (addBtns[0]) addBtns[0].click();
      setTimeout(() => { if (addBtns[1]) addBtns[1].click(); }, 500);
    });
    await sleep(1000);
    await sarah.evaluate(() => {
      const submit = document.querySelector('button');
      if (submit) submit.click();
    });
    await sleep(1500);
    
    // Sarah goes to results
    await sarah.goto('http://localhost:3000/results');
    await sleep(1500);
    
    await captureComposite(pages, 'sarah_voted', 'Sarah voted - watching live results', 3500);

    // Scene 5: Mike votes
    await mike.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      if (addBtns[1]) addBtns[1].click();
    });
    await sleep(800);
    await mike.evaluate(() => {
      const submit = document.querySelector('button');
      if (submit) submit.click();
    });
    await sleep(1500);
    
    await captureComposite(pages, 'mike_voted', 'Mike votes - Sarah sees update instantly!', 4000);

    // Scene 6: Everyone on results
    await mike.goto('http://localhost:3000/results');
    await emma.goto('http://localhost:3000/results');
    await alex.goto('http://localhost:3000/results');
    await sleep(1500);
    
    await captureComposite(pages, 'all_results', 'Fair winner by ranked choice voting!', 4000);

    console.log('\n✅ Demo captured!');

    // Create video
    console.log('\n🎥 Creating video...');
    
    let concatContent = screenshots.map(s => 
      `file '${path.resolve('./demo-frames', s.filename)}'\nduration ${s.duration / 1000}`
    ).join('\n');
    concatContent += `\nfile '${path.resolve('./demo-frames', screenshots[screenshots.length - 1].filename)}'`;
    
    await fs.writeFile('./demo-frames/concat_4users_simple.txt', concatContent);
    
    const cmd = `ffmpeg -y -f concat -safe 0 -i "./demo-frames/concat_4users_simple.txt" ` +
      `-vf "scale=1560:844,fps=30" ` +
      `-c:v libx264 -pix_fmt yuv420p "./demo-frames/nospoilers_4users_simple.mp4"`;
    
    await execPromise(cmd);
    console.log('✅ Video: nospoilers_4users_simple.mp4');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n✅ Done');
    }
  }
}

run4UserDemoSimple();