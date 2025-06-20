const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class Complete4UserDemo {
  constructor() {
    this.browser = null;
    this.outputDir = path.join(__dirname, 'complete-4-user-demo-frames');
    this.frameIndex = 0;
    this.appUrl = 'http://localhost:8080';
    this.contexts = [];
    this.pages = [];
    this.users = [
      { name: 'Alex', color: '#FF6B6B', movies: ['Top Gun: Maverick', 'Mad Max: Fury Road'] },
      { name: 'Sam', color: '#4ECDC4', movies: ['The Notebook', 'La La Land'] },
      { name: 'Jordan', color: '#45B7D1', movies: ['Interstellar', 'Inception'] },
      { name: 'Casey', color: '#96CEB4', movies: ['Parasite', 'Everything Everywhere All at Once'] }
    ];
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

  async captureFrame(label = '') {
    const filename = `frame_${String(this.frameIndex).padStart(4, '0')}_${label}.png`;
    
    // Capture all 4 pages
    const screenshots = await Promise.all(
      this.pages.map((page, i) => 
        page.screenshot({ path: path.join(this.outputDir, `${filename}_user${i}.png`) })
      )
    );
    
    this.frameIndex++;
  }

  async wait(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async slowType(page, selector, text) {
    await page.focus(selector);
    await page.click(selector, { clickCount: 3 });
    await page.keyboard.press('Backspace');
    
    for (const char of text) {
      await page.type(selector, char);
      await this.wait(30 + Math.random() * 20);
    }
  }

  async run() {
    try {
      await this.init();
      
      console.log('🎬 Complete 4-User NoSpoilers Demo');
      console.log('=====================================');
      
      // Scene 1: Create room
      console.log('\n📍 Scene 1: Creating Movie Night');
      const roomUrl = await this.createRoom();
      
      // Scene 2: All users join
      console.log('\n👥 Scene 2: All 4 Users Join');
      await this.allUsersJoin(roomUrl);
      
      // Scene 3: Users add movies
      console.log('\n🎬 Scene 3: Collaborative Movie Selection');
      await this.usersAddMovies();
      
      // Scene 4: Admin starts voting
      console.log('\n🗳️ Scene 4: Starting Ranked Choice Voting');
      await this.startVoting();
      
      // Scene 5: Users vote
      console.log('\n✅ Scene 5: Everyone Votes');
      await this.usersVote();
      
      // Scene 6: View results
      console.log('\n🏆 Scene 6: IRV Results');
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

  async allUsersJoin(roomUrl) {
    // Create 4 browser contexts with smaller viewports for side-by-side view
    for (let i = 0; i < 4; i++) {
      const context = await this.browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 480, height: 800 }); // Smaller viewport for 4-up view
      
      await page.goto(roomUrl);
      await page.waitForSelector('input[placeholder="Search for a movie..."]', { timeout: 10000 });
      
      this.contexts.push(context);
      this.pages.push(page);
      
      console.log(`  ✅ ${this.users[i].name} joined`);
    }
    
    await this.wait(1000);
    await this.captureFrame('all_joined');
  }

  async usersAddMovies() {
    // Each user adds their movies
    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      const user = this.users[i];
      
      console.log(`  🎬 ${user.name} adding movies...`);
      
      for (const movie of user.movies) {
        await this.slowType(page, 'input[placeholder="Search for a movie..."]', movie);
        await this.wait(1500); // Wait for search results
        
        // Click first result
        const searchResults = await page.$$('button.w-full.px-4.py-3');
        if (searchResults.length > 0) {
          await searchResults[0].click();
          console.log(`    ✅ Added: ${movie}`);
          await this.wait(500);
          await this.captureFrame(`${user.name.toLowerCase()}_added_${movie.replace(/[^a-z0-9]/gi, '_')}`);
        }
        
        // Clear search
        await page.click('input[placeholder="Search for a movie..."]', { clickCount: 3 });
        await page.keyboard.press('Backspace');
      }
    }
    
    await this.wait(1000);
    await this.captureFrame('all_movies_added');
  }

  async startVoting() {
    // Admin (first user) starts voting
    const adminPage = this.pages[0];
    
    // Look for admin controls
    const adminButton = await adminPage.$('.admin-controls button');
    if (adminButton) {
      await adminButton.click();
      console.log('  ✅ Admin started voting');
      await this.wait(1000);
      await this.captureFrame('voting_started');
    } else {
      console.log('  ⚠️ Admin controls not found, voting may already be open');
    }
  }

  async usersVote() {
    // Define voting patterns for each user
    const votingPatterns = [
      // Alex prefers action movies
      ['Top Gun: Maverick', 'Mad Max: Fury Road', 'Inception'],
      // Sam prefers romance/musicals
      ['La La Land', 'The Notebook', 'Everything Everywhere All at Once'],
      // Jordan prefers sci-fi
      ['Interstellar', 'Inception', 'Everything Everywhere All at Once'],
      // Casey has eclectic taste
      ['Everything Everywhere All at Once', 'Parasite', 'Interstellar']
    ];

    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      const user = this.users[i];
      const pattern = votingPatterns[i];
      
      console.log(`  🗳️ ${user.name} voting...`);
      
      // Find and click rank buttons
      const movieElements = await page.$$('.movie-item, [data-testid="movie-item"]');
      
      if (movieElements.length > 0) {
        // Click on the first 3 rank buttons
        for (let rank = 0; rank < Math.min(3, movieElements.length); rank++) {
          const rankButtons = await page.$$('.rank-button, button[aria-label*="Rank"], button:has-text("' + (rank + 1) + '")');
          if (rankButtons[rank]) {
            await rankButtons[rank].click();
            await this.wait(300);
          }
        }
        
        // Submit vote
        const submitButtons = await page.$$('button');
        for (const button of submitButtons) {
          const text = await page.evaluate(el => el.textContent, button);
          if (text && text.includes('Submit')) {
            await button.click();
            console.log(`    ✅ ${user.name} submitted vote`);
            await this.wait(500);
            await this.captureFrame(`${user.name.toLowerCase()}_voted`);
            break;
          }
        }
      }
    }
    
    await this.wait(1000);
    await this.captureFrame('all_voted');
  }

  async viewResults() {
    // Navigate all users to results
    await Promise.all(
      this.pages.map(async (page, i) => {
        const resultsUrl = page.url() + '/results';
        await page.goto(resultsUrl);
        console.log(`  📊 ${this.users[i].name} viewing results`);
      })
    );
    
    await this.wait(2000);
    await this.captureFrame('initial_results');
    
    // Wait a bit to show the IRV process
    await this.wait(3000);
    await this.captureFrame('final_results');
    
    console.log('  🏆 Results displayed for all users');
  }

  async generateVideo() {
    const outputPath = path.join(__dirname, 'nospoilers_complete_4user_demo.mp4');
    
    // Create side-by-side composites
    console.log('  🖼️ Creating side-by-side composites...');
    
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
    
    // Create 4-up composites (2x2 grid)
    for (const [frameNum, frameFiles] of Object.entries(frameGroups)) {
      if (frameFiles.length === 4) {
        const sortedFiles = frameFiles.sort(); // Ensure consistent order
        const inputs = sortedFiles.map(f => `-i "${path.join(this.outputDir, f)}"`).join(' ');
        
        // Create 2x2 grid with padding
        const filterComplex = `
          [0:v]scale=480:800,pad=490:810:5:5:black[tl];
          [1:v]scale=480:800,pad=490:810:5:5:black[tr];
          [2:v]scale=480:800,pad=490:810:5:5:black[bl];
          [3:v]scale=480:800,pad=490:810:5:5:black[br];
          [tl][tr]hstack=inputs=2[top];
          [bl][br]hstack=inputs=2[bottom];
          [top][bottom]vstack=inputs=2[v]
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
    const videoCmd = `ffmpeg -y -framerate 10 -pattern_type glob -i "${this.outputDir}/composite_*.png" -c:v libx264 -pix_fmt yuv420p -preset medium -crf 23 "${outputPath}"`;
    
    try {
      await execPromise(videoCmd);
      console.log(`  ✅ Video created: ${outputPath}`);
      
      // Get video duration
      const durationCmd = `ffmpeg -i "${outputPath}" 2>&1 | grep Duration`;
      const { stdout } = await execPromise(durationCmd);
      console.log(`  📹 ${stdout.trim()}`);
      
      // Copy to public directory for homepage
      const publicPath = path.join(__dirname, '..', 'public', 'videos', 'complete_4user_demo.mp4');
      await fs.mkdir(path.dirname(publicPath), { recursive: true });
      await fs.copyFile(outputPath, publicPath);
      console.log(`  ✅ Copied to public: ${publicPath}`);
      
    } catch (error) {
      console.error('  ❌ Video generation error:', error);
    }
  }

  async cleanup() {
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
  const demo = new Complete4UserDemo();
  demo.run().catch(console.error);
}

module.exports = Complete4UserDemo;