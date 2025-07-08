const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class EfficientMobileDemo {
  constructor() {
    this.browser = null;
    this.frameDir = path.join(__dirname, '..', 'frames');
    this.outputDir = path.join(__dirname, '..', 'output');
    this.frameIndex = 0;
    this.appUrl = process.env.APP_URL || 'http://localhost:8080';
    this.pages = [];
    
    this.users = [
      { name: 'Art House', emoji: '🎭', color: '#FF6B6B' },
      { name: 'Rom-Com Fan', emoji: '💕', color: '#4ECDC4' },
      { name: 'Sci-Fi Nerd', emoji: '🚀', color: '#45B7D1' },
      { name: 'Indie Buff', emoji: '🎬', color: '#96CEB4' }
    ];
    
    this.movies = [
      'Everything Everywhere All at Once',
      'The Lobster',
      'Swiss Army Man',
      'Under the Skin'
    ];
  }

  async init() {
    console.log('🎬 Efficient Mobile Demo Starting...\n');
    
    await fs.mkdir(this.frameDir, { recursive: true });
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Clean up
    try {
      const files = await fs.readdir(this.frameDir);
      for (const file of files) {
        if (file.endsWith('.png')) {
          await fs.unlink(path.join(this.frameDir, file));
        }
      }
    } catch (e) {}

    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 400, height: 800 }
    });
    
    console.log('✅ Browser launched');
  }

  async captureComposite(label) {
    console.log(`📸 ${label}`);
    
    const screenshots = await Promise.allSettled(
      this.pages.map(page => page.screenshot({ timeout: 5000 }))
    );
    
    const validScreenshots = [];
    for (let i = 0; i < screenshots.length; i++) {
      if (screenshots[i].status === 'fulfilled' && screenshots[i].value) {
        const filename = `temp_${i}.png`;
        await fs.writeFile(path.join(this.frameDir, filename), screenshots[i].value);
        validScreenshots.push(filename);
      }
    }
    
    if (validScreenshots.length === 4) {
      const outputFile = path.join(this.frameDir, `scene_${String(this.frameIndex++).padStart(3, '0')}_${label.replace(/\s+/g, '_')}.png`);
      const inputs = validScreenshots.map((f, i) => `-i "${path.join(this.frameDir, f)}"`).join(' ');
      const cmd = `ffmpeg -y ${inputs} -filter_complex "[0:v][1:v][2:v][3:v]hstack=inputs=4:shortest=1" "${outputFile}" 2>/dev/null`;
      
      try {
        await execPromise(cmd);
        // Clean temp files
        for (const f of validScreenshots) {
          await fs.unlink(path.join(this.frameDir, f));
        }
      } catch (e) {
        console.error('Failed to create composite');
      }
    }
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async setupRoom() {
    // Clear data
    try {
      await fetch(`${this.appUrl}/api/votes/clear`, { method: 'POST' });
    } catch (e) {}
    
    const page = await this.browser.newPage();
    await page.goto(this.appUrl);
    await this.wait(2000);
    
    const button = await page.$('button');
    if (button) {
      await button.click();
      await this.wait(2000);
      this.roomUrl = page.url();
      console.log(`✅ Room: ${this.roomUrl}`);
    }
    await page.close();
  }

  async createUsers() {
    for (let i = 0; i < 4; i++) {
      const page = await this.browser.newPage();
      await page.goto(this.roomUrl);
      await this.wait(2000);
      
      // Add user badge
      await page.evaluate((user) => {
        const badge = document.createElement('div');
        badge.innerHTML = `${user.emoji} ${user.name}`;
        badge.style.cssText = `
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
        document.body.appendChild(badge);
      }, this.users[i]);
      
      this.pages.push(page);
      console.log(`✅ ${this.users[i].emoji} joined`);
    }
  }

  async addMovieQuick(userIndex, movieTitle) {
    const page = this.pages[userIndex];
    const user = this.users[userIndex];
    
    console.log(`🎬 ${user.emoji} adding "${movieTitle}"`);
    
    try {
      // Type movie name
      await page.click('input[placeholder="Search for a movie..."]');
      await page.keyboard.type(movieTitle);
      await this.wait(2000);
      
      // Click first result
      const buttons = await page.$$('button.w-full');
      if (buttons[0]) {
        await buttons[0].click();
        
        // Special effect for "Everything Everywhere"
        if (movieTitle.includes('Everything Everywhere')) {
          for (const p of this.pages) {
            await p.evaluate(() => {
              const msg = document.createElement('div');
              msg.textContent = '✨ Synced everywhere all at once! ✨';
              msg.style.cssText = `
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
                animation: fadeOut 3s forwards;
              `;
              document.body.appendChild(msg);
              
              const style = document.createElement('style');
              style.textContent = '@keyframes fadeOut { 0% { opacity: 1; } 100% { opacity: 0; } }';
              document.head.appendChild(style);
              
              setTimeout(() => msg.remove(), 3000);
            });
          }
        }
        
        await this.wait(1000);
      }
    } catch (e) {
      console.log(`⚠️  Failed to add ${movieTitle}`);
    }
  }

  async rankAndVote(userIndex, rankings) {
    const page = this.pages[userIndex];
    const user = this.users[userIndex];
    
    try {
      // Rank movies
      const cards = await page.$$('.movie-card');
      for (let i = 0; i < Math.min(rankings.length, cards.length); i++) {
        const buttons = await cards[rankings[i]].$$('button');
        for (const btn of buttons) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && text.trim() === String(i + 1)) {
            await btn.click();
            await this.wait(200);
            break;
          }
        }
      }
      
      // Submit
      const submitBtns = await page.$$('button');
      for (const btn of submitBtns) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Submit')) {
          await btn.click();
          console.log(`✅ ${user.emoji} voted`);
          break;
        }
      }
    } catch (e) {
      console.log(`⚠️  ${user.emoji} voting failed`);
    }
  }

  async run() {
    try {
      await this.init();
      
      // Setup
      await this.setupRoom();
      await this.createUsers();
      await this.wait(1000);
      await this.captureComposite('all_users_joined');
      
      // Add movies
      await this.addMovieQuick(0, this.movies[0]);
      await this.captureComposite('everything_everywhere_synced');
      
      await this.addMovieQuick(1, this.movies[1]);
      await this.captureComposite('the_lobster_added');
      
      await this.addMovieQuick(2, this.movies[2]);
      await this.captureComposite('swiss_army_man_added');
      
      await this.addMovieQuick(3, this.movies[3]);
      await this.captureComposite('all_movies_added');
      
      // Start voting
      const adminBtns = await this.pages[0].$$('button');
      for (const btn of adminBtns) {
        const text = await this.pages[0].evaluate(el => el.textContent, btn);
        if (text && text.includes('Start')) {
          await btn.click();
          console.log('✅ Voting started');
          break;
        }
      }
      await this.wait(1000);
      await this.captureComposite('voting_started');
      
      // Vote
      await this.rankAndVote(0, [0, 2, 1]);
      await this.captureComposite('art_house_voted');
      
      await this.rankAndVote(1, [1, 0, 3]);
      await this.captureComposite('rom_com_voted');
      
      await this.rankAndVote(2, [2, 3, 0]);
      await this.captureComposite('sci_fi_voted');
      
      await this.rankAndVote(3, [3, 1, 2]);
      await this.captureComposite('all_voted');
      
      // Results
      for (const page of this.pages) {
        await page.goto(this.roomUrl.replace('/vote', '/results'));
      }
      await this.wait(2000);
      await this.captureComposite('final_results');
      
      // Try to show IRV
      try {
        const buttons = await this.pages[0].$$('button');
        for (const btn of buttons) {
          const text = await this.pages[0].evaluate(el => el.textContent, btn);
          if (text && text.toLowerCase().includes('elimination')) {
            await btn.click();
            await this.wait(1000);
            await this.captureComposite('irv_rounds_shown');
            break;
          }
        }
      } catch (e) {}
      
      // Generate video
      await this.generateVideo();
      
      console.log('\n✅ Demo complete!');
      
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      if (this.browser) await this.browser.close();
    }
  }

  async generateVideo() {
    console.log('\n🎥 Generating video...');
    
    try {
      const files = await fs.readdir(this.frameDir);
      const scenes = files.filter(f => f.startsWith('scene_')).sort();
      
      if (scenes.length === 0) {
        console.log('❌ No scenes found');
        return;
      }
      
      // Create concat file for variable duration per scene
      let concatContent = '';
      const durations = {
        'all_users_joined': 3,
        'everything_everywhere_synced': 4,
        'the_lobster_added': 2,
        'swiss_army_man_added': 2,
        'all_movies_added': 3,
        'voting_started': 2,
        'art_house_voted': 2,
        'rom_com_voted': 2,
        'sci_fi_voted': 2,
        'all_voted': 3,
        'final_results': 4,
        'irv_rounds_shown': 5
      };
      
      for (const scene of scenes) {
        const sceneName = scene.match(/scene_\d+_(.+)\.png/)?.[1] || '';
        const duration = durations[sceneName] || 2;
        concatContent += `file '${path.join(this.frameDir, scene)}'\nduration ${duration}\n`;
      }
      // Add last frame
      if (scenes.length > 0) {
        concatContent += `file '${path.join(this.frameDir, scenes[scenes.length - 1])}'`;
      }
      
      const concatFile = path.join(this.frameDir, 'concat.txt');
      await fs.writeFile(concatFile, concatContent);
      
      // Generate main video
      const outputPath = path.join(this.outputDir, 'mobile-4user-demo.mp4');
      const cmd = `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -vf "scale=1600:-2,fps=30" -c:v libx264 -pix_fmt yuv420p "${outputPath}"`;
      
      await execPromise(cmd);
      console.log(`✅ Video: ${outputPath}`);
      
      // Create versions
      await execPromise(`ffmpeg -y -i "${outputPath}" -t 60 -c copy "${path.join(this.outputDir, 'mobile-4user-demo-60s.mp4')}"`);
      await execPromise(`ffmpeg -y -i "${outputPath}" -t 30 -c copy "${path.join(this.outputDir, 'mobile-4user-demo-30s.mp4')}"`);
      
      // Thumbnail
      await execPromise(`ffmpeg -y -i "${outputPath}" -vf "select=eq(n\\,60)" -vframes 1 "${path.join(this.outputDir, 'mobile-4user-demo-thumbnail.jpg')}"`);
      
      console.log('✅ All versions created');
      
    } catch (error) {
      console.error('Video generation failed:', error);
    }
  }
}

// Run
if (require.main === module) {
  const demo = new EfficientMobileDemo();
  demo.run().catch(console.error);
}

module.exports = EfficientMobileDemo;