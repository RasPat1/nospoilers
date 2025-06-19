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
  console.log('🎬 Starting Real-time Voting Demo...\n');
  
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
    
    // Create 3 user pages in a grid
    const users = [];
    const positions = [
      { x: 10, y: 10 },    // Top left
      { x: 405, y: 10 },   // Top right
      { x: 10, y: 475 }    // Bottom left
    ];
    
    for (let i = 0; i < 3; i++) {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844 });
      const pos = positions[i];
      
      // Position windows
      const session = await page.target().createCDPSession();
      await session.send('Browser.setWindowBounds', {
        windowId: 1,
        bounds: { left: pos.x, top: pos.y, width: 400, height: 900 }
      });
      
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
      // Create composite image with labels
      const compositeCanvas = await browser.newPage();
      await compositeCanvas.setViewport({ width: 800, height: 950 });
      await compositeCanvas.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              margin: 0; 
              font-family: Arial, sans-serif; 
              background: #1a1a1a;
              position: relative;
            }
            .user-label {
              position: absolute;
              background: rgba(0,0,0,0.8);
              color: white;
              padding: 8px 16px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: bold;
              z-index: 10;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .user-icon {
              width: 20px;
              height: 20px;
              border-radius: 50%;
            }
            .caption {
              position: absolute;
              bottom: 20px;
              left: 50%;
              transform: translateX(-50%);
              background: #FFE66D;
              color: #1a1a1a;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 18px;
              font-weight: bold;
              box-shadow: 0 4px 6px rgba(0,0,0,0.3);
              max-width: 90%;
              text-align: center;
            }
            .screens {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              padding: 60px 20px 100px;
              max-width: 800px;
              margin: 0 auto;
            }
            .screen {
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            }
          </style>
        </head>
        <body>
          <div class="user-label" style="top: 10px; left: 20px;">
            <div class="user-icon" style="background: ${users[0].color};"></div>
            ${users[0].name}
          </div>
          <div class="user-label" style="top: 10px; left: 420px;">
            <div class="user-icon" style="background: ${users[1].color};"></div>
            ${users[1].name}
          </div>
          <div class="user-label" style="bottom: 460px; left: 20px;">
            <div class="user-icon" style="background: ${users[2].color};"></div>
            ${users[2].name}
          </div>
          <div class="screens" id="screens"></div>
          ${caption ? `<div class="caption">${caption}</div>` : ''}
        </body>
        </html>
      `);
      
      // Take screenshots and embed them
      for (let i = 0; i < users.length; i++) {
        const screenshot = await users[i].page.screenshot({ encoding: 'base64' });
        await compositeCanvas.evaluate((data) => {
          const { index, screenshot } = data;
          const img = document.createElement('img');
          img.src = `data:image/png;base64,${screenshot}`;
          img.style.width = '100%';
          img.style.display = 'block';
          img.className = 'screen';
          document.getElementById('screens').appendChild(img);
        }, { index: i, screenshot });
      }
      
      await sleep(500);
      const frame = await compositeCanvas.screenshot({
        path: path.join(outputDir, `frame_${frameCount.toString().padStart(4, '0')}.png`)
      });
      frameCount++;
      await compositeCanvas.close();
    }
    
    // Scene 1: Initial state
    console.log('Scene 1: Initial empty state');
    await captureFrame('Welcome to NoSpoilers - Real-time movie voting!');
    await sleep(2000);
    
    // Scene 2: Alice adds a movie
    console.log('Scene 2: Alice adds first movie');
    await users[0].page.type('input[placeholder="Search for a movie..."]', 'The Matrix');
    await sleep(2000);
    await captureFrame('Alice searches for The Matrix');
    
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
    await captureFrame('The Matrix appears instantly for all users!');
    
    // Scene 3: Bob adds a movie
    console.log('Scene 3: Bob adds a movie');
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
    await sleep(2000);
    await captureFrame('Bob adds Inception - Everyone sees it!');
    
    // Scene 4: Charlie adds a movie
    console.log('Scene 4: Charlie adds a movie');
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
    await captureFrame('Three movies ready for voting!');
    
    // Scene 5: Alice votes
    console.log('Scene 5: Alice votes');
    // Add movies to ranking
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
    await captureFrame('Alice ranks her favorites');
    
    // Submit vote
    await users[0].page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(2000);
    await captureFrame('Alice votes - Notice "1 person has voted" appears!');
    
    // Scene 6: Bob votes
    console.log('Scene 6: Bob votes');
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
    await captureFrame('Bob votes - Now "2 people have voted"!');
    
    // Scene 7: Show results
    console.log('Scene 7: View results');
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
    await captureFrame('Live results update as votes come in!');
    
    // Scene 8: Charlie votes while others watch results
    console.log('Scene 8: Charlie votes while others watch');
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
    await captureFrame('Charlie votes - Results update instantly!');
    
    // Final scene
    await sleep(1000);
    await captureFrame('NoSpoilers - Real-time collaborative movie voting!');
    
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