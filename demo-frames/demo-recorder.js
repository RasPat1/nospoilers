const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class MovieNightDemoRecorder {
  constructor(config = {}) {
    this.browser = null;
    this.users = {};
    this.screenshots = [];
    this.screenIndex = 0;
    
    // Configuration
    this.config = {
      appUrl: config.appUrl || 'http://localhost:3000',
      headless: config.headless || false,
      slowMo: config.slowMo || 50, // Slow down actions for visibility
      screenshotDir: config.screenshotDir || '.',
      outputVideo: config.outputVideo || 'movie_night_demo.mp4',
      viewport: config.viewport || { width: 1920, height: 1080 }
    };
  }

  async init() {
    // Create screenshot directory
    await fs.mkdir(this.config.screenshotDir, { recursive: true });
    
    // Clean up old screenshots
    const files = await fs.readdir(this.config.screenshotDir);
    for (const file of files) {
      if (file.endsWith('.png')) {
        await fs.unlink(path.join(this.config.screenshotDir, file));
      }
    }

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      slowMo: this.config.slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        `--window-size=${this.config.viewport.width},${this.config.viewport.height}`
      ]
    });

    console.log('✅ Browser launched successfully');
  }

  async createUser(username, options = {}) {
    const context = await this.browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport(this.config.viewport);
    
    // Set up console logging for debugging
    page.on('console', msg => console.log(`[${username}]:`, msg.text()));
    page.on('error', err => console.error(`[${username}] Error:`, err));
    
    this.users[username] = { 
      context, 
      page,
      name: username,
      viewport: options.viewport || this.config.viewport
    };
    
    console.log(`✅ Created user: ${username}`);
    return page;
  }

  async captureScene(label, options = {}) {
    const duration = options.duration || 2000;
    const user = options.user || 'Sarah';
    const fullPage = options.fullPage || false;
    
    const userObj = this.users[user];
    if (!userObj) {
      console.error(`❌ User ${user} not found`);
      return;
    }

    const filename = `scene_${String(this.screenIndex).padStart(3, '0')}_${label.replace(/\s+/g, '_')}.png`;
    const filepath = path.join(this.config.screenshotDir, filename);
    
    try {
      // Add annotation if provided
      if (options.annotation) {
        await this.addAnnotation(userObj.page, options.annotation);
      }

      await userObj.page.screenshot({ 
        path: filepath,
        fullPage: fullPage 
      });
      
      // Remove annotation
      if (options.annotation) {
        await this.removeAnnotation(userObj.page);
      }
      
      this.screenshots.push({ 
        filename, 
        duration, 
        label,
        user,
        index: this.screenIndex 
      });
      
      console.log(`📸 Captured: ${label} (${user})`);
      this.screenIndex++;
      
      // Small delay for visual effect
      await this.delay(300);
    } catch (error) {
      console.error(`❌ Failed to capture ${label}:`, error);
    }
  }

  async addAnnotation(page, text) {
    await page.evaluate((annotationText) => {
      const overlay = document.createElement('div');
      overlay.id = 'demo-annotation';
      overlay.style.cssText = `
        position: fixed;
        top: 40px;
        right: 40px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 18px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        max-width: 400px;
      `;
      overlay.textContent = annotationText;
      document.body.appendChild(overlay);
    }, text);
  }

  async removeAnnotation(page) {
    await page.evaluate(() => {
      const overlay = document.getElementById('demo-annotation');
      if (overlay) overlay.remove();
    });
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper function to safely wait and click
  async safeClick(page, selector, options = {}) {
    try {
      await page.waitForSelector(selector, { timeout: 5000, ...options });
      await page.click(selector);
      return true;
    } catch (error) {
      console.error(`❌ Failed to click ${selector}:`, error.message);
      return false;
    }
  }

  // Helper function to safely type
  async safeType(page, selector, text, options = {}) {
    try {
      await page.waitForSelector(selector, { timeout: 5000, ...options });
      await page.click(selector);
      await page.type(selector, text, { delay: 50 });
      return true;
    } catch (error) {
      console.error(`❌ Failed to type in ${selector}:`, error.message);
      return false;
    }
  }

  // Main demo script
  async runDemo() {
    console.log('🎬 Starting NoSpoilers Demo Recording...\n');

    try {
      // Create users (no login needed in NoSpoilers)
      const sarah = await this.createUser('Sarah');
      const mike = await this.createUser('Mike');
      const ana = await this.createUser('Ana');
      const admin = await this.createUser('Admin');

      // Scene 1: Landing Page
      console.log('\n📍 Scene 1: Landing Page');
      await sarah.goto(this.config.appUrl);
      await this.delay(2000);
      await this.captureScene('landing_page', {
        annotation: 'Welcome to NoSpoilers - Vote Together, Watch Together!',
        duration: 3000
      });

      // Scene 2: Navigate to Vote Page
      console.log('\n📍 Scene 2: Starting a New Vote');
      await sarah.goto(`${this.config.appUrl}/vote`);
      await this.delay(1500);
      await this.captureScene('vote_page_empty', {
        annotation: 'Ready to add movies for voting',
        duration: 2500
      });

      // Scene 3: Search and Add Movies
      console.log('\n📍 Scene 3: Adding Movies');
      
      // Search for first movie
      await this.safeType(sarah, 'input[placeholder="Search for a movie..."]', 'Hereditary');
      await this.delay(1500); // Wait for TMDB results
      await this.captureScene('search_results', {
        annotation: 'Real-time search from TMDB database',
        duration: 3000
      });
      
      // Click on the first autocomplete result
      await sarah.waitForSelector('button[class*="hover:bg-neutral-100"]', { visible: true });
      await sarah.click('button[class*="hover:bg-neutral-100"]');
      await this.delay(1000);
      
      // Click "Add to Ranking" button
      await this.clickButtonByText(sarah, 'Add to Ranking');
      await this.delay(1000);
      await this.captureScene('first_movie_added', {
        annotation: 'Movie added with ratings, cast & genres',
        duration: 2500
      });

      // Add more movies quickly
      await this.addMovie(sarah, 'The Conjuring');
      await this.addMovie(sarah, 'Get Out');

      // Scene 4: Multiple Users
      console.log('\n📍 Scene 4: Multiple Users Joining');
      
      // Mike navigates to vote page
      await mike.goto(`${this.config.appUrl}/vote`);
      await this.delay(1000);
      
      // Mike adds movies
      await this.addMovie(mike, 'Midsommar');
      await this.addMovie(mike, 'A Quiet Place');
      
      // Ana navigates to vote page
      await ana.goto(`${this.config.appUrl}/vote`);
      await this.delay(1000);
      
      // Ana adds a movie
      await this.addMovie(ana, 'Sinister');
      
      await this.captureScene('multiple_users_movies', {
        user: 'Mike',
        annotation: 'Everyone can add their favorite movies',
        duration: 3000
      });

      // Scene 5: Voting Process
      console.log('\n📍 Scene 5: Ranked Choice Voting');
      
      // Refresh Sarah's page to see all movies
      await sarah.reload();
      await this.delay(1500);
      
      await this.captureScene('voting_interface', {
        annotation: 'Drag movies to rank your top choices',
        duration: 3000
      });
      
      // Sarah ranks her movies
      await this.rankMovies(sarah, ['Get Out', 'The Conjuring', 'Hereditary']);
      await this.delay(1000);
      
      await this.captureScene('sarah_ranking_done', {
        annotation: 'Sarah has ranked her top 3 choices',
        duration: 2500
      });
      
      // Submit Sarah's vote
      await this.clickButtonByText(sarah, 'Submit Rankings');
      await this.delay(1500);
      
      await this.captureScene('sarah_voted', {
        annotation: 'Vote submitted! Sarah can see live results',
        duration: 2500
      });

      // Mike and Ana vote
      console.log('\n📍 Other users voting...');
      await this.rankAndVote(mike, ['Midsommar', 'Hereditary', 'Get Out']);
      await this.rankAndVote(ana, ['The Conjuring', 'Get Out', 'A Quiet Place']);

      // Scene 6: Live Results
      console.log('\n📍 Scene 6: Real-time Results');
      
      // Navigate to results page
      await sarah.goto(`${this.config.appUrl}/results`);
      await this.delay(2000);
      
      await this.captureScene('results_live', {
        annotation: 'Live results update as votes come in',
        duration: 3000
      });
      
      // Show the ranked choice elimination process
      await this.delay(2000);
      await this.captureScene('results_round_1', {
        annotation: 'Round 1: No movie has majority (>50%)',
        duration: 3000
      });
      
      await this.delay(2000);
      await this.captureScene('results_elimination', {
        annotation: 'Lowest ranked movie eliminated, votes redistribute',
        duration: 3000
      });
      
      await this.delay(2000);
      await this.captureScene('winner_announcement', {
        annotation: '🎉 Winner determined by ranked choice voting!',
        duration: 4000
      });

      // Scene 7: Admin Features
      console.log('\n📍 Scene 7: Admin Panel');
      
      // Navigate to admin with secret parameter
      await admin.goto(`${this.config.appUrl}/admin?admin=admin123`);
      await this.delay(1500);
      
      // Login to admin panel
      await this.safeType(admin, 'input[type="text"]', 'admin');
      await this.safeType(admin, 'input[type="password"]', 'admin123');
      await this.clickButtonByText(admin, 'Login');
      await this.delay(1500);
      
      await this.captureScene('admin_dashboard', {
        user: 'Admin',
        annotation: 'Admin can reset and start new votes',
        duration: 3000
      });
      
      // Show reset functionality
      await this.captureScene('admin_reset_option', {
        user: 'Admin',
        annotation: 'Reset everything to start fresh',
        duration: 2500
      });

      // Final scene - back to vote page
      await sarah.goto(`${this.config.appUrl}/vote`);
      await this.delay(1500);
      await this.captureScene('final_view', {
        annotation: 'Ready for your next movie night! 🍿',
        duration: 4000
      });

      console.log('\n✅ Demo recording complete!');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
      throw error;
    }
  }

  // Helper to add a movie
  async addMovie(page, movieName) {
    // Clear search input first
    const searchInput = await page.$('input[placeholder="Search for a movie..."]');
    if (searchInput) {
      await searchInput.click({ clickCount: 3 }); // Select all
      await page.keyboard.press('Backspace');
    }
    
    // Type movie name
    await this.safeType(page, 'input[placeholder="Search for a movie..."]', movieName);
    await this.delay(1500); // Wait for search results
    
    // Click first result in autocomplete
    try {
      await page.waitForSelector('button[class*="hover:bg-neutral-100"]', { 
        visible: true,
        timeout: 3000 
      });
      await page.click('button[class*="hover:bg-neutral-100"]');
      await this.delay(800);
      
      // Click "Add to Ranking" button
      await this.clickButtonByText(page, 'Add to Ranking');
      await this.delay(800);
    } catch (error) {
      console.log(`⚠️  Could not add movie: ${movieName}`);
    }
  }

  // Helper to click button by text content
  async clickButtonByText(page, text) {
    try {
      await page.evaluate((buttonText) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const button = buttons.find(btn => btn.textContent.includes(buttonText));
        if (button) button.click();
      }, text);
      return true;
    } catch (error) {
      console.error(`❌ Failed to click button with text "${text}"`);
      return false;
    }
  }

  // Rank movies by dragging them
  async rankMovies(page, movieTitles) {
    // For each movie, find it in available movies and drag to ranking
    for (let i = 0; i < movieTitles.length; i++) {
      const movieTitle = movieTitles[i];
      
      try {
        // Find the movie card with this title
        const movieCard = await page.evaluateHandle((title) => {
          const cards = Array.from(document.querySelectorAll('div'));
          return cards.find(card => {
            const h3 = card.querySelector('h3');
            return h3 && h3.textContent.includes(title);
          });
        }, movieTitle);
        
        if (movieCard) {
          // Get the bounding box of the movie card
          const box = await movieCard.boundingBox();
          if (box) {
            // Calculate drag positions
            const startX = box.x + box.width / 2;
            const startY = box.y + box.height / 2;
            
            // Target position (ranking area)
            const targetY = 300 + (i * 100); // Adjust based on ranking position
            
            // Perform drag and drop
            await page.mouse.move(startX, startY);
            await page.mouse.down();
            await this.delay(100);
            await page.mouse.move(startX - 400, targetY, { steps: 10 });
            await this.delay(100);
            await page.mouse.up();
            await this.delay(500);
          }
        }
      } catch (error) {
        console.log(`⚠️  Could not rank movie: ${movieTitle}`);
      }
    }
  }

  // Helper to rank movies and submit vote
  async rankAndVote(page, movieTitles) {
    await page.reload();
    await this.delay(1500);
    await this.rankMovies(page, movieTitles);
    await this.delay(1000);
    await this.clickButtonByText(page, 'Submit Rankings');
    await this.delay(1500);
  }

  // Generate video from screenshots
  async createVideo() {
    console.log('\n🎥 Creating video from screenshots...');
    
    // Create ffmpeg concat file
    let concatContent = this.screenshots.map(s => 
      `file '${path.resolve(this.config.screenshotDir, s.filename)}'\nduration ${s.duration / 1000}`
    ).join('\n');
    
    // Add last frame duration
    if (this.screenshots.length > 0) {
      const lastFrame = this.screenshots[this.screenshots.length - 1];
      concatContent += `\nfile '${path.resolve(this.config.screenshotDir, lastFrame.filename)}'`;
    }
    
    const concatFile = path.join(this.config.screenshotDir, 'concat.txt');
    await fs.writeFile(concatFile, concatContent);
    
    // FFmpeg command
    const ffmpegCommand = `ffmpeg -y -f concat -safe 0 -i "${concatFile}" ` +
      `-vf "scale=${this.config.viewport.width}:${this.config.viewport.height}:force_original_aspect_ratio=decrease,pad=${this.config.viewport.width}:${this.config.viewport.height}:(ow-iw)/2:(oh-ih)/2,fps=30" ` +
      `-c:v libx264 -pix_fmt yuv420p -preset slow -crf 22 "${this.config.outputVideo}"`;
    
    try {
      const { stdout, stderr } = await execPromise(ffmpegCommand);
      console.log('✅ Video created successfully:', this.config.outputVideo);
      
      // Create 30-second version
      await this.create30SecondVersion();
      
    } catch (error) {
      console.error('❌ FFmpeg error:', error);
      console.log('Make sure FFmpeg is installed: brew install ffmpeg');
    }
  }

  // Create 30-second sped-up version
  async create30SecondVersion() {
    const outputPath = this.config.outputVideo.replace('.mp4', '_30sec.mp4');
    const totalDuration = this.screenshots.reduce((sum, s) => sum + s.duration, 0) / 1000;
    const speedFactor = totalDuration / 30;
    
    if (speedFactor > 1) {
      const ffmpegCommand = `ffmpeg -y -i "${this.config.outputVideo}" ` +
        `-filter:v "setpts=${1/speedFactor}*PTS" -an "${outputPath}"`;
      
      try {
        await execPromise(ffmpegCommand);
        console.log(`✅ 30-second version created: ${outputPath}`);
      } catch (error) {
        console.error('❌ Failed to create 30-second version:', error);
      }
    }
  }

  // Cleanup
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Browser closed');
    }
  }
}

// Main execution
async function main() {
  const demo = new MovieNightDemoRecorder({
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    headless: process.env.HEADLESS === 'true',
    slowMo: parseInt(process.env.SLOW_MO || '50'),
    screenshotDir: './demo-frames',
    outputVideo: 'movie_night_demo.mp4'
  });

  try {
    await demo.init();
    await demo.runDemo();
    await demo.createVideo();
  } catch (error) {
    console.error('Demo failed:', error);
  } finally {
    await demo.cleanup();
  }

  // Summary
  console.log('\n📊 Demo Summary:');
  console.log(`- Total scenes captured: ${demo.screenshots.length}`);
  console.log(`- Output video: ${demo.config.outputVideo}`);
  console.log(`- 30-second version: ${demo.config.outputVideo.replace('.mp4', '_30sec.mp4')}`);
}

// Export for use as module or run directly
if (require.main === module) {
  main();
}

module.exports = MovieNightDemoRecorder;