const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class Enhanced4UserWebSocketDemo {
  constructor() {
    this.browser = null;
    this.outputDir = path.join(__dirname, 'enhanced-4user-websocket-frames');
    this.frameIndex = 0;
    this.appUrl = 'http://localhost:8080';
    this.contexts = [];
    this.pages = [];
    this.users = [
      { 
        name: 'Alex', 
        color: '#FF6B6B', 
        avatar: '👨‍💼',
        movies: ['Top Gun: Maverick', 'Mad Max: Fury Road'],
        votingSpeed: 'fast',
        votingPattern: ['Top Gun: Maverick', 'Mad Max: Fury Road', 'Inception']
      },
      { 
        name: 'Sam', 
        color: '#4ECDC4', 
        avatar: '👩‍🎨',
        movies: ['The Notebook', 'La La Land'],
        votingSpeed: 'medium',
        votingPattern: ['La La Land', 'The Notebook', 'Everything Everywhere All at Once']
      },
      { 
        name: 'Jordan', 
        color: '#45B7D1', 
        avatar: '🧑‍🚀',
        movies: ['Interstellar', 'Inception'],
        votingSpeed: 'slow',
        votingPattern: ['Interstellar', 'Inception', 'The Dark Knight']
      },
      { 
        name: 'Casey', 
        color: '#96CEB4', 
        avatar: '👨‍🎤',
        movies: ['Parasite', 'Everything Everywhere All at Once', 'The Dark Knight'],
        votingSpeed: 'medium',
        votingPattern: ['Everything Everywhere All at Once', 'Parasite', 'Interstellar']
      }
    ];
    this.annotations = [];
  }

  async init() {
    await fs.mkdir(this.outputDir, { recursive: true });
    
    const files = await fs.readdir(this.outputDir);
    for (const file of files) {
      if (file.endsWith('.png')) {
        await fs.unlink(path.join(this.outputDir, file));
      }
    }

    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log('✅ Browser launched');
  }

  async captureFrame(label = '', options = {}) {
    const { 
      highlight = null, 
      annotation = null,
      duration = 1 
    } = options;

    const filename = `frame_${String(this.frameIndex).padStart(4, '0')}_${label}.png`;
    
    // Add visual highlights if specified
    if (highlight) {
      await this.addHighlight(highlight);
    }
    
    // Capture all 4 pages
    const screenshots = await Promise.all(
      this.pages.map(async (page, i) => {
        // Add user indicator overlay
        await page.evaluate((userName, userColor) => {
          const indicator = document.getElementById('demo-user-indicator');
          if (!indicator) {
            const div = document.createElement('div');
            div.id = 'demo-user-indicator';
            div.style.cssText = `
              position: fixed;
              top: 10px;
              left: 10px;
              background: ${userColor};
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              font-size: 16px;
              z-index: 10000;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `;
            div.textContent = userName;
            document.body.appendChild(div);
          }
        }, this.users[i].name, this.users[i].color);
        
        return page.screenshot({ path: path.join(this.outputDir, `${filename}_user${i}.png`) });
      })
    );
    
    // Store annotation for later overlay
    if (annotation) {
      this.annotations.push({ 
        frameIndex: this.frameIndex, 
        annotation,
        duration 
      });
    }
    
    this.frameIndex++;
    
    // Remove highlights after capture
    if (highlight) {
      await this.removeHighlight(highlight);
    }
  }

  async addHighlight(highlight) {
    const { userIndex, selector, color = '#FFD700' } = highlight;
    
    if (userIndex !== undefined && this.pages[userIndex]) {
      await this.pages[userIndex].evaluate((sel, col) => {
        const element = document.querySelector(sel);
        if (element) {
          element.style.outline = `3px solid ${col}`;
          element.style.outlineOffset = '2px';
          element.classList.add('demo-highlighted');
        }
      }, selector, color);
    }
  }

  async removeHighlight(highlight) {
    const { userIndex } = highlight;
    
    if (userIndex !== undefined && this.pages[userIndex]) {
      await this.pages[userIndex].evaluate(() => {
        const elements = document.querySelectorAll('.demo-highlighted');
        elements.forEach(el => {
          el.style.outline = '';
          el.style.outlineOffset = '';
          el.classList.remove('demo-highlighted');
        });
      });
    }
  }

  async wait(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async slowType(page, selector, text, speed = 'normal') {
    await page.focus(selector);
    await page.click(selector, { clickCount: 3 });
    await page.keyboard.press('Backspace');
    
    const delays = {
      fast: [20, 30],
      normal: [30, 50],
      slow: [50, 80]
    };
    
    const [min, max] = delays[speed] || delays.normal;
    
    for (const char of text) {
      await page.type(selector, char);
      await this.wait(min + Math.random() * (max - min));
    }
  }

  async run() {
    try {
      await this.init();
      
      console.log('🎬 Enhanced 4-User WebSocket Demo');
      console.log('=================================');
      
      // Clear any existing data
      await this.clearData();
      
      // Demo flow
      await this.scene1_CreateAndJoin();
      await this.scene2_WebSocketDemo();
      await this.scene3_MultiUserAddMovies();
      await this.scene4_StartVoting();
      await this.scene5_VotingAtDifferentSpeeds();
      await this.scene6_LiveResults();
      await this.scene7_IRVElimination();
      
      // Generate video with annotations
      await this.generateEnhancedVideo();
      
      console.log('\n✅ Enhanced demo completed successfully!');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    } finally {
      await this.cleanup();
    }
  }

  async clearData() {
    try {
      const response = await fetch(`${this.appUrl}/api/votes/clear`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'demo-clear-all' })
      });
      console.log('  ✅ Cleared existing data');
    } catch (error) {
      console.log('  ⚠️ Could not clear data:', error.message);
    }
  }

  async scene1_CreateAndJoin() {
    console.log('\n📍 Scene 1: Create Room and Join');
    
    // Create room
    const page = await this.browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.goto(this.appUrl);
    await page.waitForSelector('button', { timeout: 10000 });
    
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
    
    // All users join simultaneously
    console.log('  👥 All 4 users joining...');
    const joinPromises = this.users.map(async (user, i) => {
      const context = await this.browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 480, height: 800 });
      
      await page.goto(roomUrl);
      await page.waitForSelector('input[placeholder="Search for a movie..."]', { timeout: 10000 });
      
      this.contexts[i] = context;
      this.pages[i] = page;
      
      console.log(`    ✅ ${user.name} joined`);
      return page;
    });
    
    await Promise.all(joinPromises);
    await this.wait(1000);
    
    await this.captureFrame('all_users_joined', {
      annotation: '4 users have joined the movie night session',
      duration: 3
    });
  }

  async scene2_WebSocketDemo() {
    console.log('\n🔄 Scene 2: WebSocket Real-time Sync');
    
    // Alex adds a movie
    await this.captureFrame('before_websocket_demo', {
      annotation: 'Watch how WebSocket syncs in real-time',
      duration: 2
    });
    
    console.log('  📽️ Alex searches for a movie...');
    await this.slowType(
      this.pages[0], 
      'input[placeholder="Search for a movie..."]', 
      'Top Gun Maverick',
      'normal'
    );
    
    await this.wait(1500);
    await this.captureFrame('alex_searching', {
      highlight: { userIndex: 0, selector: 'input[placeholder="Search for a movie..."]' },
      annotation: 'Alex searches for "Top Gun: Maverick"',
      duration: 2
    });
    
    // Click to add
    const searchResults = await this.pages[0].$$('button.w-full.px-4.py-3');
    if (searchResults.length > 0) {
      // Highlight the button about to be clicked
      await this.captureFrame('about_to_add', {
        highlight: { userIndex: 0, selector: 'button.w-full.px-4.py-3' },
        annotation: 'Alex clicks to add the movie',
        duration: 1
      });
      
      await searchResults[0].click();
      
      // Capture immediately to show instant sync
      await this.wait(300); // Just enough for WebSocket
      await this.captureFrame('websocket_instant_sync', {
        annotation: '⚡ Movie instantly appears on ALL screens!',
        duration: 3
      });
      
      // Show it more clearly
      await this.wait(1000);
      await this.captureFrame('websocket_no_refresh', {
        annotation: 'No page refresh needed - WebSocket magic! ✨',
        duration: 2
      });
    }
  }

  async scene3_MultiUserAddMovies() {
    console.log('\n🎬 Scene 3: Multiple Users Add Movies');
    
    // Clear search boxes
    for (const page of this.pages) {
      await page.click('input[placeholder="Search for a movie..."]', { clickCount: 3 });
      await page.keyboard.press('Backspace');
    }
    
    // Sam and Jordan add movies simultaneously
    console.log('  🎭 Multiple users adding movies at once...');
    
    const samAddPromise = (async () => {
      await this.slowType(this.pages[1], 'input[placeholder="Search for a movie..."]', 'The Notebook', 'fast');
      await this.wait(1500);
      const results = await this.pages[1].$$('button.w-full.px-4.py-3');
      if (results[0]) {
        await results[0].click();
        console.log('    ✅ Sam added "The Notebook"');
      }
    })();
    
    const jordanAddPromise = (async () => {
      await this.wait(500); // Slight offset
      await this.slowType(this.pages[2], 'input[placeholder="Search for a movie..."]', 'Interstellar', 'slow');
      await this.wait(1500);
      const results = await this.pages[2].$$('button.w-full.px-4.py-3');
      if (results[0]) {
        await results[0].click();
        console.log('    ✅ Jordan added "Interstellar"');
      }
    })();
    
    await this.captureFrame('multi_user_adding_start', {
      annotation: 'Sam and Jordan add movies simultaneously',
      duration: 2
    });
    
    await Promise.all([samAddPromise, jordanAddPromise]);
    
    await this.wait(500);
    await this.captureFrame('multi_user_added', {
      annotation: 'Both movies appear on all screens instantly',
      duration: 2
    });
    
    // Casey adds multiple movies quickly
    console.log('  🚀 Casey adds multiple movies rapidly...');
    for (const movie of ['Parasite', 'Everything Everywhere All at Once']) {
      await this.pages[3].click('input[placeholder="Search for a movie..."]', { clickCount: 3 });
      await this.pages[3].keyboard.press('Backspace');
      await this.pages[3].type('input[placeholder="Search for a movie..."]', movie);
      await this.wait(1500);
      
      const results = await this.pages[3].$$('button.w-full.px-4.py-3');
      if (results[0]) {
        await results[0].click();
        console.log(`    ✅ Casey added "${movie}"`);
        await this.wait(500);
        await this.captureFrame(`casey_adds_${movie.replace(/[^a-z0-9]/gi, '_')}`, {
          annotation: `Casey adds "${movie}" - syncs to all`,
          duration: 1
        });
      }
    }
    
    // Final state with all movies
    await this.wait(1000);
    await this.captureFrame('all_movies_ready', {
      annotation: '8 movies added collaboratively - ready to vote!',
      duration: 3
    });
  }

  async scene4_StartVoting() {
    console.log('\n🗳️ Scene 4: Start Voting Phase');
    
    // Admin starts voting (assuming first user is admin)
    const adminControls = await this.pages[0].$('.admin-controls button');
    if (adminControls) {
      await this.captureFrame('before_voting_start', {
        highlight: { userIndex: 0, selector: '.admin-controls button' },
        annotation: 'Admin (Alex) starts the voting phase',
        duration: 2
      });
      
      await adminControls.click();
      await this.wait(1000);
      
      await this.captureFrame('voting_phase_started', {
        annotation: 'Voting is now open - ranked choice style',
        duration: 2
      });
    }
  }

  async scene5_VotingAtDifferentSpeeds() {
    console.log('\n⏱️ Scene 5: Users Vote at Different Speeds');
    
    // Alex votes super fast
    console.log('  ⚡ Alex votes quickly...');
    const alexMovies = await this.pages[0].$$('.movie-item button, [data-testid="movie-item"] button');
    for (let i = 0; i < Math.min(3, alexMovies.length); i++) {
      await alexMovies[i].click();
      await this.wait(200);
    }
    
    await this.captureFrame('alex_ranking_fast', {
      highlight: { userIndex: 0, selector: '.movie-item' },
      annotation: 'Alex ranks movies quickly',
      duration: 1
    });
    
    // Alex submits first
    const alexSubmit = await this.pages[0].$('button:has-text("Submit")');
    if (alexSubmit) {
      await alexSubmit.click();
      await this.wait(1000);
      
      await this.captureFrame('alex_submitted_first', {
        annotation: 'Alex submits vote while others still ranking!',
        duration: 3
      });
    }
    
    // Others vote at different speeds
    console.log('  🕐 Others continue voting...');
    
    // Sam votes at medium speed
    const samVotePromise = (async () => {
      const movies = await this.pages[1].$$('.movie-item button, [data-testid="movie-item"] button');
      for (let i = 0; i < Math.min(3, movies.length); i++) {
        await movies[i].click();
        await this.wait(600);
      }
      const submit = await this.pages[1].$('button:has-text("Submit")');
      if (submit) await submit.click();
      console.log('    ✅ Sam submitted vote');
    })();
    
    // Jordan votes slowly and carefully
    const jordanVotePromise = (async () => {
      await this.wait(1000); // Thinking time
      const movies = await this.pages[2].$$('.movie-item button, [data-testid="movie-item"] button');
      for (let i = 0; i < Math.min(4, movies.length); i++) {
        await movies[i].click();
        await this.wait(1200);
      }
      const submit = await this.pages[2].$('button:has-text("Submit")');
      if (submit) await submit.click();
      console.log('    ✅ Jordan submitted vote');
    })();
    
    await this.captureFrame('others_still_voting', {
      annotation: 'Sam and Jordan still ranking their choices',
      duration: 2
    });
    
    await Promise.all([samVotePromise, jordanVotePromise]);
    
    await this.captureFrame('most_voted', {
      annotation: '3 of 4 users have voted - Casey still deciding',
      duration: 2
    });
    
    // Casey finishes last
    console.log('  🐢 Casey takes their time...');
    const caseyMovies = await this.pages[3].$$('.movie-item button, [data-testid="movie-item"] button');
    for (let i = 0; i < Math.min(4, caseyMovies.length); i++) {
      await caseyMovies[i].click();
      await this.wait(800);
    }
    
    const caseySubmit = await this.pages[3].$('button:has-text("Submit")');
    if (caseySubmit) {
      await caseySubmit.click();
      console.log('    ✅ Casey submitted vote');
    }
    
    await this.wait(1000);
    await this.captureFrame('all_votes_submitted', {
      annotation: 'All votes are in! Time to see results',
      duration: 2
    });
  }

  async scene6_LiveResults() {
    console.log('\n📊 Scene 6: Live Results Update');
    
    // Navigate all to results
    const navigatePromises = this.pages.map(async (page, i) => {
      const resultsUrl = page.url().replace('/vote', '/results');
      await page.goto(resultsUrl);
      console.log(`    📊 ${this.users[i].name} viewing results`);
    });
    
    await Promise.all(navigatePromises);
    await this.wait(2000);
    
    await this.captureFrame('live_results_view', {
      annotation: 'Live results update as votes come in',
      duration: 3
    });
    
    // Show vote counts
    await this.captureFrame('vote_counts_visible', {
      annotation: 'Vote counts and percentages shown in real-time',
      duration: 2
    });
  }

  async scene7_IRVElimination() {
    console.log('\n🏆 Scene 7: IRV Elimination Rounds');
    
    // Find and click IRV toggle on multiple screens
    for (let i = 0; i < 2; i++) {
      const toggle = await this.pages[i].$('button:has-text("View Elimination Rounds")');
      if (toggle) {
        if (i === 0) {
          await this.captureFrame('irv_toggle_visible', {
            highlight: { userIndex: 0, selector: 'button:has-text("View Elimination Rounds")' },
            annotation: 'IRV elimination rounds can be expanded',
            duration: 2
          });
        }
        
        await toggle.click();
        await this.wait(1000);
        
        if (i === 0) {
          await this.captureFrame('irv_rounds_expanded', {
            annotation: 'Detailed IRV rounds showing vote transfers',
            duration: 3
          });
        }
      }
    }
    
    // Scroll to show more details
    await this.pages[0].evaluate(() => {
      const eliminationSection = document.querySelector('[class*="elimination"]');
      if (eliminationSection) {
        eliminationSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    
    await this.wait(1500);
    await this.captureFrame('irv_details_full', {
      annotation: 'Each elimination round shows vote redistribution',
      duration: 3
    });
    
    // Final winner
    await this.pages[0].evaluate(() => window.scrollTo(0, 0));
    await this.wait(1000);
    
    await this.captureFrame('final_winner_irv', {
      annotation: '🏆 Winner determined by Instant-Runoff Voting!',
      duration: 4
    });
  }

  async generateEnhancedVideo() {
    const outputPath = path.join(__dirname, 'enhanced_4user_websocket_demo.mp4');
    
    console.log('  🖼️ Creating annotated 2x2 grid composites...');
    
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
    
    // Create composites with annotations
    for (const [frameNum, frameFiles] of Object.entries(frameGroups)) {
      if (frameFiles.length === 4) {
        const sortedFiles = frameFiles.sort();
        const inputs = sortedFiles.map(f => `-i "${path.join(this.outputDir, f)}"`).join(' ');
        
        const frameIndex = parseInt(frameNum);
        const annotationInfo = this.annotations.find(a => a.frameIndex === frameIndex);
        
        // Create 2x2 grid with user labels and annotation
        let filterComplex = `
          [0:v]scale=480:800[s0];
          [1:v]scale=480:800[s1];
          [2:v]scale=480:800[s2];
          [3:v]scale=480:800[s3];
          [s0][s1]hstack=inputs=2[top];
          [s2][s3]hstack=inputs=2[bottom];
          [top][bottom]vstack=inputs=2[grid]
        `;
        
        if (annotationInfo) {
          // Add annotation bar at bottom
          filterComplex += `;[grid]pad=w=iw:h=ih+80:x=0:y=0:color=black[padded];`;
          filterComplex += `[padded]drawtext=text='${annotationInfo.annotation.replace(/'/g, "\\'")}':`;
          filterComplex += `fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=32:`;
          filterComplex += `fontcolor=white:x=(w-text_w)/2:y=h-50[v]`;
        } else {
          filterComplex += `[grid]copy[v]`;
        }
        
        const compositeCmd = `ffmpeg -y ${inputs} -filter_complex "${filterComplex.replace(/\n/g, '')}" -map "[v]" "${path.join(this.outputDir, `composite_${frameNum}.png`)}"`;
        
        try {
          await execPromise(compositeCmd);
        } catch (error) {
          console.error(`Failed to create composite for frame ${frameNum}:`, error.message);
        }
        
        // Duplicate frames based on duration
        if (annotationInfo && annotationInfo.duration > 1) {
          for (let d = 1; d < annotationInfo.duration; d++) {
            const dupNum = String(parseInt(frameNum) + d * 0.1).padStart(4, '0');
            await fs.copyFile(
              path.join(this.outputDir, `composite_${frameNum}.png`),
              path.join(this.outputDir, `composite_${dupNum}.png`)
            );
          }
        }
      }
    }
    
    // Generate video
    console.log('  🎬 Generating enhanced video with annotations...');
    const videoCmd = `ffmpeg -y -framerate 6 -pattern_type glob -i "${this.outputDir}/composite_*.png" -c:v libx264 -pix_fmt yuv420p -preset medium -crf 23 "${outputPath}"`;
    
    try {
      await execPromise(videoCmd);
      console.log(`  ✅ Video created: ${outputPath}`);
      
      // Create versions
      const shortPath = path.join(__dirname, 'enhanced_4user_websocket_demo_60s.mp4');
      await execPromise(`ffmpeg -y -i "${outputPath}" -t 60 -c copy "${shortPath}"`);
      console.log(`  ✅ 60-second version created`);
      
      // Copy to public
      const publicPath = path.join(__dirname, '..', 'public', 'videos', 'enhanced_4user_websocket_demo.mp4');
      await fs.mkdir(path.dirname(publicPath), { recursive: true });
      await fs.copyFile(outputPath, publicPath);
      console.log(`  ✅ Copied to public folder`);
      
    } catch (error) {
      console.error('  ❌ Video generation error:', error);
    }
  }

  async cleanup() {
    for (const context of this.contexts) {
      if (context) await context.close();
    }
    
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run the demo
if (require.main === module) {
  const demo = new Enhanced4UserWebSocketDemo();
  demo.run().catch(console.error);
}

module.exports = Enhanced4UserWebSocketDemo;