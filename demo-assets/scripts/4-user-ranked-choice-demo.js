const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function create4UserRankedChoiceDemo() {
  console.log('🎬 Recording 4-User NoSpoilers Demo with Ranked Choice Voting...\n');
  
  let browser;
  let screenshots = [];
  
  try {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--window-size=1400,1000', '--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Create composite page for rendering
    const compositePage = await browser.newPage();
    await compositePage.setViewport({ width: 1400, height: 1000 });
    
    // Create 4 user sessions
    const users = [
      { name: 'Alice', color: '#FF6B6B', page: null },
      { name: 'Bob', color: '#4ECDC4', page: null },
      { name: 'Charlie', color: '#45B7D1', page: null },
      { name: 'Diana', color: '#F8B500', page: null }
    ];
    
    // Initialize user pages
    for (let i = 0; i < users.length; i++) {
      users[i].page = await browser.newPage();
      await users[i].page.setViewport({ width: 650, height: 450 });
    }
    
    // Function to create composite screenshot
    const createCompositeScreenshot = async (sceneTitle, description = '') => {
      console.log(`📸 ${sceneTitle}`);
      
      // Take screenshots from all user pages
      const userScreenshots = [];
      for (const user of users) {
        const screenshot = await user.page.screenshot({ encoding: 'base64' });
        userScreenshots.push({ name: user.name, color: user.color, screenshot });
      }
      
      // Create composite HTML
      const compositeHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              margin: 0;
              background: #0a0a0a;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: white;
            }
            .container {
              width: 1400px;
              height: 1000px;
              display: flex;
              flex-direction: column;
            }
            .header {
              text-align: center;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              font-weight: 700;
            }
            .header p {
              margin: 5px 0 0 0;
              font-size: 18px;
              opacity: 0.9;
            }
            .users-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              padding: 20px;
              flex: 1;
            }
            .user-window {
              position: relative;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            .user-window img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .user-label {
              position: absolute;
              bottom: 15px;
              left: 50%;
              transform: translateX(-50%);
              padding: 8px 20px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
            .scene-label {
              position: absolute;
              bottom: 30px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(0,0,0,0.9);
              padding: 12px 30px;
              border-radius: 8px;
              font-size: 20px;
              font-weight: 600;
              box-shadow: 0 4px 20px rgba(0,0,0,0.5);
              border: 2px solid rgba(255,255,255,0.1);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>NoSpoilers - Real-Time Collaborative Voting</h1>
              <p>4 Users Demonstrating WebSocket Synchronization & Ranked Choice Voting</p>
            </div>
            <div class="users-grid">
              ${userScreenshots.map((user, i) => `
                <div class="user-window" style="border: 3px solid ${user.color};">
                  <img src="data:image/png;base64,${user.screenshot}" />
                  <div class="user-label" style="background: ${user.color}; color: white;">
                    ${user.name}
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="scene-label">${sceneTitle}</div>
          </div>
        </body>
        </html>
      `;
      
      await compositePage.setContent(compositeHtml);
      await sleep(100); // Let the page render
      const compositeScreenshot = await compositePage.screenshot({ encoding: 'base64' });
      screenshots.push(compositeScreenshot);
    };
    
    // Function to take multiple frames for video
    const recordScene = async (sceneTitle, duration = 2000, description = '') => {
      const frames = Math.floor(duration / 100);
      for (let i = 0; i < frames; i++) {
        await createCompositeScreenshot(sceneTitle, description);
        await sleep(100);
      }
    };
    
    // SCENE 1: All users join
    console.log('\n🎬 SCENE 1: Users joining the voting session');
    for (let i = 0; i < users.length; i++) {
      await users[i].page.goto('http://localhost:8080/vote');
      await sleep(300);
    }
    await recordScene('All users connected to the voting session', 3000);
    
    // SCENE 2: Alice adds a movie
    console.log('\n🎬 SCENE 2: Real-time movie addition');
    await users[0].page.waitForSelector('input[placeholder*="Search"]');
    await users[0].page.click('input[placeholder*="Search"]');
    await users[0].page.type('input[placeholder*="Search"]', 'The Matrix', { delay: 100 });
    await recordScene('Alice searches for "The Matrix"', 2000);
    
    await sleep(2000); // Wait for search results
    try {
      // Click the first search result
      await users[0].page.click('.hover\\:bg-neutral-100');
      await recordScene('Movie instantly appears on all screens!', 3000);
    } catch (e) {
      // If TMDB search fails, add manually
      await users[0].page.click('button:has-text("Add") :has-text("anyway")');
      await recordScene('Movie added and synced to all users!', 3000);
    }
    
    // SCENE 3: Other users add movies
    console.log('\n🎬 SCENE 3: Multiple users adding movies');
    
    // Bob adds Inception
    await users[1].page.click('input[placeholder*="Search"]');
    await users[1].page.type('input[placeholder*="Search"]', 'Inception', { delay: 100 });
    await sleep(2000);
    try {
      await users[1].page.click('.hover\\:bg-neutral-100');
    } catch (e) {
      await users[1].page.click('button:has-text("Add") :has-text("anyway")');
    }
    await recordScene('Bob adds "Inception"', 2000);
    
    // Charlie adds Interstellar
    await users[2].page.click('input[placeholder*="Search"]');
    await users[2].page.type('input[placeholder*="Search"]', 'Interstellar', { delay: 100 });
    await sleep(2000);
    try {
      await users[2].page.click('.hover\\:bg-neutral-100');
    } catch (e) {
      await users[2].page.click('button:has-text("Add") :has-text("anyway")');
    }
    await recordScene('Charlie adds "Interstellar"', 2000);
    
    // Diana adds The Dark Knight
    await users[3].page.click('input[placeholder*="Search"]');
    await users[3].page.type('input[placeholder*="Search"]', 'The Dark Knight', { delay: 100 });
    await sleep(2000);
    try {
      await users[3].page.click('.hover\\:bg-neutral-100');
    } catch (e) {
      await users[3].page.click('button:has-text("Add") :has-text("anyway")');
    }
    await recordScene('Diana adds "The Dark Knight" - 4 movies total!', 3000);
    
    // SCENE 4: Users rank their preferences (demonstrating ranked choice)
    console.log('\n🎬 SCENE 4: Users ranking preferences');
    
    // This voting pattern will show ranked choice vs first-past-the-post difference:
    // First choices: Matrix(1), Inception(1), Interstellar(1), Dark Knight(1) - TIE!
    // But with ranked choice, second preferences matter
    
    // Alice: 1. Matrix, 2. Dark Knight, 3. Inception, 4. Interstellar
    const aliceButtons = await users[0].page.$$('button:has-text("Add to Ranking")');
    await aliceButtons[0].click(); await sleep(200);
    await aliceButtons[3].click(); await sleep(200);
    await aliceButtons[1].click(); await sleep(200);
    await aliceButtons[2].click(); await sleep(200);
    
    // Bob: 1. Inception, 2. Dark Knight, 3. Matrix, 4. Interstellar  
    const bobButtons = await users[1].page.$$('button:has-text("Add to Ranking")');
    await bobButtons[1].click(); await sleep(200);
    await bobButtons[3].click(); await sleep(200);
    await bobButtons[0].click(); await sleep(200);
    await bobButtons[2].click(); await sleep(200);
    
    await recordScene('Users creating their ranked preferences', 2000);
    
    // Charlie: 1. Interstellar, 2. Dark Knight, 3. Inception, 4. Matrix
    const charlieButtons = await users[2].page.$$('button:has-text("Add to Ranking")');
    await charlieButtons[2].click(); await sleep(200);
    await charlieButtons[3].click(); await sleep(200);
    await charlieButtons[1].click(); await sleep(200);
    await charlieButtons[0].click(); await sleep(200);
    
    // Diana: 1. Dark Knight, 2. Matrix, 3. Inception, 4. Interstellar
    const dianaButtons = await users[3].page.$$('button:has-text("Add to Ranking")');
    await dianaButtons[3].click(); await sleep(200);
    await dianaButtons[0].click(); await sleep(200);
    await dianaButtons[1].click(); await sleep(200);
    await dianaButtons[2].click(); await sleep(200);
    
    await recordScene('All preferences ranked - ready to vote!', 3000);
    
    // SCENE 5: Voting and real-time results
    console.log('\n🎬 SCENE 5: Submitting votes');
    
    // Alice votes first
    await users[0].page.click('button:has-text("Submit Rankings")');
    await sleep(1000);
    await users[0].page.goto('http://localhost:8080/results');
    await recordScene('Alice votes - first results appear', 2000);
    
    // Bob votes - results update
    await users[1].page.click('button:has-text("Submit Rankings")');
    await sleep(1000);
    await users[1].page.goto('http://localhost:8080/results');
    await recordScene('Bob votes - tie situation developing', 2000);
    
    // Charlie votes
    await users[2].page.click('button:has-text("Submit Rankings")');
    await sleep(1000);
    await users[2].page.goto('http://localhost:8080/results');
    await recordScene('Charlie votes - 4-way tie in first choices!', 2000);
    
    // Diana votes - triggers ranked choice calculation
    await users[3].page.click('button:has-text("Submit Rankings")');
    await sleep(1000);
    await users[3].page.goto('http://localhost:8080/results');
    await recordScene('Diana votes - Ranked Choice finds a winner!', 3000);
    
    // SCENE 6: Show ranked choice process
    console.log('\n🎬 SCENE 6: Ranked Choice vs First-Past-The-Post');
    
    // Expand elimination rounds
    for (const user of users) {
      try {
        await user.page.click('button:has-text("View Elimination Rounds")');
      } catch (e) {
        // Some pages might not have loaded yet
      }
    }
    await sleep(1000);
    
    await recordScene('First-Past-The-Post: 4-way tie!', 3000);
    await recordScene('Ranked Choice: Dark Knight wins with majority!', 4000);
    await recordScene('Fair winner through instant runoff voting', 3000);
    
    // Create the video
    console.log('\n🎞️ Creating demo video...');
    
    // Save all screenshots
    for (let i = 0; i < screenshots.length; i++) {
      const buffer = Buffer.from(screenshots[i], 'base64');
      fs.writeFileSync(`/tmp/demo_frame_${String(i).padStart(5, '0')}.png`, buffer);
    }
    
    // Create high-quality video
    console.log('🎥 Encoding video with ffmpeg...');
    const ffmpegCmd = `ffmpeg -y -framerate 10 -i /tmp/demo_frame_%05d.png -c:v libx264 -pix_fmt yuv420p -crf 20 -vf "scale=1400:1000" public/demo.mp4`;
    await execPromise(ffmpegCmd);
    
    // Clean up frames
    await execPromise('rm -f /tmp/demo_frame_*.png');
    
    console.log('✅ Demo video created successfully at public/demo.mp4');
    console.log('\n📊 Voting Scenario Demonstrated:');
    console.log('- First-Past-The-Post: Each movie gets 1 vote → 4-way tie');
    console.log('- Ranked Choice: Dark Knight wins as most common 2nd choice');
    console.log('- Shows how ranked choice better represents group consensus!\n');
    
  } catch (error) {
    console.error('❌ Demo creation error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the demo
create4UserRankedChoiceDemo();