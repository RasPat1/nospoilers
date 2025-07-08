const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run2x2GridDemo() {
  console.log('🎬 NoSpoilers 2x2 Grid Demo\n');

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

    // User colors - more subtle
    const userColors = {
      Sarah: 'rgba(255, 107, 107, 0.9)',
      Mike: 'rgba(78, 205, 196, 0.9)',
      Emma: 'rgba(69, 183, 209, 0.9)',
      Alex: 'rgba(150, 206, 180, 0.9)'
    };

    async function addSubtleUserBadge(page, userName, color) {
      await page.evaluate((data) => {
        // Add a subtle corner badge
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
          backdrop-filter: blur(10px);
        `;
        badge.textContent = data.user;
        document.body.appendChild(badge);
      }, { user: userName, color });
    }

    async function capture2x2Grid(pages, name, caption, highlights = [], duration = 3000) {
      // Add highlight indicators if needed
      for (let i = 0; i < pages.length; i++) {
        if (highlights[i]) {
          await pages[i].evaluate((highlight) => {
            // Remove any existing highlight
            const existing = document.getElementById('action-highlight');
            if (existing) existing.remove();
            
            const indicator = document.createElement('div');
            indicator.id = 'action-highlight';
            indicator.style.cssText = `
              position: fixed;
              bottom: 20px;
              left: 10px;
              right: 10px;
              background: rgba(0, 0, 0, 0.8);
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
            indicator.textContent = highlight;
            document.body.appendChild(indicator);
          }, highlights[i]);
        }
      }
      
      await sleep(300);

      // Take screenshots
      const files = [];
      for (let i = 0; i < 4; i++) {
        const filename = `temp_${i}.png`;
        await pages[i].screenshot({ path: `./demo-frames/${filename}` });
        files.push(filename);
      }

      // Create 2x2 grid
      const outputFile = `grid_${String(screenIndex++).padStart(3, '0')}_${name}.png`;
      
      // Create the grid layout with padding between screens
      const cmd = `ffmpeg -y -i ./demo-frames/${files[0]} -i ./demo-frames/${files[1]} -i ./demo-frames/${files[2]} -i ./demo-frames/${files[3]} ` +
        `-filter_complex "[0:v]pad=800:880:5:5:black[p0];[1:v]pad=800:880:405:5:black[p1];[2:v]pad=800:880:5:439:black[p2];[3:v]pad=800:880:405:439:black[p3];[p0][p1]hstack=inputs=2[top];[p2][p3]hstack=inputs=2[bottom];[top][bottom]vstack=inputs=2[grid]" ` +
        `-map "[grid]" ./demo-frames/${outputFile}`;
      
      await execPromise(cmd);
      
      // Add caption to the grid if provided
      if (caption) {
        const captionedFile = `grid_captioned_${screenIndex - 1}.png`;
        const captionCmd = `ffmpeg -y -i ./demo-frames/${outputFile} ` +
          `-vf "drawtext=text='${caption}':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=36:fontcolor=white:box=1:boxcolor=black@0.8:boxborderw=20:x=(w-text_w)/2:y=h-80" ` +
          `./demo-frames/${captionedFile}`;
        
        try {
          await execPromise(captionCmd);
          await fs.unlink(`./demo-frames/${outputFile}`);
          screenshots.push({ filename: captionedFile, duration });
        } catch (e) {
          console.log('Could not add caption, using uncaptioned version');
          screenshots.push({ filename: outputFile, duration });
        }
      } else {
        screenshots.push({ filename: outputFile, duration });
      }
      
      // Cleanup temp files
      for (const file of files) {
        await fs.unlink(`./demo-frames/${file}`);
      }
      
      // Remove highlights
      for (const page of pages) {
        await page.evaluate(() => {
          const highlight = document.getElementById('action-highlight');
          if (highlight) highlight.remove();
        });
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

    // Setup badges and go to vote page
    for (let i = 0; i < 4; i++) {
      await pages[i].goto('http://localhost:3000/vote');
      await addSubtleUserBadge(pages[i], names[i], userColors[names[i]]);
    }
    await sleep(1500);

    // Scene 1: Everyone ready
    await capture2x2Grid(pages, 'start', '4 friends start planning movie night', [], 3000);

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
    
    // Since there's no real-time sync, simulate others refreshing
    await capture2x2Grid(pages, 'sarah_adds', 'Sarah adds The Matrix', 
      ['Added movie!', '', '', ''], 3000);

    // Scene 3: Others need to refresh to see it
    console.log('📍 Others refresh to see new movie...');
    await mike.reload();
    await emma.reload();
    await alex.reload();
    await sleep(2000);
    
    await capture2x2Grid(pages, 'after_refresh', 'Others refresh and see the movie', 
      ['', 'Sees Matrix!', 'Sees Matrix!', 'Sees Matrix!'], 3500);

    // Scene 4: Mike adds Interstellar
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
    
    await capture2x2Grid(pages, 'mike_adds', 'Mike adds Interstellar', 
      ['', 'Added movie!', '', ''], 3000);

    // Scene 5: Sarah votes first
    await sarah.reload(); // To see Mike's movie
    await sleep(1500);
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
    
    await capture2x2Grid(pages, 'sarah_results', 'Sarah votes and watches live results', 
      ['Watching results', 'Still voting', 'Still voting', 'Still voting'], 4000);

    // Scene 6: Mike votes - Sarah's results update
    await mike.reload(); // Get fresh state
    await sleep(1000);
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
    
    // Wait for Sarah's results to update (5 second polling)
    await sleep(5500);
    
    await capture2x2Grid(pages, 'results_update', 'Results update every 5 seconds', 
      ['Updated!', 'Voted!', '', ''], 4000);

    // Scene 7: Everyone on results
    await mike.goto('http://localhost:3000/results');
    await emma.goto('http://localhost:3000/results');
    await alex.goto('http://localhost:3000/results');
    await sleep(1500);
    
    await capture2x2Grid(pages, 'all_results', 'Fair winner by ranked choice voting', [], 4000);

    console.log('\n✅ Demo captured!');

    // Create video
    console.log('\n🎥 Creating video...');
    
    let concatContent = screenshots.map(s => 
      `file '${path.resolve('./demo-frames', s.filename)}'\nduration ${s.duration / 1000}`
    ).join('\n');
    concatContent += `\nfile '${path.resolve('./demo-frames', screenshots[screenshots.length - 1].filename)}'`;
    
    await fs.writeFile('./demo-frames/concat_2x2.txt', concatContent);
    
    const cmd = `ffmpeg -y -f concat -safe 0 -i "./demo-frames/concat_2x2.txt" ` +
      `-vf "scale=800:880,fps=30" ` +
      `-c:v libx264 -pix_fmt yuv420p "./demo-frames/nospoilers_2x2_grid_demo.mp4"`;
    
    await execPromise(cmd);
    console.log('✅ Video: nospoilers_2x2_grid_demo.mp4');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n✅ Done');
    }
  }
}

run2x2GridDemo();