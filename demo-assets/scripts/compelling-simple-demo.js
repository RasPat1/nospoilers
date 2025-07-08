const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class CompellingSimpleDemo {
  constructor() {
    this.browser = null;
    this.outputDir = path.join(__dirname, 'compelling-demo-frames');
    this.frameIndex = 0;
    this.appUrl = 'http://localhost:8080';
  }

  async init() {
    // Create output directory
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Clean up old frames
    const files = await fs.readdir(this.outputDir);
    for (const file of files) {
      if (file.endsWith('.png')) {
        await fs.unlink(path.join(this.outputDir, file));
      }
    }

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log('✅ Browser launched');
  }

  async captureFrame(page, label = '') {
    const filename = `frame_${String(this.frameIndex).padStart(4, '0')}_${label}.png`;
    await page.screenshot({ 
      path: path.join(this.outputDir, filename),
      fullPage: false 
    });
    this.frameIndex++;
  }

  async captureFrames(page, duration, fps = 30) {
    const frames = Math.floor(duration * fps / 1000);
    for (let i = 0; i < frames; i++) {
      await this.captureFrame(page);
      await new Promise(resolve => setTimeout(resolve, 1000 / fps));
    }
  }

  async slowType(page, selector, text) {
    await page.click(selector);
    for (const char of text) {
      await page.type(selector, char);
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
    }
  }

  async run() {
    try {
      await this.init();
      
      console.log('🎬 Scene 1: Homepage');
      await this.scene1_homepage();
      
      console.log('🎬 Scene 2: Create Room');
      await this.scene2_createRoom();
      
      console.log('🎬 Scene 3: Multi-user Demo');
      await this.scene3_multiUser();
      
      console.log('🎬 Scene 4: Voting');
      await this.scene4_voting();
      
      console.log('🎬 Scene 5: Results');
      await this.scene5_results();
      
      console.log('🎬 Generating video...');
      await this.generateVideo();
      
    } catch (error) {
      console.error('Demo failed:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async scene1_homepage() {
    const page = await this.browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.goto(this.appUrl);
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Capture homepage
    await this.captureFrames(page, 2000);
    
    // Highlight create button
    await page.evaluate(() => {
      const button = document.querySelector('button');
      if (button && button.textContent.includes('Create')) {
        button.style.transform = 'scale(1.1)';
        button.style.transition = 'all 0.3s ease';
      }
    });
    
    await this.captureFrames(page, 1000);
    
    // Click create
    const createButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Create'));
    });
    if (createButton) {
      await createButton.click();
      await page.waitForNavigation();
    }
    
    this.roomUrl = page.url();
    await page.close();
  }

  async scene2_createRoom() {
    const page = await this.browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.goto(this.roomUrl);
    await page.waitForSelector('input[placeholder*="Search"]', { timeout: 5000 });
    
    // Show the share link
    await this.captureFrames(page, 2000);
    
    // Search for a movie
    await this.slowType(page, 'input[placeholder*="Search"]', 'Top Gun');
    await page.waitForSelector('.search-results', { timeout: 5000 });
    
    await this.captureFrames(page, 1000);
    
    // Add movie
    await page.click('.search-results button:first-child');
    await this.captureFrames(page, 1000);
    
    await page.close();
  }

  async scene3_multiUser() {
    // Create 4 users
    const users = ['Alex', 'Sam', 'Jordan', 'Casey'];
    const contexts = [];
    const pages = [];
    
    for (const user of users) {
      const context = await this.browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 960, height: 540 });
      await page.goto(this.roomUrl);
      await page.waitForSelector('input[placeholder*="Search"]', { timeout: 5000 });
      
      contexts.push(context);
      pages.push(page);
    }
    
    // Capture grid view
    await this.captureCompositeView(pages);
    
    // Each user adds a movie
    const movies = ['The Matrix', 'The Notebook', 'Interstellar', 'Grand Budapest'];
    for (let i = 0; i < pages.length; i++) {
      await this.slowType(pages[i], 'input[placeholder*="Search"]', movies[i]);
      await pages[i].waitForSelector('.search-results', { timeout: 5000 });
      await pages[i].click('.search-results button:first-child');
      await this.captureCompositeView(pages);
    }
    
    // Clean up
    for (const context of contexts) {
      await context.close();
    }
  }

  async scene4_voting() {
    const page = await this.browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.goto(this.roomUrl);
    await page.waitForSelector('.movie-item', { timeout: 5000 });
    
    // Start voting (if admin controls exist)
    const hasAdmin = await page.$('.admin-controls');
    if (hasAdmin) {
      const startButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('.admin-controls button'));
        return buttons.find(btn => btn.textContent.includes('Start'));
      });
      if (startButton) {
        await startButton.click();
      }
    }
    
    // Show voting interface
    await this.captureFrames(page, 2000);
    
    // Vote for movies
    const voteButtons = await page.$$('.vote-button, .rank-button');
    for (let i = 0; i < Math.min(3, voteButtons.length); i++) {
      await voteButtons[i].click();
      await this.captureFrames(page, 500);
    }
    
    // Submit vote
    const submitButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Submit'));
    });
    if (submitButton) {
      await submitButton.click();
      await this.captureFrames(page, 1000);
    }
    
    await page.close();
  }

  async scene5_results() {
    const page = await this.browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.goto(`${this.roomUrl}/results`);
    await page.waitForSelector('body', { timeout: 5000 });
    
    // Capture results
    await this.captureFrames(page, 3000);
    
    await page.close();
  }

  async captureCompositeView(pages) {
    // Simple composite: capture each page and we'll combine them later
    for (let i = 0; i < pages.length; i++) {
      await pages[i].screenshot({ 
        path: path.join(this.outputDir, `composite_${this.frameIndex}_user${i}.png`)
      });
    }
    this.frameIndex++;
  }

  async generateVideo() {
    const outputPath = path.join(__dirname, 'nospoilers_compelling_demo.mp4');
    
    // Use FFmpeg to create video from frames
    const ffmpegCommand = `ffmpeg -y -framerate 30 -pattern_type glob -i '${this.outputDir}/frame_*.png' -c:v libx264 -pix_fmt yuv420p -preset medium -crf 23 ${outputPath}`;
    
    try {
      await execPromise(ffmpegCommand);
      console.log(`✅ Video created: ${outputPath}`);
      
      // Create 30-second version
      const shortCommand = `ffmpeg -y -i ${outputPath} -t 30 -c copy ${path.join(__dirname, 'nospoilers_compelling_demo_30s.mp4')}`;
      await execPromise(shortCommand);
      console.log(`✅ 30-second version created`);
      
    } catch (error) {
      console.error('FFmpeg error:', error);
    }
  }
}

// Run the demo
if (require.main === module) {
  const demo = new CompellingSimpleDemo();
  demo.run().catch(console.error);
}

module.exports = { CompellingSimpleDemo };