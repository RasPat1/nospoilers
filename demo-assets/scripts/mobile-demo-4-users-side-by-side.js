const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run4UserDemo() {
  console.log('🎬 NoSpoilers 4-User Side-by-Side Demo\n');

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

    async function captureCompositeScene(pages, name, annotations, duration = 3000) {
      // Add annotations to each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const annotation = annotations[i];
        
        if (annotation) {
          await page.evaluate((data) => {
            // Remove any existing annotation
            const existing = document.getElementById('demo-annotation');
            if (existing) existing.remove();
            
            // Create user badge at top
            const badge = document.createElement('div');
            badge.id = 'demo-annotation';
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
            
            // Add action annotation if provided
            if (data.action) {
              const action = document.createElement('div');
              action.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.85);
                color: white;
                padding: 12px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                text-align: center;
                backdrop-filter: blur(10px);
              `;
              action.textContent = data.action;
              document.body.appendChild(action);
              
              // Add click indicator if coordinates provided
              if (data.clickX !== undefined && data.clickY !== undefined) {
                const pointer = document.createElement('div');
                pointer.style.cssText = `
                  position: fixed;
                  left: ${data.clickX - 25}px;
                  top: ${data.clickY - 25}px;
                  width: 50px;
                  height: 50px;
                  border: 3px solid ${data.color};
                  border-radius: 50%;
                  z-index: 999998;
                  pointer-events: none;
                  animation: pulse 1s ease-out;
                `;
                
                const style = document.createElement('style');
                style.textContent = `
                  @keyframes pulse {
                    0% { transform: scale(0.8); opacity: 1; }
                    100% { transform: scale(1.2); opacity: 0; }
                  }
                `;
                document.head.appendChild(style);
                document.body.appendChild(pointer);
              }
            }
          }, annotation);
        }
      }
      
      await sleep(300);

      // Take screenshots of each page
      const pageScreenshots = [];
      for (let i = 0; i < pages.length; i++) {
        const filename = `temp_${i}.png`;
        await pages[i].screenshot({ path: `./demo-frames/${filename}` });
        pageScreenshots.push(filename);
      }

      // Composite the 4 screenshots side by side
      const compositeFilename = `composite_${String(screenIndex++).padStart(3, '0')}_${name}.png`;
      const cmd = `ffmpeg -y -i ./demo-frames/temp_0.png -i ./demo-frames/temp_1.png -i ./demo-frames/temp_2.png -i ./demo-frames/temp_3.png ` +
        `-filter_complex "[0:v][1:v][2:v][3:v]hstack=inputs=4" ` +
        `./demo-frames/${compositeFilename}`;
      
      await execPromise(cmd);
      
      // Clean up temp files
      for (const file of pageScreenshots) {
        await fs.unlink(`./demo-frames/${file}`);
      }
      
      screenshots.push({ filename: compositeFilename, duration });
      console.log(`📸 ${name}`);

      // Remove annotations
      for (const page of pages) {
        await page.evaluate(() => {
          const elements = document.querySelectorAll('#demo-annotation, div[style*="animation"]');
          elements.forEach(el => el.remove());
        });
      }
    }

    // Clear existing data
    console.log('📍 Clearing existing data...');
    const adminPage = await browser.newPage();
    await adminPage.goto('http://localhost:8080/admin?admin=admin123');
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
    const pages = [sarah, mike, emma, alex];
    const users = ['Sarah', 'Mike', 'Emma', 'Alex'];

    // Scene 1: All users on vote page
    console.log('📍 Scene 1: All users join');
    for (const page of pages) {
      await page.goto('http://localhost:8080/vote');
    }
    await sleep(2000);
    
    await captureCompositeScene(pages, 'all_join', [
      { user: 'Sarah', color: userColors.Sarah },
      { user: 'Mike', color: userColors.Mike },
      { user: 'Emma', color: userColors.Emma },
      { user: 'Alex', color: userColors.Alex }
    ], 3000);

    // Scene 2: Sarah adds first movie
    console.log('📍 Scene 2: Sarah adds The Matrix');
    await sarah.type('input[placeholder="Search for a movie..."]', 'The Matrix');
    await sleep(3000);
    
    await captureCompositeScene(pages, 'sarah_searches', [
      { user: 'Sarah', color: userColors.Sarah, action: 'Searching for "The Matrix"' },
      { user: 'Mike', color: userColors.Mike },
      { user: 'Emma', color: userColors.Emma },
      { user: 'Alex', color: userColors.Alex }
    ], 3000);
    
    // Click on the movie
    const sarahClickCoords = await sarah.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img') || b.textContent.includes('(1999)'));
      if (movieBtn) {
        const rect = movieBtn.getBoundingClientRect();
        movieBtn.click();
        return { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
      }
      return null;
    });
    await sleep(1500);
    
    // Add to ranking
    await sarah.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
      if (addBtn) addBtn.click();
    });
    await sleep(1500);
    
    // Capture with arrows showing the movie appeared for everyone
    await captureCompositeScene(pages, 'matrix_added', [
      { user: 'Sarah', color: userColors.Sarah, action: 'Added The Matrix! ✓' },
      { user: 'Mike', color: userColors.Mike, action: '⬆️ New movie appeared!' },
      { user: 'Emma', color: userColors.Emma, action: '⬆️ New movie appeared!' },
      { user: 'Alex', color: userColors.Alex, action: '⬆️ New movie appeared!' }
    ], 4000);

    // Scene 3: Mike adds Interstellar
    console.log('📍 Scene 3: Mike adds Interstellar');
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
    
    await captureCompositeScene(pages, 'interstellar_added', [
      { user: 'Sarah', color: userColors.Sarah, action: 'Sees Interstellar!' },
      { user: 'Mike', color: userColors.Mike, action: 'Added Interstellar! ✓' },
      { user: 'Emma', color: userColors.Emma, action: 'Sees Interstellar!' },
      { user: 'Alex', color: userColors.Alex, action: 'Sees Interstellar!' }
    ], 3500);

    // Scene 4: Emma adds Parasite
    console.log('📍 Scene 4: Emma adds Parasite');
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

    // Scene 5: Everyone starts ranking
    console.log('📍 Scene 5: Everyone ranks movies');
    
    // Sarah ranks her movies
    await sarah.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addButtons = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const matrixBtn = addButtons.find(b => b.closest('div').textContent.includes('Matrix'));
      if (matrixBtn) matrixBtn.click();
    });
    await sleep(500);
    
    await sarah.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addButtons = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const interstellarBtn = addButtons.find(b => b.closest('div').textContent.includes('Interstellar'));
      if (interstellarBtn) interstellarBtn.click();
    });
    await sleep(1000);
    
    await captureCompositeScene(pages, 'sarah_ranking', [
      { user: 'Sarah', color: userColors.Sarah, action: 'Ranking movies...' },
      { user: 'Mike', color: userColors.Mike },
      { user: 'Emma', color: userColors.Emma },
      { user: 'Alex', color: userColors.Alex }
    ], 3000);

    // Sarah submits first and goes to results
    console.log('📍 Scene 6: Sarah submits and sees results');
    await sarah.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(2000);
    
    // Sarah is redirected to results
    await sarah.goto('http://localhost:8080/results');
    await sleep(2000);
    
    await captureCompositeScene(pages, 'sarah_at_results', [
      { user: 'Sarah', color: userColors.Sarah, action: '📊 Watching live results!' },
      { user: 'Mike', color: userColors.Mike, action: 'Still voting...' },
      { user: 'Emma', color: userColors.Emma, action: 'Still voting...' },
      { user: 'Alex', color: userColors.Alex, action: 'Still voting...' }
    ], 4000);

    // Mike votes and submits
    console.log('📍 Scene 7: Mike submits - Sarah sees update');
    await mike.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addButtons = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const interstellarBtn = addButtons.find(b => b.closest('div').textContent.includes('Interstellar'));
      if (interstellarBtn) interstellarBtn.click();
    });
    await sleep(500);
    
    await mike.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addButtons = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const parasiteBtn = addButtons.find(b => b.closest('div').textContent.includes('Parasite'));
      if (parasiteBtn) parasiteBtn.click();
    });
    await sleep(500);
    
    await mike.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(2000);
    
    await captureCompositeScene(pages, 'mike_voted_update', [
      { user: 'Sarah', color: userColors.Sarah, action: '🔄 Vote count updated!' },
      { user: 'Mike', color: userColors.Mike, action: 'Vote submitted! ✓' },
      { user: 'Emma', color: userColors.Emma, action: 'Still voting...' },
      { user: 'Alex', color: userColors.Alex, action: 'Still voting...' }
    ], 4000);

    // Emma and Alex vote
    console.log('📍 Scene 8: Everyone finishes voting');
    
    // Emma votes
    await emma.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addButtons = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const parasiteBtn = addButtons.find(b => b.closest('div').textContent.includes('Parasite'));
      if (parasiteBtn) parasiteBtn.click();
    });
    await sleep(500);
    
    await emma.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addButtons = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const matrixBtn = addButtons.find(b => b.closest('div').textContent.includes('Matrix'));
      if (matrixBtn) matrixBtn.click();
    });
    await sleep(500);
    
    await emma.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    
    // Alex votes
    await alex.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addButtons = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const matrixBtn = addButtons.find(b => b.closest('div').textContent.includes('Matrix'));
      if (matrixBtn) matrixBtn.click();
    });
    await sleep(500);
    
    await alex.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(2500);
    
    // Everyone goes to results
    await mike.goto('http://localhost:8080/results');
    await emma.goto('http://localhost:8080/results');
    await alex.goto('http://localhost:8080/results');
    await sleep(2000);
    
    await captureCompositeScene(pages, 'all_at_results', [
      { user: 'Sarah', color: userColors.Sarah, action: '🏆 Watching final results' },
      { user: 'Mike', color: userColors.Mike, action: '🏆 Checking results' },
      { user: 'Emma', color: userColors.Emma, action: '🏆 Viewing results' },
      { user: 'Alex', color: userColors.Alex, action: '🏆 Results page' }
    ], 4000);

    // Show IRV elimination
    console.log('📍 Scene 9: IRV elimination rounds');
    for (const page of pages) {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const elim = buttons.find(b => b.textContent.includes('View Elimination Rounds'));
        if (elim) elim.click();
      });
    }
    await sleep(2000);
    
    await captureCompositeScene(pages, 'irv_elimination', [
      { user: 'Sarah', color: userColors.Sarah, action: 'IRV: Fair winner selection' },
      { user: 'Mike', color: userColors.Mike, action: 'Instant-runoff voting' },
      { user: 'Emma', color: userColors.Emma, action: 'Elimination rounds' },
      { user: 'Alex', color: userColors.Alex, action: 'Majority winner' }
    ], 5000);

    console.log('\n✅ Demo complete!');

    // Create video with captions
    console.log('\n🎥 Creating video...');
    
    // Create caption file
    const captions = [
      { start: 0, end: 3, text: "4 friends planning movie night" },
      { start: 3, end: 6, text: "Sarah searches for The Matrix" },
      { start: 6, end: 10, text: "Movie instantly appears for everyone!" },
      { start: 10, end: 13.5, text: "Mike adds Interstellar" },
      { start: 13.5, end: 17, text: "Real-time synchronization" },
      { start: 17, end: 20, text: "Sarah ranks her favorites" },
      { start: 20, end: 24, text: "Sarah submits - watches live results" },
      { start: 24, end: 28, text: "Mike votes - Sarah sees update!" },
      { start: 28, end: 32, text: "Everyone's votes counted fairly" },
      { start: 32, end: 37, text: "Instant-runoff voting ensures majority" }
    ];
    
    let concatContent = screenshots.map(s => 
      `file '${path.resolve('./demo-frames', s.filename)}'\nduration ${s.duration / 1000}`
    ).join('\n');
    concatContent += `\nfile '${path.resolve('./demo-frames', screenshots[screenshots.length - 1].filename)}'`;
    
    await fs.writeFile('./demo-frames/concat_4users.txt', concatContent);
    
    // Create main video
    const cmd = `ffmpeg -y -f concat -safe 0 -i "./demo-frames/concat_4users.txt" ` +
      `-vf "scale=1560:844,fps=30" ` +
      `-c:v libx264 -pix_fmt yuv420p "./demo-frames/nospoilers_4users_demo.mp4"`;
    
    await execPromise(cmd);
    console.log('✅ Video: nospoilers_4users_demo.mp4');

    // Add caption overlay
    let captionFilter = captions.map(c => 
      `drawtext=text='${c.text}':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=32:` +
      `fontcolor=white:box=1:boxcolor=black@0.7:boxborderw=10:` +
      `x=(w-text_w)/2:y=h-80:enable='between(t,${c.start},${c.end})'`
    ).join(',');
    
    const cmdWithCaptions = `ffmpeg -y -i "./demo-frames/nospoilers_4users_demo.mp4" ` +
      `-vf "${captionFilter}" ` +
      `-c:v libx264 -pix_fmt yuv420p "./demo-frames/nospoilers_4users_captioned.mp4"`;
    
    try {
      await execPromise(cmdWithCaptions);
      console.log('✅ Captioned: nospoilers_4users_captioned.mp4');
    } catch (e) {
      console.log('⚠️  Could not add captions, video saved without them');
    }

    // 60-second version
    const totalDuration = screenshots.reduce((sum, s) => sum + s.duration, 0) / 1000;
    const speedFactor = totalDuration / 60;
    
    if (speedFactor > 1) {
      const cmd60 = `ffmpeg -y -i "./demo-frames/nospoilers_4users_demo.mp4" ` +
        `-filter:v "setpts=${1/speedFactor}*PTS" -an "./demo-frames/nospoilers_4users_60sec.mp4"`;
      await execPromise(cmd60);
      console.log('✅ 60-sec: nospoilers_4users_60sec.mp4');
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

run4UserDemo();