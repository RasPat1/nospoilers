const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class Mobile4UserDemoFast {
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
    
    // Just 4 movies for faster demo
    this.movies = [
      { title: 'Everything Everywhere All at Once', addedBy: 0 },
      { title: 'The Lobster', addedBy: 1 },
      { title: 'Swiss Army Man', addedBy: 2 },
      { title: 'Coherence', addedBy: 3 }
    ];
  }

  async init() {
    console.log('🎬 Initializing Fast Mobile Demo...\n');
    
    await fs.mkdir(this.frameDir, { recursive: true });
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Clean existing composite frames only
    try {
      const files = await fs.readdir(this.frameDir);
      for (const file of files) {
        if (file.startsWith('composite_')) {
          await fs.unlink(path.join(this.frameDir, file));
        }
      }
    } catch (e) {}

    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 400, height: 800 },
      protocolTimeout: 300000
    });
    
    console.log('✅ Browser launched');
  }

  async captureFrame() {
    // Use Promise.allSettled to handle failures gracefully
    const screenshots = await Promise.allSettled(
      this.pages.map(page => 
        page.screenshot({ timeout: 5000 }).catch(() => null)
      )
    );
    
    const frameFiles = [];
    for (let i = 0; i < screenshots.length; i++) {
      if (screenshots[i].status === 'fulfilled' && screenshots[i].value) {
        const filename = `frame_${String(this.frameIndex).padStart(5, '0')}_user${i}.png`;
        const filepath = path.join(this.frameDir, filename);
        await fs.writeFile(filepath, screenshots[i].value);
        frameFiles.push(filepath);
      }
    }
    
    if (frameFiles.length === 4) {
      const compositeFile = path.join(this.frameDir, `composite_${String(this.frameIndex).padStart(5, '0')}.png`);
      const cmd = `ffmpeg -y ${frameFiles.map(f => `-i "${f}"`).join(' ')} ` +
        `-filter_complex "[0:v][1:v][2:v][3:v]hstack=inputs=4:shortest=1" "${compositeFile}" 2>/dev/null`;
      
      try {
        await execPromise(cmd);
        // Clean up individual frames
        await Promise.all(frameFiles.map(f => fs.unlink(f).catch(() => {})));
      } catch (e) {
        console.error('Composite failed:', e.message);
      }
    }
    
    this.frameIndex++;
  }

  async captureScene(label, frames = 3) {
    console.log(`📸 ${label}`);
    for (let i = 0; i < frames; i++) {
      await this.captureFrame();
      await this.wait(200); // Faster capture
    }
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async setupRoom() {
    console.log('\n🏠 Setting up room...');
    
    // Clear data
    try {
      await fetch(`${this.appUrl}/api/votes/clear`, { method: 'POST' });
    } catch (e) {}
    
    const setupPage = await this.browser.newPage();
    await setupPage.goto(this.appUrl);
    await this.wait(2000);
    
    const createButton = await setupPage.$('button');
    if (createButton) {
      await createButton.click();
      await this.wait(2000);
      this.roomUrl = setupPage.url();
      console.log(`✅ Room: ${this.roomUrl}`);
    }
    
    await setupPage.close();
  }

  async createUsers() {
    console.log('\n👥 Creating users...');
    
    for (let i = 0; i < 4; i++) {
      const page = await this.browser.newPage();
      await page.goto(this.roomUrl);
      await this.wait(2000);
      
      // Add user indicator
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
        `;
        document.body.appendChild(indicator);
      }, this.users[i]);
      
      this.pages.push(page);
      console.log(`✅ ${this.users[i].emoji} joined`);
    }
  }

  async addMovie(userIndex, movieTitle) {
    const page = this.pages[userIndex];
    const user = this.users[userIndex];
    
    console.log(`🎬 ${user.emoji} adding "${movieTitle}"`);
    
    try {
      const searchInput = await page.$('input[placeholder="Search for a movie..."]');
      if (!searchInput) return;
      
      await searchInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.type('input[placeholder="Search for a movie..."]', movieTitle, { delay: 30 });
      
      await this.captureScene(`${user.name} searching`, 2);
      await this.wait(1500);
      
      // Try to click movie result
      const movieButton = await page.$('button.w-full');
      if (movieButton) {
        await movieButton.click();
        await this.wait(500);
        
        if (movieTitle.includes('Everything Everywhere')) {
          await this.captureScene('✨ Synced everywhere all at once!', 4);
        } else {
          await this.captureScene(`${movieTitle} added`, 2);
        }
      }
    } catch (e) {
      console.log(`⚠️  Could not add ${movieTitle}`);
    }
  }

  async quickVoteDemo() {
    console.log('\n🗳️ Quick voting demo...');
    
    // Start voting
    const adminPage = this.pages[0];
    const buttons = await adminPage.$$('button');
    for (const btn of buttons) {
      const text = await adminPage.evaluate(el => el.textContent, btn);
      if (text && text.includes('Start')) {
        await btn.click();
        break;
      }
    }
    
    await this.captureScene('Voting started', 2);
    
    // Quick rankings
    for (let i = 0; i < 4; i++) {
      const page = this.pages[i];
      const movieCards = await page.$$('.movie-card');
      
      // Rank first 3 movies
      for (let j = 0; j < Math.min(3, movieCards.length); j++) {
        const rankButtons = await movieCards[j].$$('button');
        for (const btn of rankButtons) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && text.trim() === String(j + 1)) {
            await btn.click();
            break;
          }
        }
      }
    }
    
    await this.captureScene('Users ranking movies', 3);
    
    // Submit votes
    for (let i = 0; i < 4; i++) {
      const page = this.pages[i];
      const submitBtn = await page.$('button:has-text("Submit")');
      if (submitBtn) {
        await submitBtn.click();
        await this.wait(500);
      }
      
      if (i === 0) {
        await page.goto(this.roomUrl.replace('/vote', '/results'));
        await this.captureScene('First results appear', 2);
      } else {
        await this.captureScene(`Vote ${i + 1} submitted`, 2);
      }
    }
    
    // All go to results
    for (let i = 1; i < 4; i++) {
      await this.pages[i].goto(this.roomUrl.replace('/vote', '/results'));
    }
    
    await this.captureScene('Final results', 3);
    
    // Try to show IRV
    const resultsButtons = await this.pages[0].$$('button');
    for (const btn of resultsButtons) {
      const text = await this.pages[0].evaluate(el => el.textContent, btn);
      if (text && text.toLowerCase().includes('elimination')) {
        await btn.click();
        await this.captureScene('IRV rounds shown', 3);
        break;
      }
    }
  }

  async generateVideo() {
    console.log('\n🎥 Generating video...');
    
    try {
      // Count composite frames
      const files = await fs.readdir(this.frameDir);
      const composites = files.filter(f => f.startsWith('composite_')).sort();
      console.log(`Found ${composites.length} frames`);
      
      if (composites.length === 0) {
        console.error('❌ No composite frames found!');
        return;
      }
      
      const outputPath = path.join(this.outputDir, 'mobile-4user-demo.mp4');
      const cmd = `ffmpeg -y -framerate 3 -pattern_type glob -i "${this.frameDir}/composite_*.png" ` +
        `-c:v libx264 -pix_fmt yuv420p -vf "scale=1600:-2" "${outputPath}" 2>&1`;
      
      const { stdout, stderr } = await execPromise(cmd);
      console.log(`✅ Video saved: ${outputPath}`);
      
      // Create thumbnail
      const thumbnail = path.join(this.outputDir, 'thumbnail.jpg');
      await execPromise(`ffmpeg -y -i "${outputPath}" -vframes 1 -f image2 "${thumbnail}" 2>&1`);
      console.log(`✅ Thumbnail saved: ${thumbnail}`);
      
    } catch (error) {
      console.error('❌ Video generation failed:', error);
    }
  }

  async run() {
    try {
      await this.init();
      await this.setupRoom();
      await this.createUsers();
      await this.captureScene('All users joined', 3);
      
      // Add movies
      for (const movie of this.movies) {
        await this.addMovie(movie.addedBy, movie.title);
      }
      
      // Quick voting demo
      await this.quickVoteDemo();
      
      // Generate video
      await this.generateVideo();
      
      console.log('\n✅ Demo complete!');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the demo
if (require.main === module) {
  const demo = new Mobile4UserDemoFast();
  demo.run().catch(console.error);
}

module.exports = Mobile4UserDemoFast;