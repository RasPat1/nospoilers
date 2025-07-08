const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class Reliable4UserDemo {
  constructor() {
    this.browser = null;
    this.outputDir = path.join(__dirname, 'reliable-4-user-demo-frames');
    this.frameIndex = 0;
    this.appUrl = 'http://localhost:8080';
    this.pages = [];
    this.adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  }

  async init() {
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Clean frames
    try {
      const files = await fs.readdir(this.outputDir);
      for (const file of files) {
        if (file.endsWith('.png')) {
          await fs.unlink(path.join(this.outputDir, file));
        }
      }
    } catch (e) {}

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 480, height: 720 }
    });
    
    console.log('✅ Browser launched');
  }

  async captureAllScreens(label) {
    const filename = `frame_${String(this.frameIndex).padStart(4, '0')}_${label}`;
    
    // Capture each page
    for (let i = 0; i < this.pages.length; i++) {
      try {
        await this.pages[i].screenshot({ 
          path: path.join(this.outputDir, `${filename}_user${i}.png`)
        });
      } catch (e) {
        console.log(`Failed to capture user ${i}`);
      }
    }
    
    this.frameIndex++;
    console.log(`📸 Captured: ${label}`);
  }

  async wait(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async run() {
    try {
      await this.init();
      
      console.log('\n🎬 Reliable 4-User Demo\n');
      
      // 1. Create room and reset data
      console.log('📍 Setting up...');
      await this.setupRoom();
      
      // 2. Create 4 users
      console.log('\n👥 Creating 4 users...');
      await this.createUsers();
      await this.captureAllScreens('01_users_joined');
      
      // 3. Add movies
      console.log('\n🎬 Adding movies...');
      await this.addMovies();
      await this.captureAllScreens('02_movies_added');
      
      // 4. Start voting
      console.log('\n🗳️ Starting voting...');
      await this.startVoting();
      await this.captureAllScreens('03_voting_started');
      
      // 5. Users vote
      console.log('\n✅ Users voting...');
      await this.usersVote();
      await this.captureAllScreens('04_users_voted');
      
      // 6. Show results
      console.log('\n📊 Showing results...');
      await this.showResults();
      await this.captureAllScreens('05_results');
      
      // 7. Generate video
      console.log('\n🎥 Generating video...');
      await this.generateVideo();
      
      console.log('\n✅ Demo complete!');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    } finally {
      if (this.browser) await this.browser.close();
    }
  }

  async setupRoom() {
    // Create admin page to reset
    const adminPage = await this.browser.newPage();
    await adminPage.goto(`${this.appUrl}/admin?admin=${this.adminPassword}`);
    await this.wait(2000);
    
    // Try to reset
    try {
      const resetButton = await adminPage.$('button:has-text("Reset")');
      if (resetButton) {
        await resetButton.click();
        await this.wait(1000);
      }
    } catch (e) {}
    
    await adminPage.close();
    
    // Create new room
    const page = await this.browser.newPage();
    await page.goto(this.appUrl);
    await page.waitForSelector('button');
    
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
    console.log(`Room: ${this.roomUrl}`);
    await page.close();
  }

  async createUsers() {
    const users = [
      { name: 'Alex', color: '#FF6B6B' },
      { name: 'Sam', color: '#4ECDC4' },
      { name: 'Jordan', color: '#45B7D1' },
      { name: 'Casey', color: '#96CEB4' }
    ];
    
    for (let i = 0; i < 4; i++) {
      const page = await this.browser.newPage();
      await page.goto(this.roomUrl);
      await page.waitForSelector('input[placeholder="Search for a movie..."]', { timeout: 20000 });
      
      // Add user label
      await page.evaluate((name, color) => {
        const label = document.createElement('div');
        label.textContent = name;
        label.style.cssText = `
          position: fixed;
          top: 5px;
          left: 5px;
          background: ${color};
          color: white;
          padding: 3px 10px;
          border-radius: 15px;
          font-size: 12px;
          font-weight: bold;
          z-index: 10000;
        `;
        document.body.appendChild(label);
      }, users[i].name, users[i].color);
      
      this.pages.push(page);
      console.log(`✅ ${users[i].name} joined`);
    }
  }

  async addMovies() {
    const movies = [
      { user: 0, movie: 'Inception' },
      { user: 1, movie: 'La La Land' },
      { user: 2, movie: 'Interstellar' },
      { user: 3, movie: 'Parasite' }
    ];
    
    for (const { user, movie } of movies) {
      try {
        const page = this.pages[user];
        await page.type('input[placeholder="Search for a movie..."]', movie);
        await this.wait(2000);
        
        const buttons = await page.$$('button.w-full');
        if (buttons[0]) {
          await buttons[0].click();
          console.log(`✅ User ${user + 1} added ${movie}`);
          await this.wait(1000);
        }
      } catch (e) {
        console.log(`Failed to add ${movie}`);
      }
    }
  }

  async startVoting() {
    // First user is admin
    try {
      const adminButtons = await this.pages[0].$$('.admin-controls button');
      for (const btn of adminButtons) {
        const text = await this.pages[0].evaluate(el => el.textContent, btn);
        if (text && text.includes('Start')) {
          await btn.click();
          console.log('✅ Voting started');
          await this.wait(2000);
          return;
        }
      }
    } catch (e) {
      console.log('Could not start voting');
    }
  }

  async usersVote() {
    // Simple voting - each user votes for 3 movies
    for (let i = 0; i < this.pages.length; i++) {
      try {
        const page = this.pages[i];
        
        // Click first 3 rank buttons
        const buttons = await page.$$('button');
        let rankCount = 0;
        
        for (const btn of buttons) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && ['1', '2', '3'].includes(text.trim()) && rankCount < 3) {
            await btn.click();
            rankCount++;
            await this.wait(300);
          }
        }
        
        // Submit
        for (const btn of buttons) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && text.includes('Submit')) {
            await btn.click();
            console.log(`✅ User ${i + 1} voted`);
            break;
          }
        }
      } catch (e) {
        console.log(`User ${i + 1} vote failed`);
      }
    }
  }

  async showResults() {
    for (let i = 0; i < this.pages.length; i++) {
      try {
        await this.pages[i].goto(this.roomUrl.replace('/vote', '/results'));
      } catch (e) {}
    }
    await this.wait(3000);
  }

  async generateVideo() {
    try {
      // Create composites
      const files = await fs.readdir(this.outputDir);
      const frameGroups = {};
      
      for (const file of files) {
        const match = file.match(/frame_(\d{4})/);
        if (match) {
          const frameNum = match[1];
          if (!frameGroups[frameNum]) frameGroups[frameNum] = [];
          frameGroups[frameNum].push(file);
        }
      }
      
      // Create 2x2 grids
      for (const [frameNum, frameFiles] of Object.entries(frameGroups)) {
        if (frameFiles.length === 4) {
          const sortedFiles = frameFiles.sort();
          const inputs = sortedFiles.map(f => `-i "${path.join(this.outputDir, f)}"`).join(' ');
          
          const cmd = `ffmpeg -y ${inputs} -filter_complex "[0:v][1:v]hstack=inputs=2[top];[2:v][3:v]hstack=inputs=2[bottom];[top][bottom]vstack=inputs=2,scale=1920:1080[v]" -map "[v]" "${path.join(this.outputDir, `composite_${frameNum}.png`)}"`;
          
          await execPromise(cmd);
        }
      }
      
      // Generate video
      const outputPath = path.join(__dirname, 'nospoilers_4user_demo_new.mp4');
      const videoCmd = `ffmpeg -y -framerate 1 -pattern_type glob -i "${this.outputDir}/composite_*.png" -c:v libx264 -pix_fmt yuv420p "${outputPath}"`;
      
      await execPromise(videoCmd);
      console.log(`✅ Video: ${outputPath}`);
      
      // Copy to public
      await fs.copyFile(outputPath, path.join(__dirname, '..', 'public', 'videos', 'complete_4user_demo.mp4'));
      console.log('✅ Copied to public/videos/');
      
    } catch (error) {
      console.error('Video generation failed:', error.message);
    }
  }
}

// Run
if (require.main === module) {
  const demo = new Reliable4UserDemo();
  demo.run().catch(console.error);
}

module.exports = Reliable4UserDemo;