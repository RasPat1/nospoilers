const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class Quick4UserDemo {
  constructor() {
    this.browser = null;
    this.outputDir = path.join(__dirname, 'quick-4user-frames');
    this.frameIndex = 0;
    this.appUrl = 'http://localhost:8080';
    this.pages = [];
    this.contexts = [];
    this.adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  }

  async init() {
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Clean existing frames
    try {
      const files = await fs.readdir(this.outputDir);
      for (const file of files) {
        if (file.endsWith('.png')) {
          await fs.unlink(path.join(this.outputDir, file));
        }
      }
    } catch (e) {}

    // Launch browser with higher timeout
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 480, height: 800 },
      protocolTimeout: 300000 // 5 minutes
    });
    
    console.log('✅ Browser launched');
  }

  async captureGrid(label, duration = 2) {
    console.log(`📸 Capturing: ${label}`);
    
    // Capture multiple frames for this scene
    for (let i = 0; i < duration; i++) {
      const screenshots = await Promise.all(
        this.pages.map((page, idx) => 
          page.screenshot().catch(() => null)
        )
      );
      
      // Save individual screenshots
      for (let j = 0; j < screenshots.length; j++) {
        if (screenshots[j]) {
          const filename = `frame_${String(this.frameIndex).padStart(4, '0')}_user${j}.png`;
          await fs.writeFile(path.join(this.outputDir, filename), screenshots[j]);
        }
      }
      
      this.frameIndex++;
      await this.wait(500);
    }
  }

  async wait(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async setupRoom() {
    // Clear data first
    const clearUrl = `${this.appUrl}/api/votes/clear`;
    try {
      await fetch(clearUrl, { method: 'POST' });
    } catch (e) {}
    
    // Create room
    const page = await this.browser.newPage();
    await page.goto(this.appUrl);
    await page.waitForSelector('button', { timeout: 10000 });
    
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Create')) {
        await btn.click();
        await page.waitForNavigation();
        break;
      }
    }
    
    this.roomUrl = page.url();
    console.log(`✅ Room created: ${this.roomUrl}`);
    await page.close();
  }

  async createUsers() {
    const users = [
      { name: 'Alex', color: '#FF6B6B' },
      { name: 'Sam', color: '#4ECDC4' },
      { name: 'Jordan', color: '#45B7D1' },
      { name: 'Casey', color: '#96CEB4' }
    ];
    
    // Create 4 incognito contexts for isolation
    for (let i = 0; i < 4; i++) {
      const context = await this.browser.createIncognitoBrowserContext();
      this.contexts.push(context);
      
      const page = await context.newPage();
      await page.goto(this.roomUrl);
      
      // Wait for page to load
      await page.waitForSelector('input[placeholder="Search for a movie..."]', { timeout: 20000 });
      
      // Add user label
      await page.evaluate((name, color) => {
        const label = document.createElement('div');
        label.textContent = name;
        label.style.cssText = `
          position: fixed;
          bottom: 10px;
          left: 10px;
          background: ${color};
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          z-index: 10000;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(label);
      }, users[i].name, users[i].color);
      
      this.pages.push(page);
      console.log(`✅ ${users[i].name} joined`);
    }
  }

  async run() {
    try {
      await this.init();
      
      console.log('\n🎬 Quick 4-User Demo\n');
      
      // Setup
      await this.setupRoom();
      await this.createUsers();
      await this.captureGrid('users_joined', 3);
      
      // Scene 1: WebSocket demo - Alex adds a movie
      console.log('\n📽️ Scene 1: WebSocket Real-time Sync');
      const alexPage = this.pages[0];
      await alexPage.type('input[placeholder="Search for a movie..."]', 'Inception', { delay: 100 });
      await this.wait(2000);
      
      // Click first movie result
      const movieButtons = await alexPage.$$('button.w-full');
      if (movieButtons[0]) {
        await movieButtons[0].click();
        console.log('✅ Alex added Inception');
      }
      await this.captureGrid('websocket_sync', 4);
      
      // Scene 2: Multiple users add movies
      console.log('\n🎬 Scene 2: Multiple Users Adding Movies');
      
      // Sam adds a movie
      await this.pages[1].type('input[placeholder="Search for a movie..."]', 'The Matrix', { delay: 100 });
      await this.wait(2000);
      const samButtons = await this.pages[1].$$('button.w-full');
      if (samButtons[0]) {
        await samButtons[0].click();
        console.log('✅ Sam added The Matrix');
      }
      await this.captureGrid('sam_adds_movie', 2);
      
      // Jordan adds a movie
      await this.pages[2].type('input[placeholder="Search for a movie..."]', 'Interstellar', { delay: 100 });
      await this.wait(2000);
      const jordanButtons = await this.pages[2].$$('button.w-full');
      if (jordanButtons[0]) {
        await jordanButtons[0].click();
        console.log('✅ Jordan added Interstellar');
      }
      await this.captureGrid('jordan_adds_movie', 2);
      
      // Casey adds a movie
      await this.pages[3].type('input[placeholder="Search for a movie..."]', 'Parasite', { delay: 100 });
      await this.wait(2000);
      const caseyButtons = await this.pages[3].$$('button.w-full');
      if (caseyButtons[0]) {
        await caseyButtons[0].click();
        console.log('✅ Casey added Parasite');
      }
      await this.captureGrid('all_movies_added', 3);
      
      // Scene 3: Start voting
      console.log('\n🗳️ Scene 3: Start Voting');
      // Alex (admin) starts voting
      const adminButtons = await alexPage.$$('.admin-controls button');
      for (const btn of adminButtons) {
        const text = await alexPage.evaluate(el => el.textContent, btn);
        if (text && text.includes('Start')) {
          await btn.click();
          console.log('✅ Voting started');
          break;
        }
      }
      await this.wait(2000);
      await this.captureGrid('voting_started', 3);
      
      // Scene 4: Users vote at different speeds
      console.log('\n✅ Scene 4: Users Voting');
      
      // Alex votes quickly
      await this.voteForUser(0, [1, 2, 3], 'Alex');
      await this.captureGrid('alex_voting', 2);
      
      // Alex submits first
      await this.submitVote(0, 'Alex');
      await this.captureGrid('alex_submitted', 3);
      
      // Others continue voting
      await this.voteForUser(1, [2, 1, 3], 'Sam');
      await this.captureGrid('sam_voting', 2);
      
      await this.voteForUser(2, [3, 1, 2], 'Jordan');
      await this.captureGrid('jordan_voting', 2);
      
      // Sam submits
      await this.submitVote(1, 'Sam');
      await this.captureGrid('sam_submitted', 2);
      
      // Jordan submits
      await this.submitVote(2, 'Jordan');
      await this.captureGrid('jordan_submitted', 2);
      
      // Casey votes and submits
      await this.voteForUser(3, [2, 3, 1], 'Casey');
      await this.submitVote(3, 'Casey');
      await this.captureGrid('all_voted', 3);
      
      // Scene 5: Show results with IRV rounds
      console.log('\n📊 Scene 5: Results with IRV Rounds');
      
      // Navigate to results
      for (const page of this.pages) {
        try {
          await page.goto(this.roomUrl.replace('/vote', '/results'));
        } catch (e) {}
      }
      await this.wait(3000);
      await this.captureGrid('results_page', 3);
      
      // Expand IRV rounds on first user's page
      try {
        const toggleButton = await alexPage.$('button:has-text("Show elimination rounds")');
        if (toggleButton) {
          await toggleButton.click();
          console.log('✅ Expanded IRV rounds');
          await this.captureGrid('irv_rounds_expanded', 4);
        }
      } catch (e) {
        console.log('Could not expand IRV rounds');
      }
      
      // Generate video
      await this.generateVideo();
      
      console.log('\n✅ Demo complete!');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    } finally {
      // Close contexts
      for (const context of this.contexts) {
        await context.close();
      }
      if (this.browser) await this.browser.close();
    }
  }

  async voteForUser(userIndex, rankings, userName) {
    const page = this.pages[userIndex];
    const movieElements = await page.$$('.movie-card');
    
    for (let i = 0; i < Math.min(rankings.length, movieElements.length); i++) {
      const rank = rankings[i];
      const buttons = await movieElements[i].$$('button');
      
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.trim() === String(rank)) {
          await btn.click();
          await this.wait(300);
          break;
        }
      }
    }
    
    console.log(`✅ ${userName} ranked movies`);
  }

  async submitVote(userIndex, userName) {
    const page = this.pages[userIndex];
    const submitButton = await page.$('button:has-text("Submit")');
    if (submitButton) {
      await submitButton.click();
      console.log(`✅ ${userName} submitted vote`);
    }
  }

  async generateVideo() {
    console.log('\n🎥 Generating video...');
    
    try {
      // Create 2x2 composites
      const files = await fs.readdir(this.outputDir);
      const frameNumbers = new Set();
      
      for (const file of files) {
        const match = file.match(/frame_(\d{4})_user/);
        if (match) {
          frameNumbers.add(match[1]);
        }
      }
      
      // Create composite for each frame
      for (const frameNum of Array.from(frameNumbers).sort()) {
        const userFiles = [];
        for (let i = 0; i < 4; i++) {
          userFiles.push(path.join(this.outputDir, `frame_${frameNum}_user${i}.png`));
        }
        
        // Check all files exist
        let allExist = true;
        for (const file of userFiles) {
          try {
            await fs.access(file);
          } catch {
            allExist = false;
            break;
          }
        }
        
        if (allExist) {
          const outputFile = path.join(this.outputDir, `composite_${frameNum}.png`);
          const cmd = `ffmpeg -y -i "${userFiles[0]}" -i "${userFiles[1]}" -i "${userFiles[2]}" -i "${userFiles[3]}" -filter_complex "[0:v][1:v]hstack=inputs=2[top];[2:v][3:v]hstack=inputs=2[bottom];[top][bottom]vstack=inputs=2,scale=1920:1600[v]" -map "[v]" "${outputFile}"`;
          
          await execPromise(cmd);
        }
      }
      
      // Generate video from composites
      const outputPath = path.join(__dirname, '..', 'public', 'videos', 'comprehensive_4user_demo.mp4');
      const videoCmd = `ffmpeg -y -framerate 2 -pattern_type glob -i "${this.outputDir}/composite_*.png" -c:v libx264 -pix_fmt yuv420p -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" "${outputPath}"`;
      
      await execPromise(videoCmd);
      console.log(`✅ Video saved to: ${outputPath}`);
      
      // Also create a shorter highlight version
      const highlightCmd = `ffmpeg -y -i "${outputPath}" -t 60 -c copy "${path.join(__dirname, '..', 'public', 'videos', 'comprehensive_4user_demo_60s.mp4')}"`;
      await execPromise(highlightCmd);
      console.log('✅ Created 60-second highlight version');
      
    } catch (error) {
      console.error('Video generation failed:', error.message);
    }
  }
}

// Run the demo
if (require.main === module) {
  const demo = new Quick4UserDemo();
  demo.run().catch(console.error);
}

module.exports = Quick4UserDemo;