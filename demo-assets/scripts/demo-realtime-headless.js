const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function clearDatabase(browser) {
  const admin = await browser.newPage();
  await admin.goto('http://localhost:3000/admin?admin=admin123');
  await sleep(1500);
  
  const needsLogin = await admin.evaluate(() => {
    return document.querySelector('input[type="text"]') !== null;
  });
  
  if (needsLogin) {
    await admin.type('input[type="text"]', 'admin');
    await admin.type('input[type="password"]', 'admin123');
    await admin.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const login = buttons.find(b => b.textContent.includes('Login'));
      if (login) login.click();
    });
    await sleep(1500);
  }
  
  await admin.evaluate(() => {
    window.confirm = () => true;
    const buttons = Array.from(document.querySelectorAll('button'));
    const reset = buttons.find(b => b.textContent.includes('Delete Everything'));
    if (reset) reset.click();
  });
  await sleep(2000);
  await admin.close();
}

async function captureDemo() {
  console.log('🎬 Starting Real-time Voting Demo (Headless)...\n');
  
  const outputDir = 'demo-output';
  await fs.mkdir(outputDir, { recursive: true });
  
  let browser;
  let frameCount = 0;
  
  try {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--window-size=1200,800']
    });
    
    // Clear database first
    console.log('Clearing database...');
    await clearDatabase(browser);
    
    // Create 3 user pages
    const users = [];
    for (let i = 0; i < 3; i++) {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844 });
      await page.goto('http://localhost:3000/vote');
      await sleep(1500);
      
      users.push({
        page,
        name: ['Alice', 'Bob', 'Charlie'][i],
        color: ['#FF6B6B', '#4ECDC4', '#FFE66D'][i]
      });
    }
    
    // Helper function to capture frame
    async function captureFrame(caption) {
      // Create composite image
      const compositeCanvas = await browser.newPage();
      await compositeCanvas.setViewport({ width: 1200, height: 700 });
      await compositeCanvas.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              margin: 0; 
              font-family: -apple-system, Arial, sans-serif; 
              background: #0a0a0a;
              position: relative;
            }
            .container {
              display: flex;
              gap: 20px;
              padding: 60px 20px 100px;
              justify-content: center;
            }
            .phone-wrapper {
              position: relative;
            }
            .user-label {
              position: absolute;
              top: -40px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(255,255,255,0.1);
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 8px;
              white-space: nowrap;
              backdrop-filter: blur(10px);
            }
            .user-icon {
              width: 24px;
              height: 24px;
              border-radius: 50%;
            }
            .caption {
              position: absolute;
              bottom: 20px;
              left: 50%;
              transform: translateX(-50%);
              background: #FFE66D;
              color: #0a0a0a;
              padding: 16px 32px;
              border-radius: 30px;
              font-size: 20px;
              font-weight: bold;
              box-shadow: 0 8px 16px rgba(255,230,109,0.3);
              max-width: 90%;
              text-align: center;
            }
            .phone {
              width: 390px;
              height: 844px;
              border-radius: 40px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(0,0,0,0.6);
              border: 3px solid #333;
              background: #000;
            }
            .screen {
              width: 100%;
              height: 100%;
              border-radius: 37px;
            }
          </style>
        </head>
        <body>
          <div class="container" id="container"></div>
          ${caption ? `<div class="caption">${caption}</div>` : ''}
        </body>
        </html>
      `);
      
      // Take screenshots and embed them
      for (let i = 0; i < users.length; i++) {
        const screenshot = await users[i].page.screenshot({ encoding: 'base64' });
        await compositeCanvas.evaluate((data) => {
          const { user, screenshot } = data;
          const wrapper = document.createElement('div');
          wrapper.className = 'phone-wrapper';
          wrapper.innerHTML = `
            <div class="user-label">
              <div class="user-icon" style="background: ${user.color};"></div>
              ${user.name}
            </div>
            <div class="phone">
              <img src="data:image/png;base64,${screenshot}" class="screen" />
            </div>
          `;
          document.getElementById('container').appendChild(wrapper);
        }, { user: users[i], screenshot });
      }
      
      await sleep(500);
      await compositeCanvas.screenshot({
        path: path.join(outputDir, `frame_${frameCount.toString().padStart(4, '0')}.png`)
      });
      frameCount++;
      await compositeCanvas.close();
    }
    
    // Scene 1: Initial state
    console.log('Scene 1: Initial empty state');
    await captureFrame('Real-time collaborative movie voting');
    await sleep(1000);
    
    // Scene 2: Alice adds a movie
    console.log('Scene 2: Alice adds first movie');
    await users[0].page.type('input[placeholder="Search for a movie..."]', 'The Matrix');
    await sleep(2000);
    
    await users[0].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img'));
      if (movieBtn) movieBtn.click();
    });
    await sleep(1000);
    
    await users[0].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
      if (addBtn) addBtn.click();
    });
    await sleep(2000);
    await captureFrame('Movies appear instantly for everyone!');
    
    // Scene 3: Bob and Charlie add movies
    console.log('Scene 3: More movies added');
    await users[1].page.type('input[placeholder="Search for a movie..."]', 'Inception');
    await sleep(2000);
    await users[1].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img'));
      if (movieBtn) movieBtn.click();
    });
    await sleep(1000);
    await users[1].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
      if (addBtn) addBtn.click();
    });
    await sleep(1500);
    
    await users[2].page.type('input[placeholder="Search for a movie..."]', 'Interstellar');
    await sleep(2000);
    await users[2].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img'));
      if (movieBtn) movieBtn.click();
    });
    await sleep(1000);
    await users[2].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
      if (addBtn) addBtn.click();
    });
    await sleep(2000);
    await captureFrame('Building the movie list together');
    
    // Scene 4: Alice votes
    console.log('Scene 4: Alice votes');
    await users[0].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const matrix = addBtns.find(b => b.closest('div').textContent.includes('Matrix'));
      if (matrix) matrix.click();
    });
    await sleep(500);
    await users[0].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const inception = addBtns.find(b => b.closest('div').textContent.includes('Inception'));
      if (inception) inception.click();
    });
    await sleep(1000);
    
    await users[0].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(2000);
    await captureFrame('Vote count updates in real-time!');
    
    // Scene 5: Bob votes
    console.log('Scene 5: Bob votes');
    await users[1].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const inception = addBtns.find(b => b.closest('div').textContent.includes('Inception'));
      if (inception) inception.click();
    });
    await sleep(500);
    await users[1].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const inter = addBtns.find(b => b.closest('div').textContent.includes('Interstellar'));
      if (inter) inter.click();
    });
    await sleep(500);
    await users[1].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(2000);
    await captureFrame('Everyone sees "2 people have voted"');
    
    // Scene 6: Show results
    console.log('Scene 6: View results');
    await users[0].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const results = buttons.find(b => b.textContent.includes('View Live Results'));
      if (results) results.click();
    });
    await users[1].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const results = buttons.find(b => b.textContent.includes('View Live Results'));
      if (results) results.click();
    });
    await users[2].page.goto('http://localhost:3000/results');
    await sleep(3000);
    await captureFrame('Live results with IRV elimination rounds');
    
    // Scene 7: Charlie votes while others watch
    console.log('Scene 7: Charlie votes');
    await users[2].page.goto('http://localhost:3000/vote');
    await sleep(1500);
    await users[2].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const inter = addBtns.find(b => b.closest('div').textContent.includes('Interstellar'));
      if (inter) inter.click();
    });
    await sleep(500);
    await users[2].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(2000);
    await captureFrame('Results update instantly as votes come in!');
    
    // Final scene
    await sleep(1000);
    await captureFrame('NoSpoilers - Pick movies without spoilers!');
    
    console.log(`\n✅ Demo complete! ${frameCount} frames captured.`);
    console.log('Creating video...');
    
    // Create video from frames
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const videoPath = `demo-realtime-voting-${timestamp}.mp4`;
    
    await execPromise(
      `ffmpeg -r 1 -i ${outputDir}/frame_%04d.png -c:v libx264 -vf "fps=1,format=yuv420p" -crf 20 ${videoPath}`
    );
    
    console.log(`\n🎥 Video saved as: ${videoPath}`);
    
    // Clean up frames
    const files = await fs.readdir(outputDir);
    for (const file of files) {
      if (file.endsWith('.png')) {
        await fs.unlink(path.join(outputDir, file));
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

captureDemo();