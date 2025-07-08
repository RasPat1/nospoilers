const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class IRVShowcaseDemo {
  constructor(config = {}) {
    this.browser = null;
    this.users = {};
    this.screenshots = [];
    this.screenIndex = 0;
    
    this.config = {
      appUrl: config.appUrl || 'http://localhost:3000',
      headless: config.headless !== undefined ? config.headless : true,
      slowMo: config.slowMo || 0,
      screenshotDir: config.screenshotDir || './demo-frames',
      outputVideo: config.outputVideo || 'nospoilers_irv_demo.mp4'
    };
  }

  async init() {
    await fs.mkdir(this.config.screenshotDir, { recursive: true });
    
    // Clean up old screenshots
    const files = await fs.readdir(this.config.screenshotDir);
    for (const file of files) {
      if (file.startsWith('irv_') && file.endsWith('.png')) {
        await fs.unlink(path.join(this.config.screenshotDir, file));
      }
    }

    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      slowMo: this.config.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log('✅ Browser launched successfully');
  }

  async createUser(username) {
    const context = await this.browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    this.users[username] = { context, page, name: username };
    console.log(`✅ Created user: ${username}`);
    return page;
  }

  async captureScene(label, options = {}) {
    const duration = options.duration || 3000;
    const user = options.user || 'Sarah';
    
    const userObj = this.users[user];
    if (!userObj) {
      console.error(`❌ User ${user} not found`);
      return;
    }

    const filename = `irv_${String(this.screenIndex).padStart(3, '0')}_${label.replace(/\s+/g, '_')}.png`;
    const filepath = path.join(this.config.screenshotDir, filename);
    
    // Add annotation if provided
    if (options.annotation) {
      await this.addAnnotation(userObj.page, options.annotation);
    }

    await userObj.page.screenshot({ path: filepath });
    
    if (options.annotation) {
      await this.removeAnnotation(userObj.page);
    }
    
    this.screenshots.push({ filename, duration, label });
    console.log(`📸 Captured: ${label} (${user})`);
    this.screenIndex++;
    
    await this.delay(300);
  }

  async addAnnotation(page, text) {
    await page.evaluate((annotationText) => {
      const overlay = document.createElement('div');
      overlay.id = 'demo-annotation';
      overlay.style.cssText = `
        position: fixed;
        top: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
        padding: 20px 40px;
        border-radius: 16px;
        font-size: 24px;
        font-weight: 600;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
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

  async clearAllData() {
    console.log('\n🧹 Clearing existing data...');
    
    try {
      const admin = await this.createUser('DataCleaner');
      await admin.goto(`${this.config.appUrl}/admin?admin=admin123`);
      await this.delay(2000);
      
      // Try to find inputs with a more flexible approach
      const hasInputs = await admin.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        return inputs.length > 0;
      });
      
      if (hasInputs) {
        await admin.type('input[type="text"]', 'admin');
        await admin.type('input[type="password"]', 'admin123');
        await admin.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const login = buttons.find(b => b.textContent.includes('Login'));
          if (login) login.click();
        });
        await this.delay(2000);
        
        // Full reset to clear everything
        await admin.evaluate(() => {
          window.confirm = () => true;
          const buttons = Array.from(document.querySelectorAll('button'));
          const reset = buttons.find(b => b.textContent.includes('Delete Everything'));
          if (reset) reset.click();
        });
        await this.delay(2000);
      } else {
        console.log('⚠️  Admin page not accessible, skipping data clear');
      }
      
      await this.users['DataCleaner'].context.close();
      delete this.users['DataCleaner'];
      
      console.log('✅ Data clear attempted');
    } catch (error) {
      console.log('⚠️  Could not clear data:', error.message);
      if (this.users['DataCleaner']) {
        await this.users['DataCleaner'].context.close();
        delete this.users['DataCleaner'];
      }
    }
  }

  async runDemo() {
    console.log('🎬 Starting NoSpoilers IRV Demo...\n');

    try {
      await this.clearAllData();

      // Create our users
      const sarah = await this.createUser('Sarah');
      const mike = await this.createUser('Mike');
      const emma = await this.createUser('Emma');
      const alex = await this.createUser('Alex');

      // Scene 1: Landing Page
      console.log('\n📍 Scene 1: NoSpoilers Introduction');
      await sarah.goto(this.config.appUrl);
      await this.delay(2000);
      await this.captureScene('landing', {
        annotation: 'NoSpoilers: Fair Movie Selection with Instant-Runoff Voting',
        duration: 4000
      });

      // Scene 2: Sarah starts voting
      console.log('\n📍 Scene 2: Sarah Starts Adding Movies');
      await sarah.goto(`${this.config.appUrl}/vote`);
      await this.delay(2000);
      await this.captureScene('empty_vote_page', {
        annotation: 'Sarah starts the movie selection',
        duration: 3000
      });

      // Sarah adds first movie
      await sarah.waitForSelector('input[placeholder="Search for a movie..."]', { timeout: 5000 });
      await sarah.type('input[placeholder="Search for a movie..."]', 'The Matrix');
      await this.delay(2500);
      await this.captureScene('search_matrix', {
        annotation: 'Real-time movie search from TMDB',
        duration: 3000
      });
      
      await sarah.click('button[class*="hover:bg-neutral-100"]');
      await this.delay(1000);
      await sarah.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const add = buttons.find(b => b.textContent === 'Add to Ranking');
        if (add) add.click();
      });
      await this.delay(1500);

      // Scene 3: Mike sees the movie immediately
      console.log('\n📍 Scene 3: Real-time Movie Sharing');
      await mike.goto(`${this.config.appUrl}/vote`);
      await this.delay(2000);
      await this.captureScene('mike_sees_matrix', {
        user: 'Mike',
        annotation: 'Mike instantly sees Sarah\'s movie!',
        duration: 4000
      });

      // Sarah adds another movie
      await sarah.click('input[placeholder="Search for a movie..."]', { clickCount: 3 });
      await sarah.type('input[placeholder="Search for a movie..."]', 'Inception');
      await this.delay(2000);
      await sarah.click('button[class*="hover:bg-neutral-100"]');
      await this.delay(1000);
      await sarah.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const add = buttons.find(b => b.textContent === 'Add to Ranking');
        if (add) add.click();
      });
      await this.delay(1500);

      // Mike adds his movies
      console.log('\n📍 Mike adds his choices');
      await this.addMovie(mike, 'Interstellar');
      await this.delay(1000);
      await this.addMovie(mike, 'The Dark Knight');
      await this.delay(1500);
      
      await this.captureScene('four_movies', {
        user: 'Mike',
        annotation: 'Everyone contributes their favorites',
        duration: 3500
      });

      // Emma joins and adds a movie
      console.log('\n📍 Scene 4: More Users Join');
      await emma.goto(`${this.config.appUrl}/vote`);
      await this.delay(2000);
      await this.captureScene('emma_sees_all', {
        user: 'Emma',
        annotation: 'Emma sees all 4 movies from Sarah & Mike',
        duration: 3500
      });
      
      await this.addMovie(emma, 'Parasite');
      await this.delay(1500);

      // Alex joins
      await alex.goto(`${this.config.appUrl}/vote`);
      await this.delay(1500);
      await this.addMovie(alex, 'Dune');
      await this.delay(1500);

      // Scene 5: Voting begins
      console.log('\n📍 Scene 5: Ranked Choice Voting');
      await sarah.reload();
      await this.delay(2000);
      await this.captureScene('sarah_ready_to_vote', {
        annotation: '6 movies from 4 different users!',
        duration: 3500
      });

      // Sarah votes: 1. Inception, 2. The Matrix, 3. Dune
      await this.rankMovies(sarah, ['Inception', 'The Matrix', 'Dune']);
      await this.delay(1500);
      await this.captureScene('sarah_ranked', {
        annotation: 'Sarah ranks her top 3 choices',
        duration: 3000
      });
      
      await sarah.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
        if (submit) submit.click();
      });
      await this.delay(2000);

      // Mike votes: 1. Interstellar, 2. The Dark Knight, 3. Inception
      console.log('\n📍 Mike voting...');
      await mike.reload();
      await this.delay(1500);
      await this.rankMovies(mike, ['Interstellar', 'The Dark Knight', 'Inception']);
      await mike.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
        if (submit) submit.click();
      });
      await this.delay(1500);

      // Emma votes: 1. Parasite, 2. Inception, 3. The Matrix
      console.log('\n📍 Emma voting...');
      await emma.reload();
      await this.delay(1500);
      await this.rankMovies(emma, ['Parasite', 'Inception', 'The Matrix']);
      await emma.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
        if (submit) submit.click();
      });
      await this.delay(1500);

      // Alex votes: 1. Dune, 2. Interstellar, 3. The Matrix
      console.log('\n📍 Alex voting...');
      await alex.reload();
      await this.delay(1500);
      await this.rankMovies(alex, ['Dune', 'Interstellar', 'The Matrix']);
      await alex.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const submit = buttons.find(b => b.textContent.includes('Submit Rankings'));
        if (submit) submit.click();
      });
      await this.delay(1500);

      // Scene 6: View Results
      console.log('\n📍 Scene 6: Instant-Runoff Results');
      await sarah.goto(`${this.config.appUrl}/results`);
      await this.delay(2500);
      await this.captureScene('initial_results', {
        annotation: 'Live voting results - no clear majority yet!',
        duration: 4000
      });

      // Show elimination rounds
      await sarah.evaluate(() => {
        const button = document.querySelector('button[class*="hover:bg-neutral"]');
        if (button && button.textContent.includes('View Elimination Rounds')) {
          button.click();
        }
      });
      await this.delay(2000);
      
      // Scroll to show elimination rounds
      await sarah.evaluate(() => {
        const rounds = document.querySelector('div[class*="mt-4 space-y-4"]');
        if (rounds) rounds.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      await this.delay(1500);
      
      await this.captureScene('elimination_rounds', {
        annotation: 'IRV eliminates lowest vote-getters each round',
        duration: 5000
      });

      // Final scene
      await sarah.evaluate(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      await this.delay(1500);
      
      await this.captureScene('final_winner', {
        annotation: 'Fair winner selected by ranked choice! 🎬',
        duration: 4000
      });

      console.log('\n✅ Demo recording complete!');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
      throw error;
    }
  }

  async addMovie(page, movieName) {
    const searchInput = await page.$('input[placeholder="Search for a movie..."]');
    if (searchInput) {
      await searchInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
    }
    
    await page.type('input[placeholder="Search for a movie..."]', movieName);
    await this.delay(2000);
    
    try {
      await page.waitForSelector('button[class*="hover:bg-neutral-100"]', { timeout: 3000 });
      await page.click('button[class*="hover:bg-neutral-100"]');
      await this.delay(1000);
      
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const add = buttons.find(b => b.textContent === 'Add to Ranking');
        if (add) add.click();
      });
      await this.delay(1000);
    } catch (error) {
      console.log(`⚠️  Could not add movie: ${movieName}`);
    }
  }

  async rankMovies(page, movieTitles) {
    console.log(`Ranking movies: ${movieTitles.join(', ')}`);
    
    for (const title of movieTitles) {
      await page.evaluate((movieTitle) => {
        const cards = Array.from(document.querySelectorAll('div[class*="border-2"]'));
        const card = cards.find(c => {
          const h3 = c.querySelector('h3');
          return h3 && h3.textContent.includes(movieTitle);
        });
        if (card) card.click();
      }, title);
      await this.delay(800);
    }
  }

  async createVideo() {
    console.log('\n🎥 Creating video from screenshots...');
    
    let concatContent = this.screenshots.map(s => 
      `file '${path.resolve(this.config.screenshotDir, s.filename)}'
duration ${s.duration / 1000}`
    ).join('\n');
    
    // Add last frame
    if (this.screenshots.length > 0) {
      const lastFrame = this.screenshots[this.screenshots.length - 1];
      concatContent += `\nfile '${path.resolve(this.config.screenshotDir, lastFrame.filename)}'`;
    }
    
    const concatFile = path.join(this.config.screenshotDir, 'concat_irv.txt');
    await fs.writeFile(concatFile, concatContent);
    
    // Create full video
    const ffmpegCommand = `ffmpeg -y -f concat -safe 0 -i "${concatFile}" ` +
      `-vf "scale=1280:800:force_original_aspect_ratio=decrease,pad=1280:800:(ow-iw)/2:(oh-ih)/2,fps=30" ` +
      `-c:v libx264 -pix_fmt yuv420p -preset slow -crf 22 "${this.config.outputVideo}"`;
    
    try {
      await execPromise(ffmpegCommand);
      console.log('✅ Video created:', this.config.outputVideo);
      
      // Create 60-second version
      const totalDuration = this.screenshots.reduce((sum, s) => sum + s.duration, 0) / 1000;
      const speedFactor = totalDuration / 60;
      
      if (speedFactor > 1) {
        const output60 = this.config.outputVideo.replace('.mp4', '_60sec.mp4');
        const cmd60 = `ffmpeg -y -i "${this.config.outputVideo}" ` +
          `-filter:v "setpts=${1/speedFactor}*PTS" -an "${output60}"`;
        
        await execPromise(cmd60);
        console.log('✅ 60-second version:', output60);
      }
      
    } catch (error) {
      console.error('❌ FFmpeg error:', error);
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
  const demo = new IRVShowcaseDemo({
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    headless: process.env.HEADLESS === 'true',
    slowMo: parseInt(process.env.SLOW_MO || '50'),
    screenshotDir: './demo-frames',
    outputVideo: './demo-frames/nospoilers_irv_demo.mp4'
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
  console.log(`- Total scenes: ${demo.screenshots.length}`);
  console.log(`- Output: ${demo.config.outputVideo}`);
  console.log(`- 60-sec version: ${demo.config.outputVideo.replace('.mp4', '_60sec.mp4')}`);
}

if (require.main === module) {
  main();
}

module.exports = IRVShowcaseDemo;