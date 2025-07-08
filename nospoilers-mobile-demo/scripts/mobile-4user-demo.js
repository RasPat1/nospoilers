const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class Mobile4UserDemo {
  constructor() {
    this.browser = null;
    this.frameDir = path.join(__dirname, '..', 'frames');
    this.outputDir = path.join(__dirname, '..', 'output');
    this.frameIndex = 0;
    this.appUrl = process.env.APP_URL || 'http://localhost:8080';
    this.pages = [];
    
    // Cinephile users with emojis
    this.users = [
      { name: 'Art House', emoji: '🎭', color: '#FF6B6B', isAdmin: true },
      { name: 'Rom-Com Fan', emoji: '💕', color: '#4ECDC4' },
      { name: 'Sci-Fi Nerd', emoji: '🚀', color: '#45B7D1' },
      { name: 'Indie Buff', emoji: '🎬', color: '#96CEB4' }
    ];
    
    // Fringe movie selection
    this.movies = [
      { title: 'Everything Everywhere All at Once', addedBy: 0 }, // Clever wordplay
      { title: 'The Lobster', addedBy: 1 },
      { title: 'Swiss Army Man', addedBy: 2 },
      { title: 'Under the Skin', addedBy: 3 },
      { title: 'Coherence', addedBy: 0 },
      { title: 'The Man from Earth', addedBy: 1 }
    ];
  }

  async init() {
    console.log('🎬 Initializing Mobile 4-User Demo...\n');
    
    // Create directories
    await fs.mkdir(this.frameDir, { recursive: true });
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Clean existing frames
    try {
      const files = await fs.readdir(this.frameDir);
      for (const file of files) {
        if (file.endsWith('.png')) {
          await fs.unlink(path.join(this.frameDir, file));
        }
      }
    } catch (e) {}

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 400, height: 800 },
      protocolTimeout: 300000
    });
    
    console.log('✅ Browser launched with mobile viewport');
  }

  async captureFrame() {
    const screenshots = await Promise.all(
      this.pages.map(async (page, i) => {
        try {
          return await page.screenshot();
        } catch (e) {
          console.error(`Failed to capture user ${i}:`, e.message);
          return null;
        }
      })
    );
    
    // Save individual frames
    const frameFiles = [];
    for (let i = 0; i < screenshots.length; i++) {
      if (screenshots[i]) {
        const filename = `frame_${String(this.frameIndex).padStart(5, '0')}_user${i}.png`;
        const filepath = path.join(this.frameDir, filename);
        await fs.writeFile(filepath, screenshots[i]);
        frameFiles.push(filepath);
      }
    }
    
    // Create horizontal composite with phones directly adjacent
    if (frameFiles.length === 4) {
      const compositeFile = path.join(this.frameDir, `composite_${String(this.frameIndex).padStart(5, '0')}.png`);
      const cmd = `ffmpeg -y ${frameFiles.map(f => `-i "${f}"`).join(' ')} ` +
        `-filter_complex "[0:v][1:v][2:v][3:v]hstack=inputs=4:shortest=1" "${compositeFile}"`;
      
      try {
        await execPromise(cmd);
        // Clean up individual frames
        for (const file of frameFiles) {
          await fs.unlink(file);
        }
      } catch (e) {
        console.error('Failed to create composite:', e.message);
      }
    }
    
    this.frameIndex++;
  }

  async captureScene(label, frames = 6) {
    console.log(`📸 Scene: ${label}`);
    for (let i = 0; i < frames; i++) {
      await this.captureFrame();
      await this.wait(500);
    }
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async setupRoom() {
    console.log('\n🏠 Setting up room...');
    
    // Clear existing data
    try {
      const response = await fetch(`${this.appUrl}/api/votes/clear`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        console.log('✅ Cleared existing data');
      }
    } catch (e) {
      console.log('⚠️  Could not clear data:', e.message);
    }
    
    // Create room with first user
    const setupPage = await this.browser.newPage();
    await setupPage.goto(this.appUrl);
    await setupPage.waitForSelector('button', { timeout: 20000 });
    
    // Click create room button
    const createButton = await setupPage.$('button');
    if (createButton) {
      await createButton.click();
      await setupPage.waitForNavigation();
      this.roomUrl = setupPage.url();
      console.log(`✅ Room created: ${this.roomUrl}`);
    }
    
    await setupPage.close();
  }

  async createUsers() {
    console.log('\n👥 Creating users...');
    
    for (let i = 0; i < 4; i++) {
      const page = await this.browser.newPage();
      await page.goto(this.roomUrl);
      await page.waitForSelector('input[placeholder="Search for a movie..."]', { timeout: 30000 });
      
      // Add user indicator at bottom
      await page.evaluate((user) => {
        const indicator = document.createElement('div');
        indicator.innerHTML = `${user.emoji} ${user.name}`;
        indicator.style.cssText = `
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: ${user.color};
          color: white;
          padding: 12px 30px;
          border-radius: 30px;
          font-size: 18px;
          font-weight: bold;
          z-index: 10000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          display: flex;
          align-items: center;
          gap: 8px;
        `;
        document.body.appendChild(indicator);
      }, this.users[i]);
      
      this.pages.push(page);
      console.log(`✅ ${this.users[i].emoji} ${this.users[i].name} joined`);
    }
  }

  async addMovie(userIndex, movieTitle) {
    const page = this.pages[userIndex];
    const user = this.users[userIndex];
    
    console.log(`\n🎬 ${user.emoji} ${user.name} adding "${movieTitle}"`);
    
    // Clear search and type movie name
    const searchInput = await page.$('input[placeholder="Search for a movie..."]');
    if (searchInput) {
      await searchInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.type('input[placeholder="Search for a movie..."]', movieTitle, { delay: 50 });
      
      // Capture typing
      await this.captureScene(`${user.name} searching for "${movieTitle}"`, 4);
      
      await this.wait(2000); // Wait for search results
      
      // Click first result or add anyway
      try {
        const movieButton = await page.$('button.w-full');
        if (movieButton) {
          await movieButton.click();
          await this.wait(1000);
          
          // If it's "Everything Everywhere", add special emphasis
          if (movieTitle.includes('Everything Everywhere')) {
            // Add temporary highlight on all screens
            for (const p of this.pages) {
              await p.evaluate(() => {
                const highlight = document.createElement('div');
                highlight.textContent = '✨ Movie appeared everywhere all at once! ✨';
                highlight.style.cssText = `
                  position: fixed;
                  top: 100px;
                  left: 50%;
                  transform: translateX(-50%);
                  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
                  color: white;
                  padding: 15px 30px;
                  border-radius: 25px;
                  font-size: 16px;
                  font-weight: bold;
                  z-index: 10001;
                  animation: pulse 2s ease-in-out;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                `;
                document.body.appendChild(highlight);
                
                const style = document.createElement('style');
                style.textContent = `
                  @keyframes pulse {
                    0%, 100% { transform: translateX(-50%) scale(1); opacity: 1; }
                    50% { transform: translateX(-50%) scale(1.05); }
                  }
                `;
                document.head.appendChild(style);
                
                setTimeout(() => highlight.remove(), 3000);
              });
            }
            
            await this.captureScene('Movie synced everywhere all at once!', 8);
          } else {
            await this.captureScene(`${movieTitle} added and synced`, 4);
          }
          
          console.log(`✅ Added ${movieTitle}`);
        }
      } catch (e) {
        console.log(`⚠️  Could not add ${movieTitle}:`, e.message);
      }
    }
  }

  async startVoting() {
    console.log('\n🗳️ Starting voting phase...');
    
    // Art House (admin) starts voting
    const adminPage = this.pages[0];
    const adminControls = await adminPage.$$('.admin-controls button');
    
    for (const btn of adminControls) {
      const text = await adminPage.evaluate(el => el.textContent, btn);
      if (text && text.includes('Start')) {
        await btn.click();
        console.log('✅ Art House started the voting');
        break;
      }
    }
    
    await this.wait(2000);
    await this.captureScene('Voting phase started', 4);
  }

  async rankMovies(userIndex, rankings) {
    const page = this.pages[userIndex];
    const user = this.users[userIndex];
    
    console.log(`\n${user.emoji} ${user.name} ranking movies...`);
    
    // Click rank buttons for each movie
    const movieCards = await page.$$('.movie-card');
    
    for (let i = 0; i < Math.min(rankings.length, movieCards.length); i++) {
      const movieIndex = rankings[i];
      if (movieIndex < movieCards.length) {
        const buttons = await movieCards[movieIndex].$$('button');
        
        // Find the rank button (1, 2, 3, etc.)
        for (const btn of buttons) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && text.trim() === String(i + 1)) {
            await btn.click();
            await this.wait(300);
            break;
          }
        }
      }
    }
    
    await this.captureScene(`${user.name} ranking movies`, 3);
  }

  async changeRanking(userIndex) {
    const page = this.pages[userIndex];
    const user = this.users[userIndex];
    
    console.log(`\n${user.emoji} ${user.name} changing their mind...`);
    
    // Clear rankings
    const clearButton = await page.$('button:has-text("Clear")');
    if (clearButton) {
      await clearButton.click();
      await this.wait(500);
    }
    
    // Re-rank with different order
    await this.rankMovies(userIndex, [2, 0, 3]);
    await this.captureScene(`${user.name} changed rankings`, 3);
  }

  async submitVote(userIndex) {
    const page = this.pages[userIndex];
    const user = this.users[userIndex];
    
    console.log(`\n${user.emoji} ${user.name} submitting vote...`);
    
    const submitButton = await page.$('button:has-text("Submit Rankings")');
    if (submitButton) {
      await submitButton.click();
      await this.wait(1500);
      console.log(`✅ ${user.name} submitted their vote`);
      
      // If it's the first voter, navigate to results
      if (userIndex === 0) {
        await page.goto(this.roomUrl.replace('/vote', '/results'));
        await this.wait(2000);
        await this.captureScene(`${user.name} watching live results`, 4);
      } else {
        await this.captureScene(`${user.name} submitted - results updating`, 4);
      }
    }
  }

  async showIRVRounds() {
    console.log('\n📊 Demonstrating Instant Runoff Voting...');
    
    // Navigate all users to results
    for (let i = 0; i < this.pages.length; i++) {
      if (i > 0) { // First user already on results
        await this.pages[i].goto(this.roomUrl.replace('/vote', '/results'));
      }
    }
    await this.wait(2000);
    await this.captureScene('All users viewing results', 4);
    
    // Art House expands IRV rounds
    const artHousePage = this.pages[0];
    
    // Look for elimination rounds button
    const buttons = await artHousePage.$$('button');
    let found = false;
    
    for (const btn of buttons) {
      const text = await artHousePage.evaluate(el => el.textContent, btn);
      if (text && text.toLowerCase().includes('elimination')) {
        await btn.click();
        found = true;
        console.log('✅ Expanded IRV elimination rounds');
        break;
      }
    }
    
    if (found) {
      await this.wait(1500);
      
      // Add visual emphasis to IRV explanation
      await artHousePage.evaluate(() => {
        const explanation = document.createElement('div');
        explanation.innerHTML = `
          <div style="margin-bottom: 10px; font-weight: bold;">🗳️ How Ranked Choice Works:</div>
          <div>1. No movie has >50% first choice votes</div>
          <div>2. Eliminate lowest vote getter</div>
          <div>3. Redistribute their voters' 2nd choices</div>
          <div>4. Repeat until majority winner!</div>
        `;
        explanation.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 20px 30px;
          border-radius: 15px;
          font-size: 14px;
          z-index: 10001;
          box-shadow: 0 4px 30px rgba(0,0,0,0.5);
          max-width: 350px;
          line-height: 1.5;
        `;
        document.body.appendChild(explanation);
        
        setTimeout(() => explanation.remove(), 5000);
      });
      
      await this.captureScene('IRV rounds explained', 10);
      await this.captureScene('Majority winner determined!', 6);
    }
  }

  async generateVideo() {
    console.log('\n🎥 Generating video...');
    
    try {
      // Create video from composite frames
      const outputPath = path.join(this.outputDir, 'mobile-4user-demo-full.mp4');
      const cmd = `ffmpeg -y -framerate 2 -pattern_type glob -i "${this.frameDir}/composite_*.png" ` +
        `-c:v libx264 -pix_fmt yuv420p -vf "scale=1600:-2" "${outputPath}"`;
      
      await execPromise(cmd);
      console.log(`✅ Full video: ${outputPath}`);
      
      // Get video duration
      const durationCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputPath}"`;
      const { stdout } = await execPromise(durationCmd);
      const duration = parseFloat(stdout);
      
      // Create 60-second version if needed
      if (duration > 60) {
        const speed = duration / 60;
        const output60s = path.join(this.outputDir, 'mobile-4user-demo-60s.mp4');
        const cmd60s = `ffmpeg -y -i "${outputPath}" -filter:v "setpts=${1/speed}*PTS" -t 60 "${output60s}"`;
        await execPromise(cmd60s);
        console.log(`✅ 60-second version: ${output60s}`);
      }
      
      // Create 30-second version
      if (duration > 30) {
        const speed = duration / 30;
        const output30s = path.join(this.outputDir, 'mobile-4user-demo-30s.mp4');
        const cmd30s = `ffmpeg -y -i "${outputPath}" -filter:v "setpts=${1/speed}*PTS" -t 30 "${output30s}"`;
        await execPromise(cmd30s);
        console.log(`✅ 30-second version: ${output30s}`);
      }
      
      // Extract thumbnail
      const thumbnail = path.join(this.outputDir, 'mobile-4user-demo-thumbnail.jpg');
      const thumbCmd = `ffmpeg -y -i "${outputPath}" -vf "select=eq(n\\,24)" -vframes 1 "${thumbnail}"`;
      await execPromise(thumbCmd);
      console.log(`✅ Thumbnail: ${thumbnail}`);
      
    } catch (error) {
      console.error('❌ Video generation failed:', error.message);
    }
  }

  async run() {
    try {
      await this.init();
      
      // Setup and join
      await this.setupRoom();
      await this.createUsers();
      await this.captureScene('All users joined', 6);
      
      // Add movies with WebSocket sync demo
      for (const movie of this.movies) {
        await this.addMovie(movie.addedBy, movie.title);
        await this.wait(1000);
      }
      
      // Start voting
      await this.startVoting();
      
      // Users rank movies
      await this.rankMovies(0, [0, 4, 2]); // Art House
      await this.rankMovies(1, [1, 0, 5]); // Rom-Com Fan
      await this.rankMovies(2, [2, 3, 0]); // Sci-Fi Nerd
      await this.rankMovies(3, [3, 1, 4]); // Indie Buff
      
      // Show someone changing their mind
      await this.changeRanking(1);
      
      // Submit votes with live updates
      await this.submitVote(0); // Art House goes to results
      await this.wait(2000);
      await this.submitVote(1); // Updates visible
      await this.wait(2000);
      await this.submitVote(2); // More updates
      await this.wait(2000);
      await this.submitVote(3); // Final vote
      
      // Show IRV elimination rounds
      await this.showIRVRounds();
      
      // Generate video
      await this.generateVideo();
      
      console.log('\n🎉 Demo complete!');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the demo
if (require.main === module) {
  const demo = new Mobile4UserDemo();
  demo.run().catch(console.error);
}

module.exports = Mobile4UserDemo;