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
    return document.querySelector('input[type="password"]') !== null;
  });
  
  if (needsLogin) {
    await admin.type('input[type="text"]', 'admin');
    await admin.type('input[type="password"]', 'admin123');
    await admin.keyboard.press('Enter');
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

async function createDemo() {
  console.log('🎬 Creating NoSpoilers Demo...\n');
  
  const outputDir = 'demo-output';
  await fs.mkdir(outputDir, { recursive: true });
  
  let browser;
  let frameCount = 0;
  
  try {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--window-size=1400,900']
    });
    
    // Clear database
    console.log('Clearing database...');
    await clearDatabase(browser);
    
    // Create main demo page
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });
    
    // Helper to capture frames with captions
    async function captureFrame(caption = '') {
      const compositeCanvas = await browser.newPage();
      await compositeCanvas.setViewport({ width: 600, height: 1000 });
      await compositeCanvas.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              margin: 0; 
              font-family: -apple-system, Arial, sans-serif; 
              background: #0a0a0a;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 20px;
            }
            .phone {
              width: 390px;
              height: 844px;
              border-radius: 40px;
              overflow: hidden;
              box-shadow: 0 30px 60px rgba(0,0,0,0.8);
              border: 3px solid #333;
              background: #000;
              position: relative;
            }
            .screen {
              width: 100%;
              height: 100%;
              border-radius: 37px;
            }
            .caption {
              position: absolute;
              bottom: 30px;
              left: 50%;
              transform: translateX(-50%);
              background: #FFE66D;
              color: #0a0a0a;
              padding: 16px 32px;
              border-radius: 30px;
              font-size: 18px;
              font-weight: bold;
              box-shadow: 0 8px 16px rgba(255,230,109,0.4);
              max-width: 80%;
              text-align: center;
              white-space: nowrap;
            }
          </style>
        </head>
        <body>
          <div class="phone" id="phone"></div>
          ${caption ? `<div class="caption">${caption}</div>` : ''}
        </body>
        </html>
      `);
      
      // Take screenshot and embed
      const screenshot = await page.screenshot({ encoding: 'base64' });
      await compositeCanvas.evaluate((screenshot) => {
        const img = document.createElement('img');
        img.src = `data:image/png;base64,${screenshot}`;
        img.className = 'screen';
        document.getElementById('phone').appendChild(img);
      }, screenshot);
      
      await sleep(100);
      await compositeCanvas.screenshot({
        path: path.join(outputDir, `frame_${frameCount.toString().padStart(4, '0')}.png`)
      });
      frameCount++;
      console.log(`Frame ${frameCount}: ${caption}`);
      await compositeCanvas.close();
    }
    
    // Scene 1: Welcome screen
    await page.goto('http://localhost:3000/vote');
    await sleep(2000);
    await captureFrame('NoSpoilers - Movie voting without spoilers!');
    
    // Scene 2: Search for first movie
    await page.type('input[placeholder="Search for a movie..."]', 'The Matrix');
    await sleep(2000);
    await captureFrame('Search for any movie');
    
    // Scene 3: Select movie
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img'));
      if (movieBtn) movieBtn.click();
    });
    await sleep(1500);
    await captureFrame('View movie details');
    
    // Scene 4: Add to available movies
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
      if (addBtn) addBtn.click();
    });
    await sleep(1500);
    await captureFrame('Movie added to the list');
    
    // Scene 5: Add more movies
    await page.click('input[placeholder="Search for a movie..."]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[placeholder="Search for a movie..."]', 'Inception');
    await sleep(2000);
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img'));
      if (movieBtn) movieBtn.click();
    });
    await sleep(1000);
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
      if (addBtn) addBtn.click();
    });
    await sleep(1500);
    
    // Add third movie
    await page.click('input[placeholder="Search for a movie..."]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[placeholder="Search for a movie..."]', 'Interstellar');
    await sleep(2000);
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img'));
      if (movieBtn) movieBtn.click();
    });
    await sleep(1000);
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
      if (addBtn) addBtn.click();
    });
    await sleep(1500);
    await captureFrame('Build your movie list');
    
    // Scene 6: Start ranking
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const inception = addBtns.find(b => b.closest('div').textContent.includes('Inception'));
      if (inception) inception.click();
    });
    await sleep(1000);
    await captureFrame('Click to add movies to your ranking');
    
    // Add more to ranking
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const matrix = addBtns.find(b => b.closest('div').textContent.includes('Matrix'));
      if (matrix) matrix.click();
    });
    await sleep(1000);
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const inter = addBtns.find(b => b.closest('div').textContent.includes('Interstellar'));
      if (inter) inter.click();
    });
    await sleep(1500);
    await captureFrame('Arrange movies in your preferred order');
    
    // Scene 7: Submit vote
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(2000);
    await captureFrame('Vote submitted!');
    
    // Scene 8: View results
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const results = buttons.find(b => b.textContent.includes('View Live Results'));
      if (results) results.click();
    });
    await sleep(3000);
    await captureFrame('See real-time results');
    
    // Scene 9: Show elimination details
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const elim = buttons.find(b => b.textContent.includes('View Elimination Rounds'));
      if (elim) elim.click();
    });
    await sleep(2000);
    await captureFrame('Instant-runoff voting details');
    
    console.log(`\n✅ Demo complete! ${frameCount} frames captured.`);
    console.log('Creating video...');
    
    // Create video with proper encoding
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const videoPath = `nospoilers-demo-${timestamp}.mp4`;
    
    try {
      // Use a slower frame rate for better viewing
      await execPromise(
        `ffmpeg -framerate 0.5 -i ${outputDir}/frame_%04d.png -c:v libx264 -r 30 -pix_fmt yuv420p -movflags +faststart ${videoPath}`
      );
      
      console.log(`\n🎥 Video saved as: ${videoPath}`);
      
      // Check file size
      const stats = await fs.stat(videoPath);
      console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
    } catch (error) {
      console.error('Error creating video:', error);
      console.log('\nFrames are saved in demo-output/ directory');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

createDemo();