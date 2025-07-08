const puppeteer = require('puppeteer');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createBasicDemo() {
  console.log('🎬 Recording Basic NoSpoilers Demo...\n');
  
  let browser;
  let screenshots = [];
  let frameCount = 0;
  
  try {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--window-size=1400,900', '--no-sandbox']
    });
    
    const takeScreenshot = async (page, label, duration = 2000) => {
      console.log(`📸 ${label}`);
      const numFrames = Math.floor(duration / 100);
      for (let i = 0; i < numFrames; i++) {
        const screenshot = await page.screenshot({ encoding: 'base64' });
        screenshots.push(screenshot);
        await sleep(100);
      }
    };

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    // Scene 1: Landing page
    console.log('\n🎬 SCENE 1: Landing page');
    await page.goto('http://localhost:3000');
    await sleep(2000);
    
    await page.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 10000;
        background: rgba(0,0,0,0.8); color: white; padding: 12px 24px;
        border-radius: 8px; font-family: Arial; font-size: 18px; font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      overlay.textContent = "NoSpoilers - Movie Night Made Fair";
      document.body.appendChild(overlay);
    });
    
    await takeScreenshot(page, 'landing-page', 3000);
    
    // Scene 2: Vote page
    console.log('\n🎬 SCENE 2: Voting interface');
    await page.goto('http://localhost:3000/vote');
    await sleep(3000);
    
    await page.evaluate(() => {
      const overlay = document.querySelector('div[style*="bottom: 20px"]');
      if (overlay) {
        overlay.style.background = 'rgba(34,139,34,0.8)';
        overlay.textContent = "Add movies and rank your preferences";
      }
    });
    
    await takeScreenshot(page, 'voting-interface', 4000);
    
    // Try to add a movie if possible
    try {
      const searchInput = await page.$('input[placeholder*="Search"]');
      if (searchInput) {
        await page.type('input[placeholder*="Search"]', 'The Matrix');
        await sleep(2000);
        await takeScreenshot(page, 'searching-movies', 2000);
      }
    } catch (e) {
      console.log('Search input interaction failed, continuing...');
    }
    
    // Scene 3: Results page
    console.log('\n🎬 SCENE 3: Results page');
    await page.goto('http://localhost:3000/results');
    await sleep(2000);
    
    await page.evaluate(() => {
      const overlay = document.querySelector('div[style*="bottom: 20px"]');
      if (overlay) {
        overlay.style.background = 'rgba(255,140,0,0.8)';
        overlay.textContent = "Live results with ranked choice voting";
      }
    });
    
    await takeScreenshot(page, 'results-page', 4000);
    
    // Scene 4: Final message
    await page.evaluate(() => {
      const overlay = document.querySelector('div[style*="bottom: 20px"]');
      if (overlay) {
        overlay.style.background = 'rgba(138,43,226,0.8)';
        overlay.textContent = "Fair, fast, and fun movie selection!";
      }
    });
    
    await takeScreenshot(page, 'final-message', 3000);
    
    console.log('\n🎞️ Creating video...');
    
    // Save screenshots
    for (let i = 0; i < screenshots.length; i++) {
      const buffer = Buffer.from(screenshots[i], 'base64');
      fs.writeFileSync(`/tmp/basic_frame_${String(i).padStart(4, '0')}.png`, buffer);
    }
    
    // Create video
    console.log('🎥 Encoding video...');
    await execPromise(`ffmpeg -y -framerate 8 -i /tmp/basic_frame_%04d.png -c:v libx264 -pix_fmt yuv420p -vf "scale=1200:800" public/demo.mp4`);
    
    // Clean up
    await execPromise('rm -f /tmp/basic_frame_*.png');
    
    console.log('✅ Demo video created at public/demo.mp4');
    
  } catch (error) {
    console.error('Demo error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

createBasicDemo();