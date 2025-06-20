const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class WebSocketDemo {
  constructor() {
    this.browser = null;
    this.outputDir = path.join(__dirname, 'websocket-demo-frames');
    this.frameIndex = 0;
    this.appUrl = 'http://localhost:8080';
    this.contexts = [];
    this.pages = [];
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

  async captureFrame(identifier = '') {
    const filename = `frame_${String(this.frameIndex).padStart(4, '0')}_${identifier}.png`;
    
    // Create a composite image if we have multiple pages
    if (this.pages.length > 1) {
      // Capture each page
      for (let i = 0; i < this.pages.length; i++) {
        await this.pages[i].screenshot({ 
          path: path.join(this.outputDir, `${filename}_user${i}.png`)
        });
      }
    } else if (this.pages.length === 1) {
      await this.pages[0].screenshot({ 
        path: path.join(this.outputDir, filename)
      });
    }
    
    this.frameIndex++;
  }

  async wait(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async slowType(page, selector, text) {
    await page.focus(selector);
    await page.click(selector, { clickCount: 3 }); // Select all
    await page.keyboard.press('Backspace'); // Clear
    
    for (const char of text) {
      await page.type(selector, char);
      await this.wait(50 + Math.random() * 50);
    }
  }

  async run() {
    try {
      await this.init();
      
      console.log('🎬 WebSocket Real-time Synchronization Demo');
      console.log('==========================================');
      
      // Scene 1: Create room
      console.log('\n📍 Scene 1: Creating Movie Night Room');
      const roomUrl = await this.createRoom();
      
      // Scene 2: Multiple users join
      console.log('\n👥 Scene 2: Multiple Users Join');
      await this.multipleUsersJoin(roomUrl);
      
      // Scene 3: Real-time movie addition
      console.log('\n🎬 Scene 3: Real-time Movie Addition (WebSocket Demo)');
      await this.demonstrateRealtimeSync();
      
      // Scene 4: Real-time voting
      console.log('\n🗳️ Scene 4: Real-time Voting Updates');
      await this.demonstrateRealtimeVoting();
      
      // Scene 5: Live results
      console.log('\n📊 Scene 5: Live Results Updates');
      await this.demonstrateLiveResults();
      
      // Generate video
      console.log('\n🎥 Generating video...');
      await this.generateVideo();
      
      console.log('\n✅ Demo completed successfully!');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    } finally {
      await this.cleanup();
    }
  }

  async createRoom() {
    const page = await this.browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Go to homepage
    await page.goto(this.appUrl);
    await page.waitForSelector('button', { timeout: 10000 });
    
    // Click create button
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && text.includes('Create')) {
        await button.click();
        break;
      }
    }
    
    await page.waitForNavigation();
    const roomUrl = page.url();
    console.log(`  ✅ Room created: ${roomUrl}`);
    
    await page.close();
    return roomUrl;
  }

  async multipleUsersJoin(roomUrl) {
    const users = [
      { name: 'Alex', viewport: { width: 960, height: 540 } },
      { name: 'Sam', viewport: { width: 960, height: 540 } },
      { name: 'Jordan', viewport: { width: 960, height: 540 } },
      { name: 'Casey', viewport: { width: 960, height: 540 } }
    ];
    
    // Create contexts and pages for each user
    for (const user of users) {
      const context = await this.browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport(user.viewport);
      
      // Navigate to room
      await page.goto(roomUrl);
      await page.waitForSelector('input[placeholder="Search for a movie..."]', { timeout: 10000 });
      
      this.contexts.push(context);
      this.pages.push(page);
      
      console.log(`  ✅ ${user.name} joined the room`);
    }
    
    // Capture initial state
    await this.captureFrame('all_users_joined');
  }

  async demonstrateRealtimeSync() {
    console.log('  🔄 Demonstrating WebSocket synchronization...');
    
    // User 1 adds a movie
    console.log('  📽️ Alex searches for "Top Gun: Maverick"');
    await this.slowType(this.pages[0], 'input[placeholder="Search for a movie..."]', 'Top Gun Maverick');
    // Wait for search results dropdown
    await this.wait(1500); // Wait for debounce and API call
    await this.pages[0].waitForSelector('button.w-full.px-4.py-3', { timeout: 10000 });
    await this.captureFrame('alex_searching');
    
    // Click add button (first search result)
    const addButtons = await this.pages[0].$$('button.w-full.px-4.py-3');
    if (addButtons.length > 0) {
      await addButtons[0].click();
      console.log('  ✅ Alex added movie');
      
      // Wait for WebSocket to sync to other users
      await this.wait(1000);
      
      // Capture all screens to show real-time update
      await this.captureFrame('websocket_sync_1');
      console.log('  🔄 Movie instantly appears on all screens!');
    }
    
    // User 2 adds a movie
    console.log('  📽️ Sam searches for "The Notebook"');
    await this.slowType(this.pages[1], 'input[placeholder="Search for a movie..."]', 'The Notebook');
    await this.wait(1500);
    await this.pages[1].waitForSelector('button.w-full.px-4.py-3', { timeout: 10000 });
    
    const samButtons = await this.pages[1].$$('button.w-full.px-4.py-3');
    if (samButtons.length > 0) {
      await samButtons[0].click();
      console.log('  ✅ Sam added movie');
      await this.wait(1000);
      await this.captureFrame('websocket_sync_2');
    }
    
    // User 3 adds a movie quickly
    console.log('  📽️ Jordan quickly adds "Interstellar"');
    await this.slowType(this.pages[2], 'input[placeholder="Search for a movie..."]', 'Interstellar');
    await this.wait(1500);
    await this.pages[2].waitForSelector('button.w-full.px-4.py-3', { timeout: 10000 });
    
    const jordanButtons = await this.pages[2].$$('button.w-full.px-4.py-3');
    if (jordanButtons.length > 0) {
      await jordanButtons[0].click();
      console.log('  ✅ Jordan added movie');
      await this.wait(1000);
      await this.captureFrame('websocket_sync_3');
    }
    
    console.log('  ✨ All users see updates in real-time via WebSocket!');
  }

  async demonstrateRealtimeVoting() {
    console.log('  🗳️ Starting voting phase...');
    
    // Admin (first user) starts voting
    const adminControls = await this.pages[0].$('.admin-controls');
    if (adminControls) {
      const startButton = await this.pages[0].$('.admin-controls button');
      if (startButton) {
        await startButton.click();
        console.log('  ✅ Admin started voting');
        await this.wait(1000);
        await this.captureFrame('voting_started');
      }
    }
    
    // Each user votes with real-time updates
    for (let i = 0; i < this.pages.length; i++) {
      console.log(`  🗳️ User ${i + 1} is voting...`);
      
      // Find vote buttons
      const voteButtons = await this.pages[i].$$('.vote-button, .rank-button, button[class*="rank"]');
      
      // Vote for 3 movies
      for (let j = 0; j < Math.min(3, voteButtons.length); j++) {
        await voteButtons[j].click();
        await this.wait(300);
      }
      
      // Submit vote
      const submitButtons = await this.pages[i].$$('button');
      for (const button of submitButtons) {
        const text = await this.pages[i].evaluate(el => el.textContent, button);
        if (text && text.includes('Submit')) {
          await button.click();
          console.log(`  ✅ User ${i + 1} submitted vote`);
          await this.wait(1000);
          await this.captureFrame(`vote_submitted_${i + 1}`);
          break;
        }
      }
    }
    
    console.log('  🔄 Vote counts update in real-time for all users!');
  }

  async demonstrateLiveResults() {
    console.log('  📊 Navigating to results...');
    
    // Navigate all users to results page
    for (let i = 0; i < this.pages.length; i++) {
      const resultsUrl = this.pages[i].url() + '/results';
      await this.pages[i].goto(resultsUrl);
      await this.pages[i].waitForSelector('body', { timeout: 5000 });
    }
    
    await this.wait(2000);
    await this.captureFrame('live_results');
    
    console.log('  🏆 All users see the same results in real-time!');
  }

  async generateVideo() {
    const outputPath = path.join(__dirname, 'nospoilers_websocket_demo.mp4');
    
    // First, create composite images from multi-user frames
    console.log('  🖼️ Creating composite frames...');
    
    const files = await fs.readdir(this.outputDir);
    const frameGroups = {};
    
    // Group frames by frame number
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
    
    // Create 2x2 composites for multi-user frames using FFmpeg
    for (const [frameNum, frameFiles] of Object.entries(frameGroups)) {
      if (frameFiles.length === 4) {
        // Use FFmpeg to create 2x2 grid
        const inputs = frameFiles.map(f => `-i ${path.join(this.outputDir, f)}`).join(' ');
        const compositeCmd = `ffmpeg -y ${inputs} -filter_complex "[0:v][1:v]hstack=inputs=2[top];[2:v][3:v]hstack=inputs=2[bottom];[top][bottom]vstack=inputs=2[v]" -map "[v]" ${path.join(this.outputDir, `composite_${frameNum}.png`)}`;
        try {
          await execPromise(compositeCmd);
        } catch (error) {
          console.error(`Failed to create composite for frame ${frameNum}:`, error.message);
        }
      } else if (frameFiles.length === 1) {
        // Just copy single frames
        await fs.copyFile(
          path.join(this.outputDir, frameFiles[0]),
          path.join(this.outputDir, `composite_${frameNum}.png`)
        );
      }
    }
    
    // Generate video from composite frames
    console.log('  🎬 Generating final video...');
    const ffmpegCmd = `ffmpeg -y -framerate 24 -pattern_type glob -i '${this.outputDir}/composite_*.png' -c:v libx264 -pix_fmt yuv420p -preset medium -crf 23 ${outputPath}`;
    
    try {
      await execPromise(ffmpegCmd);
      console.log(`  ✅ Video created: ${outputPath}`);
      
      // Generate 30-second version
      const shortCmd = `ffmpeg -y -i ${outputPath} -t 30 -c copy ${path.join(__dirname, 'nospoilers_websocket_demo_30s.mp4')}`;
      await execPromise(shortCmd);
      console.log(`  ✅ 30-second version created`);
      
    } catch (error) {
      console.error('  ❌ FFmpeg error:', error);
    }
  }

  async cleanup() {
    // Close all contexts
    for (const context of this.contexts) {
      await context.close();
    }
    
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run the demo
if (require.main === module) {
  const demo = new WebSocketDemo();
  demo.run().catch(console.error);
}

module.exports = WebSocketDemo;