const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class Horizontal4UserDemo {
  constructor() {
    this.browser = null;
    this.outputDir = path.join(__dirname, 'horizontal-4user-frames');
    this.frameIndex = 0;
    this.appUrl = 'http://localhost:8080';
    this.pages = [];
    this.adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    this.users = [
      { name: 'Alex', color: '#FF6B6B' },
      { name: 'Sam', color: '#4ECDC4' },
      { name: 'Jordan', color: '#45B7D1' },
      { name: 'Casey', color: '#96CEB4' }
    ];
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

    // Launch browser with mobile viewport for each user
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 480, height: 900 }, // Taller for better visibility
      protocolTimeout: 300000
    });
    
    console.log('✅ Browser launched');
  }

  async captureHorizontal(label, duration = 3) {
    console.log(`📸 Capturing: ${label}`);
    
    for (let frame = 0; frame < duration; frame++) {
      const screenshots = await Promise.all(
        this.pages.map(page => page.screenshot().catch(() => null))
      );
      
      // Save individual screenshots
      for (let i = 0; i < screenshots.length; i++) {
        if (screenshots[i]) {
          const filename = `frame_${String(this.frameIndex).padStart(4, '0')}_user${i}.png`;
          await fs.writeFile(path.join(this.outputDir, filename), screenshots[i]);
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
    // Clear existing data
    try {
      await fetch(`${this.appUrl}/api/votes/clear`, { method: 'POST' });
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
    for (let i = 0; i < 4; i++) {
      const page = await this.browser.newPage();
      await page.goto(this.roomUrl);
      await page.waitForSelector('input[placeholder="Search for a movie..."]', { timeout: 20000 });
      
      // Add user label at top
      await page.evaluate((name, color) => {
        const label = document.createElement('div');
        label.textContent = name;
        label.style.cssText = `
          position: fixed;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          background: ${color};
          color: white;
          padding: 8px 20px;
          border-radius: 25px;
          font-size: 16px;
          font-weight: bold;
          z-index: 10000;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(label);
      }, this.users[i].name, this.users[i].color);
      
      this.pages.push(page);
      console.log(`✅ ${this.users[i].name} joined`);
    }
  }

  async addMovie(userIndex, movieName) {
    const page = this.pages[userIndex];
    const searchInput = await page.$('input[placeholder="Search for a movie..."]');
    
    // Clear and type
    await searchInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[placeholder="Search for a movie..."]', movieName, { delay: 100 });
    await this.wait(2000);
    
    // Click first result
    const movieButtons = await page.$$('button.w-full');
    if (movieButtons[0]) {
      await movieButtons[0].click();
      console.log(`✅ ${this.users[userIndex].name} added ${movieName}`);
      await this.wait(1000);
    }
  }

  async voteForUser(userIndex, rankings, userName) {
    const page = this.pages[userIndex];
    const movieCards = await page.$$('.movie-card');
    
    for (let i = 0; i < Math.min(rankings.length, movieCards.length); i++) {
      const rank = rankings[i];
      // Find the rank button within each movie card
      const buttons = await movieCards[i].$$('button');
      
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.trim() === String(rank)) {
          await btn.click();
          await this.wait(500);
          break;
        }
      }
    }
    
    console.log(`✅ ${userName} ranked movies`);
  }

  async submitVote(userIndex, userName) {
    const page = this.pages[userIndex];
    const buttons = await page.$$('button');
    
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Submit')) {
        await btn.click();
        console.log(`✅ ${userName} submitted vote`);
        break;
      }
    }
  }

  async run() {
    try {
      await this.init();
      
      console.log('\n🎬 Horizontal 4-User Demo\n');
      
      // Setup room and users
      await this.setupRoom();
      await this.createUsers();
      await this.captureHorizontal('01_users_joined', 3);
      
      // Scene 1: WebSocket sync - Alex adds a movie
      console.log('\n📽️ Scene 1: WebSocket Real-time Sync');
      await this.addMovie(0, 'Inception');
      await this.captureHorizontal('02_websocket_sync', 4);
      
      // Scene 2: Multiple users add movies quickly
      console.log('\n🎬 Scene 2: Multiple Users Adding Movies');
      await this.addMovie(1, 'The Matrix');
      await this.captureHorizontal('03_sam_adds', 2);
      
      await this.addMovie(2, 'Interstellar');
      await this.captureHorizontal('04_jordan_adds', 2);
      
      await this.addMovie(3, 'Parasite');
      await this.captureHorizontal('05_all_movies', 3);
      
      // Scene 3: Start voting
      console.log('\n🗳️ Scene 3: Start Voting');
      const adminPage = this.pages[0];
      const adminButtons = await adminPage.$$('.admin-controls button');
      for (const btn of adminButtons) {
        const text = await adminPage.evaluate(el => el.textContent, btn);
        if (text && text.includes('Start')) {
          await btn.click();
          console.log('✅ Voting started');
          break;
        }
      }
      await this.wait(2000);
      await this.captureHorizontal('06_voting_started', 3);
      
      // Scene 4: Users vote at different speeds
      console.log('\n✅ Scene 4: Different Speed Voting');
      
      // Alex votes and submits first
      await this.voteForUser(0, [1, 2, 3], 'Alex');
      await this.captureHorizontal('07_alex_voting', 2);
      await this.submitVote(0, 'Alex');
      await this.captureHorizontal('08_alex_submitted', 3);
      
      // Others continue voting
      await this.voteForUser(1, [2, 1, 3], 'Sam');
      await this.voteForUser(2, [3, 1, 2], 'Jordan');
      await this.captureHorizontal('09_others_voting', 2);
      
      // Submit votes one by one
      await this.submitVote(1, 'Sam');
      await this.captureHorizontal('10_sam_submitted', 2);
      
      await this.submitVote(2, 'Jordan');
      await this.captureHorizontal('11_jordan_submitted', 2);
      
      // Casey votes last
      await this.voteForUser(3, [2, 3, 1], 'Casey');
      await this.submitVote(3, 'Casey');
      await this.captureHorizontal('12_all_voted', 3);
      
      // Scene 5: Results with IRV expansion
      console.log('\n📊 Scene 5: Results & IRV Rounds');
      
      // Navigate to results
      for (const page of this.pages) {
        try {
          await page.goto(this.roomUrl.replace('/vote', '/results'));
        } catch (e) {}
      }
      await this.wait(3000);
      await this.captureHorizontal('13_results_page', 3);
      
      // Expand IRV rounds on Alex's screen
      try {
        const toggleButton = await this.pages[0].$('button:has-text("Show elimination rounds")');
        if (toggleButton) {
          await toggleButton.click();
          console.log('✅ Expanded IRV rounds');
          await this.captureHorizontal('14_irv_expanded', 4);
        }
      } catch (e) {
        console.log('Could not find IRV toggle button');
      }
      
      // Generate video
      await this.generateVideo();
      
      console.log('\n✅ Demo complete!');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    } finally {
      if (this.browser) await this.browser.close();
    }
  }

  async generateVideo() {
    console.log('\n🎥 Generating horizontal video...');
    
    try {
      const files = await fs.readdir(this.outputDir);
      const frameNumbers = new Set();
      
      for (const file of files) {
        const match = file.match(/frame_(\d{4})_user/);
        if (match) {
          frameNumbers.add(match[1]);
        }
      }
      
      // Create horizontal composites (4 users side by side)
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
          const outputFile = path.join(this.outputDir, `horizontal_${frameNum}.png`);
          // Create horizontal layout (4x1)
          const cmd = `ffmpeg -y -i "${userFiles[0]}" -i "${userFiles[1]}" -i "${userFiles[2]}" -i "${userFiles[3]}" -filter_complex "[0:v][1:v][2:v][3:v]hstack=inputs=4,scale=1920:450[v]" -map "[v]" "${outputFile}"`;
          
          await execPromise(cmd);
        }
      }
      
      // Generate video from horizontal composites
      const outputPath = path.join(__dirname, '..', 'public', 'videos', 'horizontal_4user_demo.mp4');
      const videoCmd = `ffmpeg -y -framerate 2 -pattern_type glob -i "${this.outputDir}/horizontal_*.png" -c:v libx264 -pix_fmt yuv420p -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" "${outputPath}"`;
      
      await execPromise(videoCmd);
      console.log(`✅ Video saved to: ${outputPath}`);
      
      // Create a 60-second version
      const shortCmd = `ffmpeg -y -i "${outputPath}" -t 60 -c copy "${path.join(__dirname, '..', 'public', 'videos', 'horizontal_4user_demo_60s.mp4')}"`;
      await execPromise(shortCmd);
      console.log('✅ Created 60-second version');
      
    } catch (error) {
      console.error('Video generation failed:', error.message);
    }
  }
}

// Run the demo
if (require.main === module) {
  const demo = new Horizontal4UserDemo();
  demo.run().catch(console.error);
}

module.exports = Horizontal4UserDemo;