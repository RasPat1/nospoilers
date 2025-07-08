const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createDemo() {
  console.log('🎬 Recording NoSpoilers Demo...\n');
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--window-size=1400,900']
    });
    
    // Start recording
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const videoPath = `nospoilers-demo-${timestamp}.mp4`;
    
    // Create a page for recording
    const recordPage = await browser.newPage();
    await recordPage.setViewport({ width: 1200, height: 800 });
    
    // Set up screen recording
    const ffmpegProcess = exec(
      `ffmpeg -y -f image2pipe -vcodec mjpeg -i - -vcodec libx264 -r 24 -pix_fmt yuv420p ${videoPath}`,
      { encoding: 'buffer' }
    );
    
    // Capture frames
    let isRecording = true;
    const captureFrames = async () => {
      while (isRecording) {
        try {
          const screenshot = await recordPage.screenshot({ encoding: 'binary' });
          ffmpegProcess.stdin.write(screenshot);
        } catch (e) {
          // Page might be closed
        }
        await sleep(42); // ~24fps
      }
    };
    captureFrames();
    
    // Clear database
    await recordPage.goto('http://localhost:3000/admin?admin=admin123');
    await sleep(2000);
    
    await recordPage.type('input[type="text"]', 'admin');
    await recordPage.type('input[type="password"]', 'admin123');
    await recordPage.keyboard.press('Enter');
    await sleep(2000);
    
    await recordPage.evaluate(() => {
      window.confirm = () => true;
      const buttons = Array.from(document.querySelectorAll('button'));
      const reset = buttons.find(b => b.textContent.includes('Delete Everything'));
      if (reset) reset.click();
    });
    await sleep(2000);
    
    // Navigate to main page
    await recordPage.goto('http://localhost:3000/vote');
    await sleep(3000);
    
    // Search and add first movie
    console.log('Adding movies...');
    await recordPage.type('input[placeholder="Search for a movie..."]', 'The Matrix');
    await sleep(3000);
    
    await recordPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img'));
      if (movieBtn) movieBtn.click();
    });
    await sleep(2000);
    
    await recordPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
      if (addBtn) addBtn.click();
    });
    await sleep(2000);
    
    // Add second movie
    await recordPage.click('input[placeholder="Search for a movie..."]', { clickCount: 3 });
    await recordPage.keyboard.press('Backspace');
    await recordPage.type('input[placeholder="Search for a movie..."]', 'Inception');
    await sleep(3000);
    
    await recordPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img'));
      if (movieBtn) movieBtn.click();
    });
    await sleep(2000);
    
    await recordPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
      if (addBtn) addBtn.click();
    });
    await sleep(2000);
    
    // Add third movie
    await recordPage.click('input[placeholder="Search for a movie..."]', { clickCount: 3 });
    await recordPage.keyboard.press('Backspace');
    await recordPage.type('input[placeholder="Search for a movie..."]', 'Interstellar');
    await sleep(3000);
    
    await recordPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img'));
      if (movieBtn) movieBtn.click();
    });
    await sleep(2000);
    
    await recordPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
      if (addBtn) addBtn.click();
    });
    await sleep(3000);
    
    // Create ranking
    console.log('Creating ranking...');
    await recordPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const inception = addBtns.find(b => b.closest('div').textContent.includes('Inception'));
      if (inception) inception.click();
    });
    await sleep(1000);
    
    await recordPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const matrix = addBtns.find(b => b.closest('div').textContent.includes('Matrix'));
      if (matrix) matrix.click();
    });
    await sleep(1000);
    
    await recordPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
      const inter = addBtns.find(b => b.closest('div').textContent.includes('Interstellar'));
      if (inter) inter.click();
    });
    await sleep(2000);
    
    // Submit vote
    console.log('Submitting vote...');
    await recordPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submit) submit.click();
    });
    await sleep(3000);
    
    // View results
    console.log('Viewing results...');
    await recordPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const results = buttons.find(b => b.textContent.includes('View Live Results'));
      if (results) results.click();
    });
    await sleep(5000);
    
    // Stop recording
    isRecording = false;
    ffmpegProcess.stdin.end();
    
    await new Promise((resolve) => {
      ffmpegProcess.on('close', resolve);
    });
    
    console.log(`\n✅ Demo saved as: ${videoPath}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

createDemo();