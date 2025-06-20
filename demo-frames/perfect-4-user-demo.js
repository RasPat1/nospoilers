const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class Perfect4UserDemo {
  constructor() {
    this.browser = null;
    this.outputDir = path.join(__dirname, 'perfect-4-user-demo-frames');
    this.frameIndex = 0;
    this.appUrl = 'http://localhost:8080';
    this.contexts = [];
    this.pages = [];
    this.users = [
      { name: 'Alex', color: '#FF6B6B', position: 'top-left' },
      { name: 'Sam', color: '#4ECDC4', position: 'top-right' },
      { name: 'Jordan', color: '#45B7D1', position: 'bottom-left' },
      { name: 'Casey', color: '#96CEB4', position: 'bottom-right' }
    ];
    this.moviesByUser = [
      ['Top Gun: Maverick', 'Mad Max: Fury Road'],     // Alex likes action
      ['La La Land', 'The Notebook'],                  // Sam likes romance
      ['Interstellar', 'Dune'],                        // Jordan likes sci-fi
      ['Everything Everywhere All at Once', 'Parasite'] // Casey likes unique films
    ];
  }

  async init() {
    // Create output directory
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

    // Launch browser with extended timeout
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      protocolTimeout: 120000,
      timeout: 60000
    });
    
    console.log('✅ Browser launched');
  }

  async captureFrame(label = '') {
    const filename = `frame_${String(this.frameIndex).padStart(4, '0')}_${label}.png`;
    
    try {
      // Capture all 4 pages sequentially to avoid timeout
      for (let i = 0; i < this.pages.length; i++) {
        try {
          await this.pages[i].screenshot({ 
            path: path.join(this.outputDir, `${filename}_user${i}.png`),
            timeout: 30000
          });
        } catch (error) {
          console.error(`Failed to capture screenshot for user ${i}:`, error.message);
        }
      }
      
      this.frameIndex++;
      console.log(`  📸 Frame ${this.frameIndex}: ${label}`);
    } catch (error) {
      console.error(`  ❌ Failed to capture ${label}:`, error.message);
    }
  }

  async wait(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async slowType(page, selector, text) {
    try {
      await page.click(selector);
      await page.evaluate(sel => {
        const input = document.querySelector(sel);
        if (input) input.value = '';
      }, selector);
      
      for (const char of text) {
        await page.type(selector, char);
        await this.wait(50);
      }
    } catch (error) {
      console.error(`Failed to type "${text}":`, error.message);
    }
  }

  async run() {
    try {
      await this.init();
      
      console.log('\n🎬 Perfect 4-User NoSpoilers Demo');
      console.log('===================================\n');
      
      // Scene 1: Create room
      console.log('📍 Scene 1: Creating Movie Night Room');
      const roomUrl = await this.createRoom();
      
      // Scene 2: All users join
      console.log('\n👥 Scene 2: All 4 Users Join');
      await this.allUsersJoin(roomUrl);
      await this.wait(2000);
      await this.captureFrame('01_all_users_joined');
      
      // Scene 3: Users add movies (one at a time to show sync)
      console.log('\n🎬 Scene 3: Adding Movies (Real-time Sync)');
      await this.addMoviesWithSync();
      
      // Scene 4: Admin starts voting
      console.log('\n🗳️ Scene 4: Admin Starts Voting');
      await this.startVoting();
      await this.captureFrame('04_voting_started');
      
      // Scene 5: All users vote
      console.log('\n✅ Scene 5: All Users Cast Ranked Votes');
      await this.allUsersVote();
      
      // Scene 6: View results
      console.log('\n🏆 Scene 6: IRV Results Calculation');
      await this.viewResults();
      
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
    
    await page.goto(this.appUrl);
    await page.waitForSelector('button', { timeout: 20000 });
    
    // Click create button
    const createButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Create'));
    });
    
    if (createButton) {
      await createButton.click();
      await page.waitForNavigation({ timeout: 20000 });
    }
    
    const roomUrl = page.url();
    console.log(`  ✅ Room created: ${roomUrl}`);
    
    await page.close();
    return roomUrl;
  }

  async allUsersJoin(roomUrl) {
    // Create 4 browser contexts with smaller viewports for 2x2 grid
    for (let i = 0; i < 4; i++) {
      const context = await this.browser.createBrowserContext();
      const page = await context.newPage();
      
      // Set viewport for 2x2 grid (half width and height of 1920x1080)
      await page.setViewport({ width: 960, height: 540 });
      
      await page.goto(roomUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('input[placeholder="Search for a movie..."]', { timeout: 30000 });
      
      // Add user label overlay (smaller and positioned better)
      await page.evaluate((userName, userColor) => {
        const label = document.createElement('div');
        label.innerHTML = userName;
        label.style.cssText = `
          position: fixed;
          top: 10px;
          left: 10px;
          background: ${userColor};
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 14px;
          z-index: 10000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(label);
      }, this.users[i].name, this.users[i].color);
      
      this.contexts.push(context);
      this.pages.push(page);
      
      console.log(`  ✅ ${this.users[i].name} joined`);
      await this.wait(500);
    }
  }

  async addMoviesWithSync() {
    // Add movies one at a time to show real-time sync
    for (let userIndex = 0; userIndex < 4; userIndex++) {
      const user = this.users[userIndex];
      const movies = this.moviesByUser[userIndex];
      
      for (const movie of movies) {
        console.log(`  🎬 ${user.name} adding "${movie}"...`);
        
        // Type movie search
        await this.slowType(this.pages[userIndex], 'input[placeholder="Search for a movie..."]', movie);
        await this.wait(2000); // Wait for search results
        
        // Click first result
        try {
          await this.pages[userIndex].waitForSelector('button.w-full.px-4.py-3', { timeout: 5000 });
          const searchButtons = await this.pages[userIndex].$$('button.w-full.px-4.py-3');
          
          if (searchButtons.length > 0) {
            await searchButtons[0].click();
            console.log(`    ✅ Added "${movie}"`);
            
            // Wait for sync and capture
            await this.wait(1500);
            await this.captureFrame(`02_${user.name.toLowerCase()}_added_${movie.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`);
            
            // Clear search
            await this.pages[userIndex].click('input[placeholder="Search for a movie..."]', { clickCount: 3 });
            await this.pages[userIndex].keyboard.press('Backspace');
          }
        } catch (error) {
          console.log(`    ⚠️ Failed to add "${movie}": ${error.message}`);
        }
      }
    }
    
    await this.wait(1000);
    await this.captureFrame('03_all_movies_added');
  }

  async startVoting() {
    // Admin (first user) starts voting
    const adminPage = this.pages[0];
    
    try {
      // Look for admin controls and start voting button
      await adminPage.waitForSelector('.admin-controls', { timeout: 5000 });
      const startButton = await adminPage.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('.admin-controls button'));
        return buttons.find(btn => btn.textContent.includes('Start'));
      });
      
      if (startButton) {
        await startButton.click();
        console.log('  ✅ Admin started voting');
        await this.wait(2000);
      }
    } catch (error) {
      console.log('  ⚠️ Could not find admin controls, voting may already be open');
    }
  }

  async allUsersVote() {
    // Define realistic voting patterns
    const votingPatterns = [
      // Alex prefers action, then sci-fi
      ['Top Gun: Maverick', 'Mad Max: Fury Road', 'Dune'],
      // Sam prefers romance, then unique films
      ['La La Land', 'The Notebook', 'Everything Everywhere All at Once'],
      // Jordan prefers sci-fi, then action
      ['Interstellar', 'Dune', 'Mad Max: Fury Road'],
      // Casey prefers unique films, then sci-fi
      ['Everything Everywhere All at Once', 'Parasite', 'Interstellar']
    ];

    for (let i = 0; i < this.pages.length; i++) {
      const user = this.users[i];
      console.log(`  🗳️ ${user.name} voting...`);
      
      try {
        // Wait for voting interface
        await this.pages[i].waitForSelector('.movie-item', { timeout: 5000 });
        
        // Get all movie items and rank buttons
        const movieItems = await this.pages[i].$$('.movie-item');
        
        // Click rank buttons (1, 2, 3) for first three movies
        for (let rank = 0; rank < Math.min(3, movieItems.length); rank++) {
          // Find the rank button within each movie item
          const rankButton = await movieItems[rank].$(`button:has-text("${rank + 1}")`);
          if (!rankButton) {
            // Try alternative selector
            const buttons = await movieItems[rank].$$('button');
            if (buttons[rank]) {
              await buttons[rank].click();
            }
          } else {
            await rankButton.click();
          }
          await this.wait(500);
        }
        
        // Capture after ranking
        await this.captureFrame(`05_${user.name.toLowerCase()}_ranked`);
        
        // Submit vote
        const submitButton = await this.pages[i].evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(btn => btn.textContent.includes('Submit'));
        });
        
        if (submitButton) {
          await submitButton.click();
          console.log(`    ✅ ${user.name} submitted vote`);
          await this.wait(1000);
          await this.captureFrame(`06_${user.name.toLowerCase()}_voted`);
        }
      } catch (error) {
        console.log(`    ⚠️ ${user.name} voting failed: ${error.message}`);
      }
    }
    
    await this.wait(2000);
    await this.captureFrame('07_all_users_voted');
  }

  async viewResults() {
    // Navigate all users to results page
    await Promise.all(
      this.pages.map(async (page, i) => {
        try {
          const resultsUrl = page.url().replace('/vote', '/results');
          await page.goto(resultsUrl, { waitUntil: 'networkidle2', timeout: 30000 });
          console.log(`  📊 ${this.users[i].name} viewing results`);
        } catch (error) {
          console.log(`  ⚠️ ${this.users[i].name} failed to load results`);
        }
      })
    );
    
    await this.wait(3000);
    await this.captureFrame('08_initial_results');
    
    // Wait to show IRV calculations
    await this.wait(2000);
    await this.captureFrame('09_irv_calculation');
    
    // Final results
    await this.wait(2000);
    await this.captureFrame('10_final_winner');
    
    console.log('  🏆 Results displayed for all users');
  }

  async generateVideo() {
    const outputPath = path.join(__dirname, 'nospoilers_perfect_4user_demo.mp4');
    
    // Create 2x2 grid composites
    console.log('  🖼️ Creating 2x2 grid composites...');
    
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
    
    // Create 2x2 composites with proper spacing
    for (const [frameNum, frameFiles] of Object.entries(frameGroups)) {
      if (frameFiles.length === 4) {
        const sortedFiles = frameFiles.sort(); // Ensure consistent order (user0, user1, user2, user3)
        const inputs = sortedFiles.map(f => `-i "${path.join(this.outputDir, f)}"`).join(' ');
        
        // Create 2x2 grid with small padding between videos
        const filterComplex = `
          [0:v]pad=970:550:5:5:black[tl];
          [1:v]pad=970:550:5:5:black[tr];
          [2:v]pad=970:550:5:5:black[bl];
          [3:v]pad=970:550:5:5:black[br];
          [tl][tr]hstack=inputs=2[top];
          [bl][br]hstack=inputs=2[bottom];
          [top][bottom]vstack=inputs=2,scale=1920:1080[v]
        `.replace(/\n/g, '');
        
        const compositeCmd = `ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "[v]" "${path.join(this.outputDir, `composite_${frameNum}.png`)}"`;
        
        try {
          await execPromise(compositeCmd);
        } catch (error) {
          console.error(`Failed to create composite for frame ${frameNum}:`, error.message);
        }
      }
    }
    
    // Generate video from composite frames
    console.log('  🎬 Generating final video...');
    
    // Use slower frame rate for better viewing
    const videoCmd = `ffmpeg -y -framerate 2 -pattern_type glob -i "${this.outputDir}/composite_*.png" -c:v libx264 -pix_fmt yuv420p -preset medium -crf 23 "${outputPath}"`;
    
    try {
      await execPromise(videoCmd);
      console.log(`  ✅ Video created: ${outputPath}`);
      
      // Get video duration
      const durationCmd = `ffmpeg -i "${outputPath}" 2>&1 | grep Duration`;
      const { stdout } = await execPromise(durationCmd);
      console.log(`  📹 ${stdout.trim()}`);
      
      // Copy to public directory
      const publicPath = path.join(__dirname, '..', 'public', 'videos', 'complete_4user_demo.mp4');
      await fs.copyFile(outputPath, publicPath);
      console.log(`  ✅ Copied to public: ${publicPath}`);
      
      // Generate thumbnail
      const thumbnailPath = path.join(__dirname, '..', 'public', 'demo-thumbnails', '4user-demo.jpg');
      const thumbCmd = `ffmpeg -y -i "${outputPath}" -ss 00:00:05 -vframes 1 "${thumbnailPath}"`;
      await execPromise(thumbCmd);
      console.log(`  ✅ Thumbnail created`);
      
    } catch (error) {
      console.error('  ❌ Video generation error:', error);
    }
  }

  async cleanup() {
    for (const context of this.contexts) {
      try {
        await context.close();
      } catch (e) {}
    }
    
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run the demo
if (require.main === module) {
  const demo = new Perfect4UserDemo();
  demo.run().catch(console.error);
}

module.exports = Perfect4UserDemo;