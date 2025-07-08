const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runRealtime2x2Demo() {
  console.log('🎬 NoSpoilers Real-time 2x2 Demo\n');

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

    // User colors - subtle
    const userColors = {
      Sarah: 'rgba(255, 107, 107, 0.9)',
      Mike: 'rgba(78, 205, 196, 0.9)',
      Emma: 'rgba(69, 183, 209, 0.9)',
      Alex: 'rgba(150, 206, 180, 0.9)'
    };

    async function addSubtleUserBadge(page, userName, color) {
      await page.evaluate((data) => {
        const badge = document.createElement('div');
        badge.id = 'user-badge';
        badge.style.cssText = `
          position: fixed;
          top: 60px;
          right: 10px;
          background: ${data.color};
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        `;
        badge.textContent = data.user;
        document.body.appendChild(badge);
      }, { user: userName, color });
    }

    async function addHighlight(page, text, isAction = false) {
      await page.evaluate((data) => {
        const existing = document.getElementById('action-highlight');
        if (existing) existing.remove();
        
        if (data.text) {
          const indicator = document.createElement('div');
          indicator.id = 'action-highlight';
          indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 10px;
            right: 10px;
            background: ${data.isAction ? 'rgba(34, 197, 94, 0.9)' : 'rgba(0, 0, 0, 0.8)'};
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            text-align: center;
            backdrop-filter: blur(10px);
          `;
          indicator.textContent = data.text;
          document.body.appendChild(indicator);
        }
      }, { text, isAction });
    }

    async function capture2x2(pages, name, caption, duration = 3000) {
      await sleep(300);

      // Take screenshots
      const files = [];
      for (let i = 0; i < 4; i++) {
        const filename = `temp_${i}.png`;
        await pages[i].screenshot({ path: `./demo-frames/${filename}` });
        files.push(filename);
      }

      // Create 2x2 grid with padding
      const outputFile = `realtime_${String(screenIndex++).padStart(3, '0')}_${name}.png`;
      
      const cmd = `ffmpeg -y -i ./demo-frames/${files[0]} -i ./demo-frames/${files[1]} -i ./demo-frames/${files[2]} -i ./demo-frames/${files[3]} ` +
        `-filter_complex "[0:v]pad=800:880:5:5:black[p0];[1:v]pad=800:880:405:5:black[p1];[2:v]pad=800:880:5:439:black[p2];[3:v]pad=800:880:405:439:black[p3];[p0][p1]hstack=inputs=2[top];[p2][p3]hstack=inputs=2[bottom];[top][bottom]vstack=inputs=2[grid]" ` +
        `-map "[grid]" ./demo-frames/${outputFile}`;
      
      await execPromise(cmd);
      
      // Add caption if provided
      if (caption) {
        const captionedFile = `realtime_captioned_${screenIndex - 1}.png`;
        const captionCmd = `ffmpeg -y -i ./demo-frames/${outputFile} ` +
          `-vf "drawtext=text='${caption}':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=36:fontcolor=white:box=1:boxcolor=black@0.8:boxborderw=20:x=(w-text_w)/2:y=h-80" ` +
          `./demo-frames/${captionedFile}`;
        
        try {
          await execPromise(captionCmd);
          await fs.unlink(`./demo-frames/${outputFile}`);
          screenshots.push({ filename: captionedFile, duration });
        } catch (e) {
          screenshots.push({ filename: outputFile, duration });
        }
      } else {
        screenshots.push({ filename: outputFile, duration });
      }
      
      // Cleanup
      for (const file of files) {
        await fs.unlink(`./demo-frames/${file}`);
      }
      
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

    // Setup pages
    for (let i = 0; i < 4; i++) {
      await pages[i].goto('http://localhost:3000/vote');
      await addSubtleUserBadge(pages[i], names[i], userColors[names[i]]);
    }
    await sleep(2000); // Give SSE time to connect

    // Scene 1: Start
    await capture2x2(pages, 'start', 'Real-time movie selection', 3000);

    // Scene 2: Sarah adds Matrix - instantly appears for all
    await addHighlight(sarah, 'Adding movie...', true);
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
    
    // Wait a moment for SSE to propagate
    await sleep(1500);
    
    // Add highlights showing real-time update
    await addHighlight(sarah, '✓ Added!', true);
    await addHighlight(mike, '🔄 New movie appeared!');
    await addHighlight(emma, '🔄 New movie appeared!');
    await addHighlight(alex, '🔄 New movie appeared!');
    
    await capture2x2(pages, 'matrix_realtime', 'Instant sync - no refresh needed!', 4000);
    
    // Clear highlights
    for (const page of pages) {
      await addHighlight(page, '');
    }

    // Scene 3: Mike adds Interstellar
    await addHighlight(mike, 'Adding movie...', true);
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
    
    await sleep(1500);
    
    await addHighlight(sarah, '🔄 Interstellar appeared!');
    await addHighlight(mike, '✓ Added!', true);
    await addHighlight(emma, '🔄 Interstellar appeared!');
    await addHighlight(alex, '🔄 Interstellar appeared!');
    
    await capture2x2(pages, 'interstellar_realtime', 'Everyone sees updates instantly', 4000);
    
    // Clear highlights
    for (const page of pages) {
      await addHighlight(page, '');
    }

    // Scene 4: Emma adds Parasite while Sarah starts voting
    // Sarah starts ranking
    await sarah.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      if (addBtns[0]) addBtns[0].click();
    });
    await sleep(500);
    
    // Emma adds movie at same time
    await emma.type('input[placeholder="Search for a movie..."]', 'Parasite');
    await sleep(2000);
    
    await emma.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movie = buttons.find(b => b.querySelector('img'));
      if (movie) movie.click();
    });
    await sleep(800);
    
    await emma.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const add = buttons.find(b => b.textContent === 'Add to Ranking');
      if (add) add.click();
    });
    
    await sleep(1500);
    
    await addHighlight(sarah, '🔄 New movie while voting!');
    await addHighlight(mike, '🔄 Parasite appeared!');
    await addHighlight(emma, '✓ Added!', true);
    await addHighlight(alex, '🔄 Parasite appeared!');
    
    await capture2x2(pages, 'concurrent_updates', 'Real-time updates during voting', 4000);

    // Scene 5: Sarah votes and goes to results
    for (const page of pages) {
      await addHighlight(page, '');
    }
    
    await sarah.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      if (addBtns[1]) addBtns[1].click();
    });
    await sleep(500);
    
    await sarah.evaluate(() => {
      const submit = document.querySelector('button');
      if (submit) submit.click();
    });
    await sleep(1500);
    
    await sarah.goto('http://localhost:3000/results');
    await sleep(1500);
    
    // Mike votes
    await mike.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      if (addBtns[1]) addBtns[1].click();
    });
    await sleep(500);
    
    await mike.evaluate(() => {
      const submit = document.querySelector('button');
      if (submit) submit.click();
    });
    
    await addHighlight(sarah, '📊 Watching live results');
    await addHighlight(mike, '✓ Voted!', true);
    
    await sleep(5500); // Wait for results to update
    
    await addHighlight(sarah, '🔄 Results updated!', true);
    
    await capture2x2(pages, 'live_results', 'Live results update every 5 seconds', 4000);

    console.log('\n✅ Demo complete!');

    // Create video
    console.log('\n🎥 Creating video...');
    
    let concatContent = screenshots.map(s => 
      `file '${path.resolve('./demo-frames', s.filename)}'\nduration ${s.duration / 1000}`
    ).join('\n');
    concatContent += `\nfile '${path.resolve('./demo-frames', screenshots[screenshots.length - 1].filename)}'`;
    
    await fs.writeFile('./demo-frames/concat_realtime.txt', concatContent);
    
    const cmd = `ffmpeg -y -f concat -safe 0 -i "./demo-frames/concat_realtime.txt" ` +
      `-vf "scale=800:880,fps=30" ` +
      `-c:v libx264 -pix_fmt yuv420p "./demo-frames/nospoilers_realtime_demo.mp4"`;
    
    await execPromise(cmd);
    console.log('✅ Video: nospoilers_realtime_demo.mp4');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n✅ Done');
    }
  }
}

runRealtime2x2Demo();