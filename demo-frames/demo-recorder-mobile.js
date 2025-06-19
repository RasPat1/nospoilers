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
    
    // Configuration for mobile viewport
    this.config = {
      appUrl: config.appUrl || 'http://localhost:3000',
      headless: config.headless || false,
      slowMo: config.slowMo || 100, // Slower for better visibility
      screenshotDir: config.screenshotDir || '.',
      outputVideo: config.outputVideo || 'movie_night_demo_mobile.mp4',
      viewport: config.viewport || { width: 390, height: 844 } // iPhone 14 Pro size
    };
  }

  async init() {
    // Create screenshot directory
    await fs.mkdir(this.config.screenshotDir, { recursive: true });
    
    // Clean up old screenshots
    const files = await fs.readdir(this.config.screenshotDir);
    for (const file of files) {
      if (file.startsWith('scene_') && file.endsWith('.png')) {
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
        `--window-size=${this.config.viewport.width},${this.config.viewport.height + 100}` // Extra height for browser chrome
      ]
    });

    console.log('✅ Browser launched successfully (Mobile viewport)');
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
    const duration = options.duration || 3000; // Longer default duration
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
      // Add annotation if provided - LARGER and MORE VISIBLE
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
      await this.delay(500);
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
        top: 20px;
        left: 20px;
        right: 20px;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(139, 92, 246, 0.95) 100%);
        color: white;
        padding: 24px 28px;
        border-radius: 16px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 24px;
        font-weight: 600;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        text-align: center;
        line-height: 1.4;
        letter-spacing: -0.5px;
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
      await page.type(selector, text, { delay: 100 }); // Slower typing for visibility
      return true;
    } catch (error) {
      console.error(`❌ Failed to type in ${selector}:`, error.message);
      return false;
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

  // Clear all existing data before demo
  async clearAllData() {
    console.log('\n🧹 Clearing existing data...');
    
    // Create admin user and login
    const admin = await this.createUser('DataCleaner');
    await admin.goto(`${this.config.appUrl}/admin?admin=admin123`);
    await this.delay(1500);
    
    // Login
    await this.safeType(admin, 'input[type="text"]', 'admin');
    await this.safeType(admin, 'input[type="password"]', 'admin123');
    await this.clickButtonByText(admin, 'Login');
    await this.delay(2000);
    
    // Click reset votes only button (to keep movies)
    await this.clickButtonByText(admin, 'Reset Votes & Start New Round');
    await this.delay(500);
    
    // Confirm reset
    await admin.evaluate(() => {
      // Handle the confirmation dialog
      window.confirm = () => true;
    });
    
    await this.clickButtonByText(admin, 'Reset Votes & Start New Round');
    await this.delay(2000);
    
    // Close admin context
    if (this.users['DataCleaner'] && this.users['DataCleaner'].context) {
      await this.users['DataCleaner'].context.close();
    }
    delete this.users['DataCleaner'];
    
    console.log('✅ All data cleared');
  }

  // Main demo script
  async runDemo() {
    console.log('🎬 Starting NoSpoilers Mobile Demo Recording...\n');

    try {
      // Clear all existing data first
      await this.clearAllData();

      // Create users
      const sarah = await this.createUser('Sarah');
      const mike = await this.createUser('Mike');
      const ana = await this.createUser('Ana');
      const admin = await this.createUser('Admin');

      // Scene 1: Landing Page
      console.log('\n📍 Scene 1: Landing Page');
      await sarah.goto(this.config.appUrl);
      await this.delay(2000);
      await this.captureScene('landing_page', {
        annotation: 'NoSpoilers: Movie Night Democracy',
        duration: 3500
      });

      // Scene 2: Navigate to Vote Page
      console.log('\n📍 Scene 2: Starting a New Vote');
      await sarah.goto(`${this.config.appUrl}/vote`);
      await this.delay(2000);
      await this.captureScene('vote_page_empty', {
        annotation: 'Sarah starts adding movies',
        duration: 3000
      });

      // Scene 3: Sarah adds first movie
      console.log('\n📍 Scene 3: Sarah Adding Movies');
      
      await this.safeType(sarah, 'input[placeholder="Search for a movie..."]', 'Inception');
      await this.delay(2000);
      await this.captureScene('sarah_search_inception', {
        annotation: 'Searching movies from TMDB',
        duration: 3000
      });
      
      // Click first result
      await sarah.waitForSelector('button[class*="hover:bg-neutral-100"]', { visible: true });
      await sarah.click('button[class*="hover:bg-neutral-100"]');
      await this.delay(1500);
      
      // Add to ranking
      await this.clickButtonByText(sarah, 'Add to Ranking');
      await this.delay(1500);
      await this.captureScene('sarah_added_inception', {
        annotation: 'First movie added by Sarah',
        duration: 3000
      });

      // Sarah adds another movie
      await this.addMovie(sarah, 'The Dark Knight');
      await this.delay(1000);
      await this.captureScene('sarah_two_movies', {
        annotation: 'Sarah adds a second movie',
        duration: 3000
      });

      // Scene 4: Mike joins and sees Sarah's movies
      console.log('\n📍 Scene 4: Mike Joins');
      await mike.goto(`${this.config.appUrl}/vote`);
      await this.delay(2000);
      await this.captureScene('mike_sees_existing', {
        user: 'Mike',
        annotation: 'Mike sees Sarah\'s movies!',
        duration: 4000
      });

      // Mike adds his own movie
      await this.addMovie(mike, 'Interstellar');
      await this.delay(1500);
      await this.captureScene('mike_adds_movie', {
        user: 'Mike',
        annotation: 'Mike adds his favorite',
        duration: 3000
      });

      // Scene 5: Ana joins and sees all movies
      console.log('\n📍 Scene 5: Ana Joins');
      await ana.goto(`${this.config.appUrl}/vote`);
      await this.delay(2000);
      await this.captureScene('ana_sees_all', {
        user: 'Ana',
        annotation: 'Ana sees movies from both users',
        duration: 4000
      });

      // Ana adds a movie
      await this.addMovie(ana, 'Parasite');
      await this.delay(1500);
      await this.captureScene('ana_adds_movie', {
        user: 'Ana',
        annotation: 'Everyone contributes movies',
        duration: 3000
      });

      // Scene 6: Sarah votes (including movies she didn't add)
      console.log('\n📍 Scene 6: Voting Time');
      await sarah.reload();
      await this.delay(2000);
      await this.captureScene('sarah_sees_all_movies', {
        annotation: '4 movies from 3 different users',
        duration: 3500
      });

      // Sarah ranks movies
      await this.rankMoviesSimple(sarah, ['Inception', 'Parasite', 'Interstellar']);
      await this.delay(1500);
      await this.captureScene('sarah_ranking', {
        annotation: 'Sarah ranks her top 3',
        duration: 3000
      });

      // Submit vote
      await this.clickButtonByText(sarah, 'Submit Rankings');
      await this.delay(2000);
      await this.captureScene('sarah_voted', {
        annotation: 'Vote submitted!',
        duration: 3000
      });

      // Scene 7: Mike votes for movies including ones he didn't add
      console.log('\n📍 Mike voting...');
      await mike.reload();
      await this.delay(1500);
      await this.rankMoviesSimple(mike, ['Interstellar', 'Inception', 'The Dark Knight']);
      await this.clickButtonByText(mike, 'Submit Rankings');
      await this.delay(1500);

      // Ana votes
      console.log('\n📍 Ana voting...');
      await ana.reload();
      await this.delay(1500);
      await this.rankMoviesSimple(ana, ['Parasite', 'Inception', 'Interstellar']);
      await this.clickButtonByText(ana, 'Submit Rankings');
      await this.delay(1500);

      // Scene 8: View Results
      console.log('\n📍 Scene 7: Results');
      await sarah.goto(`${this.config.appUrl}/results`);
      await this.delay(2500);
      await this.captureScene('results_live', {
        annotation: 'Live voting results',
        duration: 3500
      });

      await this.delay(2000);
      await this.captureScene('results_final', {
        annotation: 'Winner by ranked choice!',
        duration: 4000
      });

      // Scene 9: Admin Panel
      console.log('\n📍 Scene 8: Admin Panel');
      await admin.goto(`${this.config.appUrl}/admin?admin=admin123`);
      await this.delay(1500);
      
      await this.safeType(admin, 'input[type="text"]', 'admin');
      await this.safeType(admin, 'input[type="password"]', 'admin123');
      await this.clickButtonByText(admin, 'Login');
      await this.delay(2000);
      
      await this.captureScene('admin_dashboard', {
        user: 'Admin',
        annotation: 'Admin can reset for next vote',
        duration: 3500
      });

      // Final scene
      await sarah.goto(`${this.config.appUrl}/vote`);
      await this.delay(1500);
      await this.captureScene('final_view', {
        annotation: 'Ready for movie night! 🍿',
        duration: 4000
      });

      console.log('\n✅ Demo recording complete!');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
      throw error;
    }
  }

  // Simplified movie adding for mobile
  async addMovie(page, movieName) {
    const searchInput = await page.$('input[placeholder="Search for a movie..."]');
    if (searchInput) {
      await searchInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
    }
    
    await this.safeType(page, 'input[placeholder="Search for a movie..."]', movieName);
    await this.delay(2000);
    
    try {
      await page.waitForSelector('button[class*="hover:bg-neutral-100"]', { 
        visible: true,
        timeout: 3000 
      });
      await page.click('button[class*="hover:bg-neutral-100"]');
      await this.delay(1000);
      
      await this.clickButtonByText(page, 'Add to Ranking');
      await this.delay(1000);
    } catch (error) {
      console.log(`⚠️  Could not add movie: ${movieName}`);
    }
  }

  // Simplified ranking for mobile (just click movies in order)
  async rankMoviesSimple(page, movieTitles) {
    console.log(`Ranking movies: ${movieTitles.join(', ')}`);
    
    for (let i = 0; i < movieTitles.length; i++) {
      try {
        // Find and click the movie card
        await page.evaluate((title) => {
          const cards = Array.from(document.querySelectorAll('div'));
          const card = cards.find(c => {
            const h3 = c.querySelector('h3');
            return h3 && h3.textContent.includes(title);
          });
          if (card) card.click();
        }, movieTitles[i]);
        
        await this.delay(800);
      } catch (error) {
        console.log(`⚠️  Could not rank: ${movieTitles[i]}`);
      }
    }
  }

  // Generate video from screenshots
  async createVideo() {
    console.log('\n🎥 Creating video from screenshots...');
    
    let concatContent = this.screenshots.map(s => 
      `file '${path.resolve(this.config.screenshotDir, s.filename)}'\nduration ${s.duration / 1000}`
    ).join('\n');
    
    if (this.screenshots.length > 0) {
      const lastFrame = this.screenshots[this.screenshots.length - 1];
      concatContent += `\nfile '${path.resolve(this.config.screenshotDir, lastFrame.filename)}'`;
    }
    
    const concatFile = path.join(this.config.screenshotDir, 'concat_mobile.txt');
    await fs.writeFile(concatFile, concatContent);
    
    // FFmpeg command for mobile aspect ratio
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
    slowMo: parseInt(process.env.SLOW_MO || '100'),
    screenshotDir: './demo-frames',
    outputVideo: 'movie_night_demo_mobile.mp4'
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

  console.log('\n📊 Demo Summary:');
  console.log(`- Total scenes captured: ${demo.screenshots.length}`);
  console.log(`- Output video: ${demo.config.outputVideo}`);
  console.log(`- 30-second version: ${demo.config.outputVideo.replace('.mp4', '_30sec.mp4')}`);
}

if (require.main === module) {
  main();
}

module.exports = MovieNightDemoRecorder;