const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class Comprehensive4UserWebSocketDemo {
  constructor() {
    this.browser = null;
    this.outputDir = path.join(__dirname, 'comprehensive-4-user-websocket-frames');
    this.frameIndex = 0;
    this.appUrl = 'http://localhost:8080';
    this.contexts = [];
    this.pages = [];
    this.users = [
      { 
        name: 'Alex', 
        color: '#FF6B6B', 
        movies: ['Top Gun: Maverick', 'Mad Max: Fury Road'],
        votingPattern: ['Top Gun: Maverick', 'Mad Max: Fury Road', 'Inception', 'The Dark Knight']
      },
      { 
        name: 'Sam', 
        color: '#4ECDC4', 
        movies: ['The Notebook', 'La La Land'],
        votingPattern: ['La La Land', 'The Notebook', 'Everything Everywhere All at Once', 'Parasite']
      },
      { 
        name: 'Jordan', 
        color: '#45B7D1', 
        movies: ['Interstellar', 'Inception'],
        votingPattern: ['Interstellar', 'Inception', 'The Dark Knight', 'Everything Everywhere All at Once']
      },
      { 
        name: 'Casey', 
        color: '#96CEB4', 
        movies: ['Parasite', 'Everything Everywhere All at Once', 'The Dark Knight'],
        votingPattern: ['Everything Everywhere All at Once', 'Parasite', 'Interstellar', 'La La Land']
      }
    ];
    this.captions = [];
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

  async captureFrame(label = '', caption = '') {
    const filename = `frame_${String(this.frameIndex).padStart(4, '0')}_${label}.png`;
    
    // Capture all 4 pages
    const screenshots = await Promise.all(
      this.pages.map((page, i) => 
        page.screenshot({ path: path.join(this.outputDir, `${filename}_user${i}.png`) })
      )
    );
    
    // Store caption for later overlay
    if (caption) {
      this.captions.push({ frameIndex: this.frameIndex, caption });
    }
    
    this.frameIndex++;
  }

  async wait(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async slowType(page, selector, text) {
    await page.focus(selector);
    await page.click(selector, { clickCount: 3 });
    await page.keyboard.press('Backspace');
    
    // Type with realistic speed variation
    for (const char of text) {
      await page.type(selector, char);
      await this.wait(30 + Math.random() * 40);
    }
  }

  async run() {
    try {
      await this.init();
      
      console.log('🎬 Comprehensive 4-User WebSocket Demo');
      console.log('=====================================');
      
      // Scene 1: Create room
      console.log('\n📍 Scene 1: Creating Movie Night');
      const roomUrl = await this.createRoom();
      
      // Scene 2: All users join
      console.log('\n👥 Scene 2: All 4 Users Join');
      await this.allUsersJoin(roomUrl);
      
      // Scene 3: WebSocket sync demonstration
      console.log('\n🔄 Scene 3: Real-time WebSocket Synchronization');
      await this.demonstrateWebSocketSync();
      
      // Scene 4: Multiple users add movies at different speeds
      console.log('\n🎬 Scene 4: Multiple Users Adding Movies');
      await this.multipleUsersAddMovies();
      
      // Scene 5: Admin starts voting
      console.log('\n🗳️ Scene 5: Starting Ranked Choice Voting');
      await this.startVoting();
      
      // Scene 6: Users vote at different speeds
      console.log('\n✅ Scene 6: Users Vote at Different Speeds');
      await this.usersVoteAtDifferentSpeeds();
      
      // Scene 7: Live results update
      console.log('\n📊 Scene 7: Live Results Updates');
      await this.showLiveResultsUpdates();
      
      // Scene 8: IRV elimination rounds
      console.log('\n🏆 Scene 8: IRV Elimination Rounds');
      await this.showIRVElimination();
      
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
      await page.setViewport({ width: 480, height: 800 }); // Mobile-sized for 4-up view
      
      await page.goto(roomUrl);
      await page.waitForSelector('input[placeholder="Search for a movie..."]', { timeout: 10000 });
      
      this.contexts.push(context);
      this.pages.push(page);
      
      console.log(`  ✅ ${this.users[i].name} joined`);
      await this.wait(500);
    }
    
    await this.wait(1000);
    await this.captureFrame('all_joined', '4 users have joined the movie night');
  }

  async demonstrateWebSocketSync() {
    console.log('  🔄 Demonstrating real-time WebSocket synchronization...');
    
    // User 1 (Alex) searches for a movie
    console.log('  📽️ Alex searches for "Top Gun: Maverick"');
    await this.slowType(this.pages[0], 'input[placeholder="Search for a movie..."]', 'Top Gun Maverick');
    await this.wait(1500); // Wait for search results
    await this.captureFrame('alex_searching', 'Alex is searching for a movie');
    
    // Click to add the movie
    const searchResults = await this.pages[0].$$('button.w-full.px-4.py-3');
    if (searchResults.length > 0) {
      await searchResults[0].click();
      console.log('  ✅ Alex added movie');
      
      // IMPORTANT: Capture immediately to show WebSocket sync
      await this.wait(500); // Small wait for WebSocket propagation
      await this.captureFrame('websocket_sync_immediate', 'Movie instantly appears on ALL screens via WebSocket!');
      
      // Show the sync more clearly
      await this.wait(1000);
      await this.captureFrame('websocket_sync_complete', 'Real-time sync - no refresh needed!');
    }
  }

  async multipleUsersAddMovies() {
    // Different users add movies at different speeds
    console.log('  🎬 Multiple users adding movies simultaneously...');
    
    // Sam adds a movie quickly
    console.log('  📽️ Sam quickly adds "The Notebook"');
    await this.pages[1].click('input[placeholder="Search for a movie..."]', { clickCount: 3 });
    await this.pages[1].keyboard.press('Backspace');
    await this.pages[1].type('input[placeholder="Search for a movie..."]', 'The Notebook');
    await this.wait(1500);
    
    // Jordan starts searching at the same time
    console.log('  📽️ Jordan searches for "Interstellar" while Sam is adding');
    await this.slowType(this.pages[2], 'input[placeholder="Search for a movie..."]', 'Interstellar');
    
    // Sam clicks first
    const samResults = await this.pages[1].$$('button.w-full.px-4.py-3');
    if (samResults.length > 0) {
      await samResults[0].click();
      console.log('  ✅ Sam added movie');
      await this.wait(500);
      await this.captureFrame('sam_adds_movie', 'Sam adds movie - appears on all screens');
    }
    
    // Jordan finishes and adds
    await this.wait(1000);
    const jordanResults = await this.pages[2].$$('button.w-full.px-4.py-3');
    if (jordanResults.length > 0) {
      await jordanResults[0].click();
      console.log('  ✅ Jordan added movie');
      await this.wait(500);
      await this.captureFrame('jordan_adds_movie', 'Jordan adds movie - WebSocket syncs to all');
    }
    
    // Casey adds multiple movies quickly
    console.log('  📽️ Casey adds multiple movies in succession');
    for (const movie of this.users[3].movies) {
      await this.pages[3].click('input[placeholder="Search for a movie..."]', { clickCount: 3 });
      await this.pages[3].keyboard.press('Backspace');
      await this.pages[3].type('input[placeholder="Search for a movie..."]', movie);
      await this.wait(1500);
      
      const caseyResults = await this.pages[3].$$('button.w-full.px-4.py-3');
      if (caseyResults.length > 0) {
        await caseyResults[0].click();
        console.log(`    ✅ Casey added: ${movie}`);
        await this.wait(500);
        await this.captureFrame(`casey_adds_${movie.replace(/[^a-z0-9]/gi, '_')}`, `Casey adds ${movie} - all users see it`);
      }
    }
    
    // Show all movies added
    await this.wait(1000);
    await this.captureFrame('all_movies_added', 'All movies added - ready for voting');
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
      await this.captureFrame('voting_started', 'Admin starts the voting phase');
    } else {
      console.log('  ⚠️ Admin controls not found, voting may already be open');
    }
  }

  async usersVoteAtDifferentSpeeds() {
    console.log('  🗳️ Users voting at different speeds...');
    
    // Alex votes quickly (User 0)
    console.log('  ⚡ Alex votes quickly');
    const alexPage = this.pages[0];
    const alexMovieElements = await alexPage.$$('.movie-item, [data-testid="movie-item"]');
    
    // Quick ranking - just click first 3
    for (let i = 0; i < Math.min(3, alexMovieElements.length); i++) {
      const rankButton = await alexMovieElements[i].$('button');
      if (rankButton) {
        await rankButton.click();
        await this.wait(200);
      }
    }
    
    // Submit immediately
    const alexSubmitButtons = await alexPage.$$('button');
    for (const button of alexSubmitButtons) {
      const text = await alexPage.evaluate(el => el.textContent, button);
      if (text && text.includes('Submit')) {
        await button.click();
        console.log('    ✅ Alex submitted vote first!');
        await this.wait(500);
        await this.captureFrame('alex_voted_first', 'Alex submits vote before others are done');
        break;
      }
    }
    
    // Show that Alex is at results while others still voting
    await this.wait(1000);
    await this.captureFrame('alex_at_results_others_voting', 'Alex sees live results while others still vote');
    
    // Sam votes at medium speed (User 1)
    console.log('  🕐 Sam takes their time voting');
    for (let i = 0; i < 3; i++) {
      const samMovieElements = await this.pages[1].$$('.movie-item, [data-testid="movie-item"]');
      if (samMovieElements[i]) {
        const rankButton = await samMovieElements[i].$('button');
        if (rankButton) {
          await rankButton.click();
          await this.wait(800); // Slower than Alex
        }
      }
    }
    
    await this.captureFrame('sam_still_voting', 'Sam still ranking while Alex sees results');
    
    // Jordan and Casey vote simultaneously
    console.log('  🤝 Jordan and Casey vote at the same time');
    const simultaneousVoting = [
      this.voteForUser(2, 'Jordan'),
      this.voteForUser(3, 'Casey')
    ];
    
    await Promise.all(simultaneousVoting);
    await this.captureFrame('multiple_votes_submitted', 'Multiple users submit - results update live');
  }

  async voteForUser(userIndex, userName) {
    const page = this.pages[userIndex];
    const movieElements = await page.$$('.movie-item, [data-testid="movie-item"]');
    
    for (let i = 0; i < Math.min(4, movieElements.length); i++) {
      const rankButton = await movieElements[i].$('button');
      if (rankButton) {
        await rankButton.click();
        await this.wait(400 + Math.random() * 400);
      }
    }
    
    // Submit vote
    const submitButtons = await page.$$('button');
    for (const button of submitButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && text.includes('Submit')) {
        await button.click();
        console.log(`    ✅ ${userName} submitted vote`);
        break;
      }
    }
  }

  async showLiveResultsUpdates() {
    console.log('  📊 Showing live results updates...');
    
    // Navigate all users to results
    for (let i = 0; i < this.pages.length; i++) {
      const resultsUrl = this.pages[i].url().replace('/vote', '/results');
      await this.pages[i].goto(resultsUrl);
      console.log(`  📊 ${this.users[i].name} viewing live results`);
    }
    
    await this.wait(2000);
    await this.captureFrame('all_users_results', 'All users see live results updating');
    
    // Show vote count changing
    await this.wait(1000);
    await this.captureFrame('results_with_counts', 'Vote counts and percentages update in real-time');
  }

  async showIRVElimination() {
    console.log('  🏆 Demonstrating IRV elimination rounds...');
    
    // Find and click the IRV toggle on first user's screen
    const firstPage = this.pages[0];
    
    // Look for the elimination rounds toggle button
    const toggleButton = await firstPage.$('button:has-text("View Elimination Rounds")');
    if (toggleButton) {
      console.log('  📋 Expanding IRV elimination rounds');
      await toggleButton.click();
      await this.wait(1000);
      await this.captureFrame('irv_expanded', 'IRV elimination rounds expanded');
      
      // Scroll to show more rounds if needed
      await firstPage.evaluate(() => {
        const button = document.querySelector('button:has-text("View Elimination Rounds")');
        if (button) {
          button.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      
      await this.wait(1500);
      await this.captureFrame('irv_rounds_detail', 'Detailed IRV rounds showing vote transfers');
      
      // Show the same on another user's screen to demonstrate sync
      const secondPage = this.pages[1];
      const secondToggle = await secondPage.$('button:has-text("View Elimination Rounds")');
      if (secondToggle) {
        await secondToggle.click();
        await this.wait(500);
        await this.captureFrame('irv_multiple_users', 'Multiple users can view IRV details');
      }
    } else {
      console.log('  ⚠️ IRV toggle not found, may need more votes for elimination');
    }
    
    // Final winner shot
    await this.wait(1000);
    await this.captureFrame('final_winner', 'Final winner determined by IRV');
  }

  async generateVideo() {
    const outputPath = path.join(__dirname, 'comprehensive_4user_websocket_demo.mp4');
    
    // Create side-by-side composites
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
    
    // Create 2x2 composites with captions
    for (const [frameNum, frameFiles] of Object.entries(frameGroups)) {
      if (frameFiles.length === 4) {
        const sortedFiles = frameFiles.sort();
        const inputs = sortedFiles.map(f => `-i "${path.join(this.outputDir, f)}"`).join(' ');
        
        // Find caption for this frame
        const frameIndex = parseInt(frameNum);
        const captionInfo = this.captions.find(c => c.frameIndex === frameIndex);
        const caption = captionInfo ? captionInfo.caption : '';
        
        // Create 2x2 grid with padding and labels
        const filterComplex = `
          [0:v]scale=480:800,pad=490:850:5:5:black,drawtext=text='${this.users[0].name}':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=24:fontcolor=white:x=(w-text_w)/2:y=h-th-10[tl];
          [1:v]scale=480:800,pad=490:850:5:5:black,drawtext=text='${this.users[1].name}':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=24:fontcolor=white:x=(w-text_w)/2:y=h-th-10[tr];
          [2:v]scale=480:800,pad=490:850:5:5:black,drawtext=text='${this.users[2].name}':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=24:fontcolor=white:x=(w-text_w)/2:y=h-th-10[bl];
          [3:v]scale=480:800,pad=490:850:5:5:black,drawtext=text='${this.users[3].name}':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=24:fontcolor=white:x=(w-text_w)/2:y=h-th-10[br];
          [tl][tr]hstack=inputs=2[top];
          [bl][br]hstack=inputs=2[bottom];
          [top][bottom]vstack=inputs=2[grid];
          [grid]pad=w=iw:h=ih+100:x=0:y=0:color=black${caption ? `,drawtext=text='${caption.replace(/'/g, "\\'")}':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=36:fontcolor=white:x=(w-text_w)/2:y=h-th-20` : ''}[v]
        `.replace(/\n/g, '');
        
        const compositeCmd = `ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "[v]" "${path.join(this.outputDir, `composite_${frameNum}.png`)}"`;
        
        try {
          await execPromise(compositeCmd);
        } catch (error) {
          console.error(`Failed to create composite for frame ${frameNum}:`, error.message);
          // Fallback without text if it fails
          const simpleFilter = `
            [0:v][1:v]hstack=inputs=2[top];
            [2:v][3:v]hstack=inputs=2[bottom];
            [top][bottom]vstack=inputs=2[v]
          `.replace(/\n/g, '');
          await execPromise(`ffmpeg -y ${inputs} -filter_complex "${simpleFilter}" -map "[v]" "${path.join(this.outputDir, `composite_${frameNum}.png")}"`);
        }
      }
    }
    
    // Generate video from composite frames
    console.log('  🎬 Generating final video...');
    const videoCmd = `ffmpeg -y -framerate 8 -pattern_type glob -i "${this.outputDir}/composite_*.png" -c:v libx264 -pix_fmt yuv420p -preset medium -crf 23 "${outputPath}"`;
    
    try {
      await execPromise(videoCmd);
      console.log(`  ✅ Video created: ${outputPath}`);
      
      // Get video duration
      const durationCmd = `ffmpeg -i "${outputPath}" 2>&1 | grep Duration`;
      const { stdout } = await execPromise(durationCmd);
      console.log(`  📹 ${stdout.trim()}`);
      
      // Create a 60-second version for demos
      const shortPath = path.join(__dirname, 'comprehensive_4user_websocket_demo_60s.mp4');
      await execPromise(`ffmpeg -y -i "${outputPath}" -t 60 -c copy "${shortPath}"`);
      console.log(`  ✅ 60-second version created: ${shortPath}`);
      
      // Copy to public directory
      const publicPath = path.join(__dirname, '..', 'public', 'videos', 'comprehensive_4user_websocket_demo.mp4');
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
  const demo = new Comprehensive4UserWebSocketDemo();
  demo.run().catch(console.error);
}

module.exports = Comprehensive4UserWebSocketDemo;