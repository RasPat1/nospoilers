const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class Simple4UserDemo {
  constructor() {
    this.browser = null;
    this.outputDir = path.join(__dirname, 'simple-4-user-demo-frames');
    this.frameIndex = 0;
    this.appUrl = 'http://localhost:8080';
  }

  async init() {
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Clean up old frames
    try {
      const files = await fs.readdir(this.outputDir);
      for (const file of files) {
        if (file.endsWith('.png')) {
          await fs.unlink(path.join(this.outputDir, file));
        }
      }
    } catch (e) {}

    // Launch browser with longer timeout
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      protocolTimeout: 60000
    });
    
    console.log('✅ Browser launched');
  }

  async captureComposite(pages, label) {
    const filename = `frame_${String(this.frameIndex).padStart(4, '0')}_${label}.png`;
    
    try {
      // Take screenshots sequentially to avoid timeout
      for (let i = 0; i < pages.length; i++) {
        await pages[i].screenshot({ 
          path: path.join(this.outputDir, `${filename}_user${i}.png`),
          timeout: 30000
        });
      }
      
      this.frameIndex++;
      console.log(`  📸 Captured: ${label}`);
    } catch (error) {
      console.error(`  ❌ Failed to capture ${label}:`, error.message);
    }
  }

  async wait(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async run() {
    try {
      await this.init();
      
      console.log('\n🎬 Simple 4-User Demo');
      console.log('====================\n');
      
      // Create room
      console.log('📍 Creating room...');
      const roomUrl = await this.createRoom();
      
      // Setup 4 users
      console.log('\n👥 Setting up 4 users...');
      const pages = await this.setupUsers(roomUrl);
      
      // Capture key moments
      console.log('\n📸 Capturing demo...');
      
      // 1. All users joined
      await this.captureComposite(pages, '01_all_joined');
      
      // 2. Add some movies
      console.log('  Adding movies...');
      await this.addMovies(pages);
      await this.captureComposite(pages, '02_movies_added');
      
      // 3. Start voting
      console.log('  Starting voting...');
      await this.startVoting(pages[0]);
      await this.captureComposite(pages, '03_voting_started');
      
      // 4. Users vote
      console.log('  Users voting...');
      await this.quickVote(pages);
      await this.captureComposite(pages, '04_all_voted');
      
      // 5. Show results
      console.log('  Showing results...');
      await this.showResults(pages);
      await this.captureComposite(pages, '05_results');
      
      // Generate video
      console.log('\n🎥 Generating video...');
      await this.generateVideo();
      
      console.log('\n✅ Demo completed!');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    } finally {
      if (this.browser) await this.browser.close();
    }
  }

  async createRoom() {
    const page = await this.browser.newPage();
    await page.goto(this.appUrl);
    await page.waitForSelector('button');
    
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && text.includes('Create')) {
        await button.click();
        await page.waitForNavigation();
        break;
      }
    }
    
    const url = page.url();
    await page.close();
    console.log(`  ✅ Room: ${url}`);
    return url;
  }

  async setupUsers(roomUrl) {
    const pages = [];
    const users = ['Alex', 'Sam', 'Jordan', 'Casey'];
    
    for (let i = 0; i < 4; i++) {
      const page = await this.browser.newPage();
      await page.setViewport({ width: 480, height: 800 });
      await page.goto(roomUrl);
      await page.waitForSelector('input[placeholder="Search for a movie..."]', { timeout: 20000 });
      pages.push(page);
      console.log(`  ✅ ${users[i]} joined`);
    }
    
    return pages;
  }

  async addMovies(pages) {
    const movies = ['Top Gun', 'Inception', 'Parasite', 'La La Land'];
    
    // Just add one movie per user quickly
    for (let i = 0; i < pages.length; i++) {
      try {
        await pages[i].type('input[placeholder="Search for a movie..."]', movies[i]);
        await this.wait(2000); // Wait for search
        
        const buttons = await pages[i].$$('button.w-full.px-4.py-3');
        if (buttons[0]) {
          await buttons[0].click();
          await this.wait(500);
        }
      } catch (e) {
        console.log(`  ⚠️ Failed to add movie for user ${i + 1}`);
      }
    }
  }

  async startVoting(adminPage) {
    try {
      const adminButton = await adminPage.$('.admin-controls button');
      if (adminButton) {
        await adminButton.click();
        await this.wait(1000);
      }
    } catch (e) {
      console.log('  ⚠️ Could not start voting');
    }
  }

  async quickVote(pages) {
    for (let i = 0; i < pages.length; i++) {
      try {
        // Just click first 3 rank buttons
        const rankButtons = await pages[i].$$('.rank-button, button[aria-label*="Rank"]');
        for (let j = 0; j < Math.min(3, rankButtons.length); j++) {
          await rankButtons[j].click();
          await this.wait(200);
        }
        
        // Submit
        const submitBtn = await pages[i].$('button:has-text("Submit")');
        if (!submitBtn) {
          const buttons = await pages[i].$$('button');
          for (const btn of buttons) {
            const text = await pages[i].evaluate(el => el.textContent, btn);
            if (text && text.includes('Submit')) {
              await btn.click();
              break;
            }
          }
        } else {
          await submitBtn.click();
        }
      } catch (e) {
        console.log(`  ⚠️ User ${i + 1} vote failed`);
      }
    }
  }

  async showResults(pages) {
    for (const page of pages) {
      try {
        const url = page.url() + '/results';
        await page.goto(url);
      } catch (e) {}
    }
    await this.wait(2000);
  }

  async generateVideo() {
    try {
      // First create composites
      const files = await fs.readdir(this.outputDir);
      const frameGroups = {};
      
      for (const file of files) {
        if (file.endsWith('.png')) {
          const match = file.match(/frame_(\d{4})/);
          if (match) {
            const frameNum = match[1];
            if (!frameGroups[frameNum]) frameGroups[frameNum] = [];
            frameGroups[frameNum].push(file);
          }
        }
      }
      
      // Create 2x2 composites
      for (const [frameNum, frameFiles] of Object.entries(frameGroups)) {
        if (frameFiles.length === 4) {
          const sortedFiles = frameFiles.sort();
          const inputs = sortedFiles.map(f => `-i "${path.join(this.outputDir, f)}"`).join(' ');
          
          const filterComplex = '[0:v][1:v]hstack=inputs=2[top];[2:v][3:v]hstack=inputs=2[bottom];[top][bottom]vstack=inputs=2[v]';
          const outputFile = path.join(this.outputDir, `composite_${frameNum}.png`);
          
          await execPromise(`ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "[v]" "${outputFile}"`);
        }
      }
      
      // Generate video
      const outputPath = path.join(__dirname, 'nospoilers_4user_complete.mp4');
      await execPromise(`ffmpeg -y -framerate 1 -pattern_type glob -i "${this.outputDir}/composite_*.png" -c:v libx264 -pix_fmt yuv420p -t 10 "${outputPath}"`);
      
      console.log(`  ✅ Video saved: ${outputPath}`);
      
      // Copy to public
      const publicPath = path.join(__dirname, '..', 'public', 'videos', 'complete_4user_demo.mp4');
      await fs.mkdir(path.dirname(publicPath), { recursive: true });
      await fs.copyFile(outputPath, publicPath);
      console.log(`  ✅ Copied to public/videos/`);
      
    } catch (error) {
      console.error('  ❌ Video generation failed:', error.message);
    }
  }
}

// Run
if (require.main === module) {
  const demo = new Simple4UserDemo();
  demo.run().catch(console.error);
}

module.exports = Simple4UserDemo;