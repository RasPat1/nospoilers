const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class PerfectHorizontalDemo {
  constructor() {
    this.browser = null;
    this.outputDir = path.join(__dirname, 'perfect-horizontal-frames');
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
    this.movies = [
      'Inception',
      'The Matrix', 
      'Interstellar',
      'Parasite',
      'Everything Everywhere All at Once',
      'The Grand Budapest Hotel'
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

    // Launch browser with mobile viewport
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 400, height: 800 }, // Mobile phone dimensions
      protocolTimeout: 300000
    });
    
    console.log('✅ Browser launched');
  }

  async captureFrames(label, duration = 3) {
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
      
      // Add user indicator at bottom
      await page.evaluate((name, color) => {
        const indicator = document.createElement('div');
        indicator.textContent = name;
        indicator.style.cssText = `
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: ${color};
          color: white;
          padding: 10px 25px;
          border-radius: 25px;
          font-size: 16px;
          font-weight: bold;
          z-index: 10000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(indicator);
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
    await page.type('input[placeholder="Search for a movie..."]', movieName, { delay: 50 });
    await this.wait(2000);
    
    // Click first result
    const movieButtons = await page.$$('button.w-full');
    if (movieButtons[0]) {
      await movieButtons[0].click();
      console.log(`✅ ${this.users[userIndex].name} added ${movieName}`);
      await this.wait(1500);
    }
  }

  async voteForUser(userIndex, rankings) {
    const page = this.pages[userIndex];
    const movieCards = await page.$$('.movie-card');
    
    // Vote for movies based on rankings
    for (let i = 0; i < Math.min(rankings.length, movieCards.length); i++) {
      const movieIndex = rankings[i] - 1; // Convert to 0-based index
      if (movieIndex < movieCards.length) {
        // Find rank button (i+1) in the movie card
        const buttons = await movieCards[movieIndex].$$('button');
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
    
    console.log(`✅ ${this.users[userIndex].name} ranked movies`);
  }

  async submitVote(userIndex) {
    const page = this.pages[userIndex];
    const buttons = await page.$$('button');
    
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Submit')) {
        await btn.click();
        console.log(`✅ ${this.users[userIndex].name} submitted vote`);
        break;
      }
    }
  }

  async run() {
    try {
      await this.init();
      
      console.log('\n🎬 Perfect Horizontal 4-User Demo\n');
      
      // Setup room and users
      await this.setupRoom();
      await this.createUsers();
      await this.captureFrames('01_users_joined', 3);
      
      // Scene 1: WebSocket sync - Alex adds first movie
      console.log('\n📽️ Scene 1: WebSocket Real-time Sync');
      await this.addMovie(0, this.movies[0]);
      await this.captureFrames('02_first_movie_synced', 3);
      
      // Scene 2: Multiple users add movies
      console.log('\n🎬 Scene 2: Adding Multiple Movies');
      
      // Sam adds a movie
      await this.addMovie(1, this.movies[1]);
      await this.captureFrames('03_second_movie', 2);
      
      // Jordan adds a movie
      await this.addMovie(2, this.movies[2]);
      await this.captureFrames('04_third_movie', 2);
      
      // Casey adds a movie
      await this.addMovie(3, this.movies[3]);
      await this.captureFrames('05_fourth_movie', 2);
      
      // Alex adds another movie
      await this.addMovie(0, this.movies[4]);
      await this.captureFrames('06_fifth_movie', 2);
      
      // Sam adds the final movie
      await this.addMovie(1, this.movies[5]);
      await this.captureFrames('07_all_movies_added', 3);
      
      // Scene 3: Start voting
      console.log('\n🗳️ Scene 3: Start Voting');
      const adminPage = this.pages[0];
      const adminButtons = await adminPage.$$('.admin-controls button');
      for (const btn of adminButtons) {
        const text = await adminPage.evaluate(el => el.textContent, btn);
        if (text && text.includes('Start')) {
          await btn.click();
          console.log('✅ Voting started by Alex (admin)');
          break;
        }
      }
      await this.wait(2000);
      await this.captureFrames('08_voting_started', 3);
      
      // Scene 4: Users vote at different speeds
      console.log('\n✅ Scene 4: Voting Process');
      
      // Alex votes quickly (ranks top 3)
      await this.voteForUser(0, [1, 3, 5]);
      await this.captureFrames('09_alex_voting', 2);
      
      // Alex submits first
      await this.submitVote(0);
      await this.captureFrames('10_alex_submitted_early', 3);
      
      // Others continue voting
      // Sam votes for different movies
      await this.voteForUser(1, [2, 4, 6]);
      await this.captureFrames('11_sam_voting', 2);
      
      // Jordan votes
      await this.voteForUser(2, [3, 1, 2]);
      await this.captureFrames('12_jordan_voting', 2);
      
      // Casey votes  
      await this.voteForUser(3, [4, 5, 1]);
      await this.captureFrames('13_casey_voting', 2);
      
      // Submit remaining votes one by one
      await this.submitVote(1);
      await this.captureFrames('14_sam_submitted', 2);
      
      await this.submitVote(2);
      await this.captureFrames('15_jordan_submitted', 2);
      
      await this.submitVote(3);
      await this.captureFrames('16_all_votes_submitted', 3);
      
      // Scene 5: Results with IRV rounds
      console.log('\n📊 Scene 5: Results & IRV Elimination Rounds');
      
      // Navigate to results
      for (const page of this.pages) {
        try {
          await page.goto(this.roomUrl.replace('/vote', '/results'));
        } catch (e) {}
      }
      await this.wait(3000);
      await this.captureFrames('17_results_page', 3);
      
      // Expand IRV rounds on Alex's screen
      try {
        const toggleButton = await this.pages[0].$('button:has-text("Show elimination rounds")');
        if (!toggleButton) {
          // Try alternative selector
          const buttons = await this.pages[0].$$('button');
          for (const btn of buttons) {
            const text = await this.pages[0].evaluate(el => el.textContent, btn);
            if (text && text.includes('elimination')) {
              await btn.click();
              console.log('✅ Expanded IRV elimination rounds');
              break;
            }
          }
        } else {
          await toggleButton.click();
          console.log('✅ Expanded IRV elimination rounds');
        }
        await this.captureFrames('18_irv_rounds_visible', 4);
      } catch (e) {
        console.log('Could not expand IRV rounds:', e.message);
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
    console.log('\n🎥 Generating perfect horizontal video...');
    
    try {
      const files = await fs.readdir(this.outputDir);
      const frameNumbers = new Set();
      
      for (const file of files) {
        const match = file.match(/frame_(\d{4})_user/);
        if (match) {
          frameNumbers.add(match[1]);
        }
      }
      
      // Create horizontal composites with phones directly adjacent
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
          // Create horizontal layout with no gaps between phones
          const cmd = `ffmpeg -y -i "${userFiles[0]}" -i "${userFiles[1]}" -i "${userFiles[2]}" -i "${userFiles[3]}" -filter_complex "[0:v][1:v][2:v][3:v]hstack=inputs=4:shortest=1[v]" -map "[v]" "${outputFile}"`;
          
          await execPromise(cmd);
        }
      }
      
      // Generate video from horizontal composites
      const outputPath = path.join(__dirname, '..', 'public', 'videos', 'perfect_horizontal_4user_demo.mp4');
      const videoCmd = `ffmpeg -y -framerate 2 -pattern_type glob -i "${this.outputDir}/horizontal_*.png" -c:v libx264 -pix_fmt yuv420p -vf "scale=1600:-2" "${outputPath}"`;
      
      await execPromise(videoCmd);
      console.log(`✅ Video saved to: ${outputPath}`);
      
      // Create a 60-second version
      const shortCmd = `ffmpeg -y -i "${outputPath}" -t 60 -c copy "${path.join(__dirname, '..', 'public', 'videos', 'perfect_horizontal_4user_demo_60s.mp4')}"`;
      await execPromise(shortCmd);
      console.log('✅ Created 60-second version');
      
      // Copy as the main horizontal demo
      await fs.copyFile(outputPath, path.join(__dirname, '..', 'public', 'videos', 'horizontal_4user_demo.mp4'));
      console.log('✅ Updated main horizontal demo');
      
    } catch (error) {
      console.error('Video generation failed:', error.message);
    }
  }
}

// Run the demo
if (require.main === module) {
  const demo = new PerfectHorizontalDemo();
  demo.run().catch(console.error);
}

module.exports = PerfectHorizontalDemo;