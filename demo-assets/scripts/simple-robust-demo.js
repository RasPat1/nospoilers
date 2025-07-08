const puppeteer = require('puppeteer');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.log(`Element ${selector} not found within ${timeout}ms`);
    return false;
  }
}

async function createSimpleDemo() {
  console.log('🎬 Recording Simple NoSpoilers Demo...\n');
  
  let browser;
  let screenshots = [];
  let frameCount = 0;
  
  try {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--window-size=1400,900', '--no-sandbox', '--disable-dev-shm-usage']
    });
    
    // Helper function to take a screenshot
    const takeScreenshot = async (page, label, duration = 2000) => {
      console.log(`📸 ${label}`);
      const numFrames = Math.floor(duration / 100);
      for (let i = 0; i < numFrames; i++) {
        const screenshot = await page.screenshot({ encoding: 'base64' });
        screenshots.push({
          data: screenshot,
          label: `${frameCount}_${label}`,
          frame: frameCount++
        });
        await sleep(100);
      }
    };

    // === SETUP: Clear database ===
    console.log('\n🎬 Setting up clean environment');
    const adminPage = await browser.newPage();
    await adminPage.setViewport({ width: 1200, height: 800 });
    
    // Clear database via admin panel
    await adminPage.goto('http://localhost:3000/admin?admin=admin123');
    await sleep(3000);
    
    // Fill admin form if it exists
    try {
      const hasTextInput = await adminPage.$('input[type="text"]');
      if (hasTextInput) {
        await adminPage.type('input[type="text"]', 'admin');
        await adminPage.type('input[type="password"]', 'admin123');
        await adminPage.keyboard.press('Enter');
        await sleep(2000);
      }
      
      // Reset data
      await adminPage.evaluate(() => {
        window.confirm = () => true;
        const buttons = Array.from(document.querySelectorAll('button'));
        const reset = buttons.find(b => b.textContent.includes('Delete Everything'));
        if (reset) reset.click();
      });
      await sleep(2000);
    } catch (e) {
      console.log('Admin setup completed or not needed');
    }
    
    await adminPage.close();

    // === SCENE 1: Sarah starts the voting ===
    console.log('\n🎬 SCENE 1: Sarah starts movie night voting');
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    await page.goto('http://localhost:3000/vote');
    await sleep(3000);
    
    // Add user label
    await page.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 10000;
        background: rgba(0,0,0,0.8); color: white; padding: 12px 24px;
        border-radius: 8px; font-family: Arial; font-size: 18px; font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      overlay.textContent = "Sarah starts the movie night voting";
      document.body.appendChild(overlay);
    });
    
    await takeScreenshot(page, 'voting-page-loaded', 3000);
    
    // Check if search input exists
    const hasSearchInput = await waitForElement(page, 'input[placeholder*="Search"]', 5000);
    
    if (hasSearchInput) {
      console.log('✅ Search input found');
      
      // Add first movie - The Matrix
      await page.type('input[placeholder*="Search"]', 'The Matrix');
      await sleep(3000);
      
      // Look for search results or add manually
      const hasSearchResults = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(b => b.textContent.includes('Matrix') || b.querySelector('img'));
      });
      
      if (hasSearchResults) {
        console.log('✅ Search results found for The Matrix');
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const movieBtn = buttons.find(b => b.textContent.includes('Matrix') || b.querySelector('img'));
          if (movieBtn) movieBtn.click();
        });
        await sleep(1000);
      } else {
        // Try manual add if search didn't work
        console.log('⚠️ No search results, trying manual add');
        const manualAddBtn = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(b => b.textContent.includes('anyway') || b.textContent.includes('Add'));
        });
        if (manualAddBtn) {
          await page.click('button');
          await sleep(1000);
        }
      }
      
      await takeScreenshot(page, 'matrix-added', 2000);
      
      // Add to ranking if movie is in available list
      const addedToAvailable = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addBtn = buttons.find(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
        if (addBtn) {
          addBtn.click();
          return true;
        }
        return false;
      });
      
      if (addedToAvailable) {
        console.log('✅ Matrix added to ranking');
        await takeScreenshot(page, 'matrix-in-ranking', 2000);
      }
      
      // Add second movie - Inception
      await page.click('input[placeholder*="Search"]', { clickCount: 3 });
      await page.type('input[placeholder*="Search"]', 'Inception');
      await sleep(3000);
      
      const hasInceptionResults = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(b => b.textContent.includes('Inception') || b.querySelector('img'));
      });
      
      if (hasInceptionResults) {
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const movieBtn = buttons.find(b => b.textContent.includes('Inception') || b.querySelector('img'));
          if (movieBtn) movieBtn.click();
        });
        await sleep(1000);
        
        // Add to ranking
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const addBtn = buttons.find(b => b.textContent.includes('Add to Ranking') && b.querySelector('svg'));
          if (addBtn) addBtn.click();
        });
        await sleep(1000);
        
        await takeScreenshot(page, 'inception-added', 2000);
      }
      
      // Submit vote if possible
      const canSubmit = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const submitBtn = buttons.find(b => b.textContent.includes('Submit Rankings'));
        return submitBtn && !submitBtn.disabled;
      });
      
      if (canSubmit) {
        await page.evaluate(() => {
          const overlay = document.querySelector('div[style*="bottom: 20px"]');
          if (overlay) overlay.textContent = "Sarah submits her vote";
        });
        
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const submitBtn = buttons.find(b => b.textContent.includes('Submit Rankings'));
          if (submitBtn) submitBtn.click();
        });
        
        await takeScreenshot(page, 'vote-submitted', 3000);
      }
      
    } else {
      console.log('❌ Search input not found, taking basic screenshots');
      await takeScreenshot(page, 'page-loaded', 3000);
    }
    
    // === SCENE 2: Results page ===
    console.log('\n🎬 SCENE 2: Viewing results');
    await page.goto('http://localhost:3000/results');
    await sleep(2000);
    
    await page.evaluate(() => {
      const overlay = document.querySelector('div[style*="bottom: 20px"]');
      if (overlay) {
        overlay.style.background = 'rgba(255,140,0,0.8)';
        overlay.textContent = "Live voting results";
      }
    });
    
    await takeScreenshot(page, 'results-page', 4000);
    
    // Show IRV details if available
    const hasIRVButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const irvBtn = buttons.find(b => b.textContent.includes('Elimination'));
      if (irvBtn) {
        irvBtn.click();
        return true;
      }
      return false;
    });
    
    if (hasIRVButton) {
      await sleep(1000);
      await takeScreenshot(page, 'irv-details', 3000);
    }
    
    console.log('\n🎞️ Creating video from screenshots...');
    
    // Save screenshots as frames
    for (let i = 0; i < screenshots.length; i++) {
      const buffer = Buffer.from(screenshots[i].data, 'base64');
      fs.writeFileSync(`/tmp/demo_frame_${String(i).padStart(4, '0')}.png`, buffer);
    }
    
    // Create video with FFmpeg
    console.log('🎥 Encoding video...');
    const ffmpegCmd = `ffmpeg -y -framerate 10 -i /tmp/demo_frame_%04d.png -c:v libx264 -pix_fmt yuv420p -vf "scale=1200:800" public/demo.mp4`;
    await execPromise(ffmpegCmd);
    
    // Clean up
    await execPromise('rm -f /tmp/demo_frame_*.png');
    
    console.log('✅ Demo video saved to public/demo.mp4');
    
  } catch (error) {
    console.error('Demo creation error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

createSimpleDemo();