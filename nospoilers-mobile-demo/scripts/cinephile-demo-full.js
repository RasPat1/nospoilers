const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class CinephileDemo {
  constructor() {
    this.browser = null;
    this.pages = [];
    this.frameDir = path.join(__dirname, '..', 'frames');
    this.outputDir = path.join(__dirname, '..', 'output');
    this.frameIndex = 0;
    this.appUrl = 'http://localhost:8080';
    
    this.users = [
      { name: 'Art House', emoji: '🎭', endEmoji: '🎨', color: '#FF6B6B' },
      { name: 'Rom-Com Fan', emoji: '💕', endEmoji: '💖', color: '#4ECDC4' },
      { name: 'Sci-Fi Nerd', emoji: '🚀', endEmoji: '👽', color: '#45B7D1' },
      { name: 'Indie Buff', emoji: '🎬', endEmoji: '🎞️', color: '#96CEB4' }
    ];
    
    this.movies = [
      { title: 'Everything Everywhere All at Once', addedBy: 0 },
      { title: 'The Lobster', addedBy: 1 },
      { title: 'Swiss Army Man', addedBy: 2 },
      { title: 'Under the Skin', addedBy: 3 },
      { title: 'Coherence', addedBy: 0 },
      { title: 'The Man from Earth', addedBy: 1 }
    ];
  }

  async init() {
    console.log('🎬 Cinephile Demo - Full Feature Showcase\n');
    
    await fs.mkdir(this.frameDir, { recursive: true });
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Clean frames
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
    
    // Create label page for bottom bar
    this.labelPage = await this.browser.newPage();
    await this.labelPage.setViewport({ width: 1600, height: 100 });
    
    const labelHtml = `
      <html>
        <body style="margin: 0; background: #1a1a1a; display: flex; height: 100vh;">
          ${this.users.map((user, i) => `
            <div style="
              width: 400px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: ${user.color};
              color: white;
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
              font-size: 24px;
              font-weight: bold;
            ">
              ${user.emoji} ${user.name} ${user.endEmoji}
            </div>
          `).join('')}
        </body>
      </html>
    `;
    
    await this.labelPage.setContent(labelHtml);
    console.log('✅ Browser and label bar ready');
  }

  async captureScene(sceneName, description) {
    console.log(`\n📸 Scene ${this.frameIndex + 1}: ${sceneName}`);
    if (description) console.log(`   ${description}`);
    
    // Take screenshots of all 4 phones
    const screenshots = [];
    for (let i = 0; i < this.pages.length; i++) {
      try {
        const screenshot = await this.pages[i].screenshot();
        const filename = `temp_${i}.png`;
        await fs.writeFile(path.join(this.frameDir, filename), screenshot);
        screenshots.push(filename);
      } catch (e) {
        console.error(`Failed to capture user ${i}`);
      }
    }
    
    if (screenshots.length === 4) {
      // Combine phones horizontally
      const phonesFile = path.join(this.frameDir, 'temp_phones.png');
      const inputs = screenshots.map(f => `-i "${path.join(this.frameDir, f)}"`).join(' ');
      await execPromise(`ffmpeg -y ${inputs} -filter_complex "[0:v][1:v][2:v][3:v]hstack=inputs=4:shortest=1" "${phonesFile}" 2>/dev/null`);
      
      // Capture label bar
      const labelFile = path.join(this.frameDir, 'temp_labels.png');
      await this.labelPage.screenshot({ path: labelFile });
      
      // Stack phones and labels vertically
      const outputFile = path.join(this.frameDir, `scene_${String(this.frameIndex).padStart(3, '0')}_${sceneName.replace(/\s+/g, '_')}.png`);
      await execPromise(`ffmpeg -y -i "${phonesFile}" -i "${labelFile}" -filter_complex "[0:v][1:v]vstack=inputs=2" "${outputFile}" 2>/dev/null`);
      
      // Clean temp files
      for (const file of screenshots) {
        await fs.unlink(path.join(this.frameDir, file));
      }
      await fs.unlink(phonesFile);
      await fs.unlink(labelFile);
      
      this.frameIndex++;
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
    
    const setupPage = await this.browser.newPage();
    await setupPage.goto(this.appUrl);
    await this.wait(2000);
    
    const button = await setupPage.$('button');
    if (button) {
      await button.click();
      await this.wait(2000);
      this.roomUrl = setupPage.url();
      console.log(`✅ Room created: ${this.roomUrl}`);
    }
    await setupPage.close();
  }

  async createUsers() {
    console.log('\n👥 Users joining...');
    
    for (let i = 0; i < 4; i++) {
      const page = await this.browser.newPage();
      await page.goto(this.roomUrl);
      await this.wait(2000);
      this.pages.push(page);
      console.log(`✅ ${this.users[i].emoji} ${this.users[i].name} joined`);
    }
  }

  async addMovie(userIndex, movieTitle) {
    const page = this.pages[userIndex];
    const user = this.users[userIndex];
    
    console.log(`\n🎬 ${user.emoji} ${user.name} adding "${movieTitle}"`);
    
    try {
      await page.click('input[placeholder="Search for a movie..."]');
      await page.keyboard.type(movieTitle);
      
      // Special case for "Everything Everywhere"
      if (movieTitle.includes('Everything Everywhere')) {
        await this.wait(1500);
        await this.captureScene('searching_everything_everywhere', 
          'Art House types the perfect movie title...');
      }
      
      await this.wait(2000);
      
      // Click first result
      const buttons = await page.$$('button.w-full');
      if (buttons[0]) {
        await buttons[0].click();
        await this.wait(1000);
        
        // Special effect for "Everything Everywhere"
        if (movieTitle.includes('Everything Everywhere')) {
          // Add visual indicator on all screens
          for (const p of this.pages) {
            await p.evaluate(() => {
              const msg = document.createElement('div');
              msg.textContent = '✨ Movie synced everywhere all at once! ✨';
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
                animation: pulse 3s ease-in-out;
              `;
              document.body.appendChild(msg);
              
              const style = document.createElement('style');
              style.textContent = `
                @keyframes pulse {
                  0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
                  50% { opacity: 0.9; transform: translateX(-50%) scale(1.05); }
                }
              `;
              document.head.appendChild(style);
              
              setTimeout(() => msg.remove(), 3000);
            });
          }
          
          await this.captureScene('everything_everywhere_synced', 
            '✨ The movie appears on all screens instantly!');
          await this.wait(2000);
          
          // Remove the message
          for (const p of this.pages) {
            await p.evaluate(() => {
              const msgs = document.querySelectorAll('div[style*="pulse"]');
              msgs.forEach(m => m.remove());
            });
          }
        }
      }
    } catch (e) {
      console.log(`⚠️  Failed to add ${movieTitle}`);
    }
  }

  async startVoting() {
    console.log('\n🗳️ Starting voting phase...');
    
    // Art House (admin) starts voting
    const adminPage = this.pages[0];
    const buttons = await adminPage.$$('button');
    
    for (const btn of buttons) {
      const text = await adminPage.evaluate(el => el.textContent, btn);
      if (text && text.includes('Start')) {
        await btn.click();
        console.log('✅ Art House started the voting');
        break;
      }
    }
    
    await this.wait(2000);
  }

  async rankMovies(userIndex, rankings, isChangingMind = false) {
    const page = this.pages[userIndex];
    const user = this.users[userIndex];
    
    if (isChangingMind) {
      console.log(`\n🤔 ${user.emoji} ${user.name} is reconsidering...`);
      
      // Clear existing rankings
      const clearButton = await page.$('button:has-text("Clear")');
      if (clearButton) {
        await clearButton.click();
        await this.wait(500);
      }
    }
    
    console.log(`${user.emoji} ranking movies...`);
    
    const movieCards = await page.$$('.movie-card');
    
    for (let i = 0; i < Math.min(rankings.length, movieCards.length); i++) {
      const movieIndex = rankings[i];
      if (movieIndex < movieCards.length) {
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
  }

  async submitVote(userIndex) {
    const page = this.pages[userIndex];
    const user = this.users[userIndex];
    
    console.log(`\n✅ ${user.emoji} ${user.name} submitting vote...`);
    
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Submit')) {
        await btn.click();
        await this.wait(1000);
        
        // First voter goes to results
        if (userIndex === 0) {
          await page.goto(this.roomUrl.replace('/vote', '/results'));
          await this.wait(2000);
        }
        break;
      }
    }
  }

  async showIRVRounds() {
    console.log('\n📊 Demonstrating Instant Runoff Voting...');
    
    // All users go to results
    for (let i = 0; i < this.pages.length; i++) {
      if (i > 0) {
        await this.pages[i].goto(this.roomUrl.replace('/vote', '/results'));
      }
    }
    await this.wait(2000);
    
    // Art House expands IRV rounds
    const artHousePage = this.pages[0];
    const buttons = await artHousePage.$$('button');
    
    for (const btn of buttons) {
      const text = await artHousePage.evaluate(el => el.textContent, btn);
      if (text && text.toLowerCase().includes('elimination')) {
        await btn.click();
        console.log('✅ Expanded IRV elimination rounds');
        
        // Add explanation overlay on Art House's screen
        await artHousePage.evaluate(() => {
          const overlay = document.createElement('div');
          overlay.innerHTML = `
            <div style="font-size: 20px; margin-bottom: 15px; font-weight: bold;">
              🗳️ Ranked Choice Voting Explained
            </div>
            <div style="font-size: 16px; line-height: 1.5;">
              1. No movie has >50% first-choice votes<br>
              2. Eliminate the movie with fewest votes<br>
              3. Those voters' 2nd choices count instead<br>
              4. Repeat until one movie has majority!
            </div>
          `;
          overlay.style.cssText = `
            position: fixed;
            top: 150px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 25px 35px;
            border-radius: 15px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            max-width: 350px;
            z-index: 10001;
            box-shadow: 0 4px 30px rgba(0,0,0,0.5);
            border: 2px solid rgba(255,255,255,0.1);
          `;
          document.body.appendChild(overlay);
          
          setTimeout(() => overlay.remove(), 5000);
        });
        
        break;
      }
    }
  }

  async run() {
    try {
      await this.init();
      
      // Scene 1: Setup and join
      await this.setupRoom();
      await this.createUsers();
      await this.captureScene('all_users_joined', 
        '4 cinephile friends ready to pick a movie');
      
      // Scene 2: Adding movies with WebSocket sync
      await this.addMovie(0, this.movies[0].title); // Everything Everywhere
      
      await this.addMovie(1, this.movies[1].title); // The Lobster
      await this.captureScene('rom_com_adds_lobster', 
        'Rom-Com Fan adds an unconventional romance');
      
      await this.addMovie(2, this.movies[2].title); // Swiss Army Man
      await this.captureScene('sci_fi_adds_swiss_army', 
        'Sci-Fi Nerd picks a weird one');
      
      await this.addMovie(3, this.movies[3].title); // Under the Skin
      await this.captureScene('indie_adds_under_skin', 
        'Indie Buff goes atmospheric');
      
      await this.addMovie(0, this.movies[4].title); // Coherence
      await this.addMovie(1, this.movies[5].title); // The Man from Earth
      await this.captureScene('all_movies_added', 
        '6 fringe films ready for ranking');
      
      // Scene 3: Start voting
      await this.startVoting();
      await this.captureScene('voting_started', 
        'Time to rank your favorites!');
      
      // Scene 4: Users ranking movies
      await this.rankMovies(0, [0, 4, 2]); // Art House
      await this.captureScene('art_house_ranks', 
        'Art House makes their picks');
      
      await this.rankMovies(1, [1, 0, 5]); // Rom-Com Fan
      await this.rankMovies(2, [2, 3, 0]); // Sci-Fi Nerd
      await this.rankMovies(3, [3, 1, 4]); // Indie Buff
      await this.captureScene('all_ranked', 
        'Everyone has their preferences');
      
      // Scene 5: Someone changes their mind
      await this.rankMovies(1, [0, 1, 3], true); // Rom-Com changes mind
      await this.captureScene('rom_com_changes_mind', 
        'Rom-Com Fan reconsiders after seeing Everything Everywhere');
      
      // Scene 6: Staggered voting submissions
      await this.submitVote(0); // Art House submits first
      await this.captureScene('art_house_watches_results', 
        'Art House submitted - watching live results');
      
      await this.submitVote(1); // Rom-Com submits
      await this.captureScene('vote_count_updates_1', 
        'Vote count updates in real-time!');
      
      await this.submitVote(2); // Sci-Fi submits
      await this.captureScene('vote_count_updates_2', 
        'More votes coming in...');
      
      await this.submitVote(3); // Indie submits last
      await this.captureScene('all_votes_submitted', 
        'All votes are in!');
      
      // Scene 7: Show IRV rounds
      await this.showIRVRounds();
      await this.captureScene('irv_explanation', 
        'Art House explains how ranked choice works');
      
      await this.wait(5000); // Let explanation show
      await this.captureScene('irv_rounds_visible', 
        'See how the winner emerges through elimination');
      
      await this.captureScene('final_winner', 
        'A movie wins with true majority support!');
      
      console.log('\n✅ Demo scenes captured successfully!');
      console.log(`📁 ${this.frameIndex} scenes saved in ${this.frameDir}`);
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  // Method to show sample stills without running full demo
  async showSampleStills() {
    console.log('\n📸 Sample stills from the demo:\n');
    
    const keyScenes = [
      'scene_001_all_users_joined.png',
      'scene_003_everything_everywhere_synced.png',
      'scene_008_all_movies_added.png',
      'scene_011_all_ranked.png',
      'scene_013_rom_com_changes_mind.png',
      'scene_015_vote_count_updates_1.png',
      'scene_019_irv_explanation.png',
      'scene_021_final_winner.png'
    ];
    
    console.log('Key scenes that would be captured:');
    keyScenes.forEach((scene, i) => {
      console.log(`${i + 1}. ${scene}`);
    });
  }
}

// Run the demo
if (require.main === module) {
  const demo = new CinephileDemo();
  
  // Just show what scenes would be captured
  demo.showSampleStills();
  
  console.log('\n💡 To run the full demo and capture all scenes:');
  console.log('   Uncomment the demo.run() line below');
  
  // Uncomment to actually run the demo:
  // demo.run().catch(console.error);
}

module.exports = CinephileDemo;