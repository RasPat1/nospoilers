const puppeteer = require('puppeteer');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createImprovedDemo() {
  console.log('🎬 Recording Improved NoSpoilers Demo...\n');
  
  let browser;
  const screenshots = [];
  let frameCount = 0;
  
  try {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--window-size=1400,900', '--no-sandbox']
    });
    
    // Helper function to take a screenshot
    const takeScreenshot = async (page, label, duration = 2000) => {
      console.log(`📸 ${label}`);
      for (let i = 0; i < Math.floor(duration / 100); i++) {
        const screenshot = await page.screenshot({ encoding: 'base64' });
        screenshots.push({
          data: screenshot,
          label: `${label}_${i}`,
          frame: frameCount++
        });
        await sleep(100);
      }
    };

    // === SCENE 1: Setup ===
    console.log('\n🎬 SCENE 1: Setting up demo environment');
    const adminPage = await browser.newPage();
    await adminPage.setViewport({ width: 1200, height: 800 });
    
    // Reset environment
    await adminPage.goto('http://localhost:3000/admin?admin=admin123');
    await sleep(2000);
    
    await adminPage.type('input[type="text"]', 'admin');
    await adminPage.type('input[type="password"]', 'admin123');
    await adminPage.keyboard.press('Enter');
    await sleep(2000);
    
    await adminPage.evaluate(() => {
      window.confirm = () => true;
      const buttons = Array.from(document.querySelectorAll('button'));
      const reset = buttons.find(b => b.textContent.includes('Delete Everything'));
      if (reset) reset.click();
    });
    await sleep(2000);
    await adminPage.close();

    // === SCENE 2: Sarah starts the voting ===
    console.log('\n🎬 SCENE 2: Sarah starts movie night voting');
    const sarahPage = await browser.newPage();
    await sarahPage.setViewport({ width: 1200, height: 800 });
    await sarahPage.goto('http://localhost:3000/vote');
    await sleep(1000);
    
    // Add title overlay
    await sarahPage.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 10000;
        background: rgba(0,0,0,0.8); color: white; padding: 12px 24px;
        border-radius: 8px; font-family: Arial; font-size: 18px; font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      overlay.textContent = "Sarah's Browser - Starting Movie Night";
      document.body.appendChild(overlay);
    });
    
    await takeScreenshot(sarahPage, 'sarah-starts-voting', 2000);
    
    // Sarah adds The Matrix
    await sarahPage.type('input[placeholder="Search for a movie..."]', 'The Matrix');
    await sleep(3000);
    
    await sarahPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img') || b.textContent.includes('Matrix'));
      if (movieBtn) movieBtn.click();
    });
    await sleep(1000);
    await takeScreenshot(sarahPage, 'sarah-adds-matrix', 2000);
    
    // Add Inception
    await sarahPage.click('input[placeholder="Search for a movie..."]', { clickCount: 3 });
    await sarahPage.type('input[placeholder="Search for a movie..."]', 'Inception');
    await sleep(3000);
    
    await sarahPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img') || b.textContent.includes('Inception'));
      if (movieBtn) movieBtn.click();
    });
    await sleep(1000);
    await takeScreenshot(sarahPage, 'sarah-adds-inception', 2000);
    
    // Sarah creates her ranking
    await sarahPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      if (addBtns[0]) addBtns[0].click(); // Matrix first
    });
    await sleep(1000);
    
    await sarahPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      if (addBtns[0]) addBtns[0].click(); // Inception second
    });
    await sleep(1000);
    await takeScreenshot(sarahPage, 'sarah-ranking-complete', 3000);
    
    // Sarah submits vote
    await sarahPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await takeScreenshot(sarahPage, 'sarah-vote-submitted', 2000);

    // === SCENE 3: Mike joins and adds more movies ===
    console.log('\n🎬 SCENE 3: Mike joins and adds different movies');
    const mikePage = await browser.newPage();
    await mikePage.setViewport({ width: 1200, height: 800 });
    await mikePage.goto('http://localhost:3000/vote');
    await sleep(1000);
    
    await mikePage.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 10000;
        background: rgba(34,139,34,0.8); color: white; padding: 12px 24px;
        border-radius: 8px; font-family: Arial; font-size: 18px; font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      overlay.textContent = "Mike's Browser - Joining the Vote";
      document.body.appendChild(overlay);
    });
    
    await takeScreenshot(mikePage, 'mike-joins', 2000);
    
    // Mike adds Interstellar
    await mikePage.type('input[placeholder="Search for a movie..."]', 'Interstellar');
    await sleep(3000);
    
    await mikePage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img') || b.textContent.includes('Interstellar'));
      if (movieBtn) movieBtn.click();
    });
    await sleep(1000);
    await takeScreenshot(mikePage, 'mike-adds-interstellar', 2000);
    
    // Mike adds The Dark Knight
    await mikePage.click('input[placeholder="Search for a movie..."]', { clickCount: 3 });
    await mikePage.type('input[placeholder="Search for a movie..."]', 'The Dark Knight');
    await sleep(3000);
    
    await mikePage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img') || b.textContent.includes('Dark Knight'));
      if (movieBtn) movieBtn.click();
    });
    await sleep(1000);
    await takeScreenshot(mikePage, 'mike-adds-dark-knight', 2000);
    
    // Mike creates his ranking (different preference)
    await mikePage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const darkKnight = addBtns.find(b => b.closest('div').textContent.includes('Dark Knight'));
      if (darkKnight) darkKnight.click();
    });
    await sleep(1000);
    
    await mikePage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const interstellar = addBtns.find(b => b.closest('div').textContent.includes('Interstellar'));
      if (interstellar) interstellar.click();
    });
    await sleep(1000);
    
    await mikePage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const matrix = addBtns.find(b => b.closest('div').textContent.includes('Matrix'));
      if (matrix) matrix.click();
    });
    await sleep(1000);
    await takeScreenshot(mikePage, 'mike-ranking-complete', 3000);
    
    // Mike submits vote
    await mikePage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await takeScreenshot(mikePage, 'mike-vote-submitted', 2000);

    // === SCENE 4: Emma joins with different preferences ===
    console.log('\n🎬 SCENE 4: Emma joins with her preferences');
    const emmaPage = await browser.newPage();
    await emmaPage.setViewport({ width: 1200, height: 800 });
    await emmaPage.goto('http://localhost:3000/vote');
    await sleep(1000);
    
    await emmaPage.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 10000;
        background: rgba(138,43,226,0.8); color: white; padding: 12px 24px;
        border-radius: 8px; font-family: Arial; font-size: 18px; font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      overlay.textContent = "Emma's Browser - Final Voter";
      document.body.appendChild(overlay);
    });
    
    await takeScreenshot(emmaPage, 'emma-joins', 2000);
    
    // Emma creates her ranking (prefers Inception)
    await emmaPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const inception = addBtns.find(b => b.closest('div').textContent.includes('Inception'));
      if (inception) inception.click();
    });
    await sleep(1000);
    
    await emmaPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const interstellar = addBtns.find(b => b.closest('div').textContent.includes('Interstellar'));
      if (interstellar) interstellar.click();
    });
    await sleep(1000);
    
    await emmaPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const darkKnight = addBtns.find(b => b.closest('div').textContent.includes('Dark Knight'));
      if (darkKnight) darkKnight.click();
    });
    await sleep(1000);
    await takeScreenshot(emmaPage, 'emma-ranking-complete', 3000);
    
    // Emma submits vote
    await emmaPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await takeScreenshot(emmaPage, 'emma-vote-submitted', 2000);

    // === SCENE 5: View final results ===
    console.log('\n🎬 SCENE 5: Viewing final results');
    const resultsPage = await browser.newPage();
    await resultsPage.setViewport({ width: 1200, height: 800 });
    await resultsPage.goto('http://localhost:3000/results');
    await sleep(2000);
    
    await resultsPage.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 10000;
        background: rgba(255,140,0,0.8); color: white; padding: 12px 24px;
        border-radius: 8px; font-family: Arial; font-size: 18px; font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      overlay.textContent = "Live Results - Real-time Updates";
      document.body.appendChild(overlay);
    });
    
    await takeScreenshot(resultsPage, 'live-results', 4000);
    
    // Show IRV elimination rounds
    await resultsPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const elimBtn = buttons.find(b => b.textContent.includes('View Elimination Rounds'));
      if (elimBtn) elimBtn.click();
    });
    await sleep(1000);
    await takeScreenshot(resultsPage, 'irv-elimination-rounds', 4000);

    // === SCENE 6: Winner announcement ===
    await takeScreenshot(resultsPage, 'final-winner', 3000);

    console.log('\n🎬 Creating video from screenshots...');
    
    // Save screenshots as individual frames
    for (let i = 0; i < screenshots.length; i++) {
      const buffer = Buffer.from(screenshots[i].data, 'base64');
      fs.writeFileSync(`/tmp/frame_${String(i).padStart(4, '0')}.png`, buffer);
    }
    
    // Create video using FFmpeg
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    console.log('🎞️ Encoding video...');
    await execPromise(`ffmpeg -y -framerate 10 -i /tmp/frame_%04d.png -c:v libx264 -pix_fmt yuv420p -vf "scale=1200:800" public/demo.mp4`);
    
    // Clean up temporary files
    await execPromise('rm -f /tmp/frame_*.png');
    
    console.log('✅ Demo video created successfully at public/demo.mp4');

  } catch (error) {
    console.error('Error creating demo:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

createImprovedDemo();