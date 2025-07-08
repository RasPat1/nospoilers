const puppeteer = require('puppeteer');
const path = require('path');
const { MovieNightDemoRecorder } = require('./demo-recorder');

class CompellingDemoRecorder extends MovieNightDemoRecorder {
  constructor() {
    super();
    this.outputDir = path.join(__dirname, 'compelling-demo-frames');
    this.fps = 30;
    
    // User personas for storytelling
    this.users = [
      { name: 'Alex', color: '#FF6B6B', persona: 'Action Fan', movies: ['Top Gun: Maverick', 'John Wick'] },
      { name: 'Sam', color: '#4ECDC4', persona: 'Rom-Com Lover', movies: ['The Notebook', 'La La Land'] },
      { name: 'Jordan', color: '#45B7D1', persona: 'Sci-Fi Geek', movies: ['Interstellar', 'Dune'] },
      { name: 'Casey', color: '#96CEB4', persona: 'Casual Viewer', movies: ['The Grand Budapest Hotel'] }
    ];
  }

  async run() {
    console.log('🎬 Starting Compelling NoSpoilers Demo...');
    
    try {
      // Launch browser
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      // Run all scenes
      await this.scene1_problem();
      await this.scene2_solution();
      await this.scene3_collaboration();
      await this.scene4_voting();
      await this.scene5_results();

      // Generate video
      await this.generateVideo('nospoilers_compelling_demo.mp4');
      
      // Generate shorter versions
      await this.generate30SecondVersion();
      await this.generate60SecondVersion();
      
    } catch (error) {
      console.error('Demo failed:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async scene1_problem() {
    console.log('📱 Scene 1: The Problem - Group Chat Chaos');
    
    // Create a mock chat interface to show the problem
    const page = await this.browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Create HTML for chat simulation
    await page.setContent(`
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #f0f0f0;
              margin: 0;
              padding: 20px;
            }
            .chat-container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 20px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              padding: 20px;
            }
            .chat-header {
              text-align: center;
              padding: 10px;
              border-bottom: 1px solid #eee;
              margin-bottom: 20px;
            }
            .message {
              margin: 10px 0;
              padding: 10px 15px;
              border-radius: 18px;
              max-width: 70%;
              animation: slideIn 0.3s ease-out;
            }
            .message.left {
              background: #e9e9eb;
              margin-right: auto;
            }
            .message.right {
              background: #007aff;
              color: white;
              margin-left: auto;
              text-align: right;
            }
            .sender {
              font-size: 12px;
              opacity: 0.7;
              margin-bottom: 4px;
            }
            @keyframes slideIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          </style>
        </head>
        <body>
          <div class="chat-container">
            <div class="chat-header">
              <h2>🎬 Movie Night Planning</h2>
            </div>
            <div id="messages"></div>
          </div>
        </body>
      </html>
    `);

    // Animate chat messages
    const messages = [
      { sender: 'Alex', text: 'How about an action movie?', side: 'left', delay: 500 },
      { sender: 'Sam', text: 'No way! Let\'s watch a romance!', side: 'right', delay: 1000 },
      { sender: 'Jordan', text: 'Sci-fi is clearly the best choice 🚀', side: 'left', delay: 1500 },
      { sender: 'Casey', text: 'Can we just pick something already?', side: 'right', delay: 2000 },
      { sender: 'Alex', text: 'Top Gun: Maverick?', side: 'left', delay: 2500 },
      { sender: 'Sam', text: 'The Notebook is a classic!', side: 'right', delay: 3000 },
      { sender: 'Jordan', text: 'Interstellar > everything else', side: 'left', delay: 3500 },
      { sender: 'Casey', text: '😫 This is impossible...', side: 'right', delay: 4000 }
    ];

    // Add messages progressively
    for (const msg of messages) {
      await page.evaluate((message) => {
        setTimeout(() => {
          const container = document.getElementById('messages');
          const msgEl = document.createElement('div');
          msgEl.className = `message ${message.side}`;
          msgEl.innerHTML = `<div class="sender">${message.sender}</div>${message.text}`;
          container.appendChild(msgEl);
          container.scrollTop = container.scrollHeight;
        }, message.delay);
      }, msg);
    }

    // Add annotation
    await this.addAnnotation(page, 'The eternal struggle: picking a movie everyone likes', 100, 100);
    
    // Capture frames
    await this.captureFrames(page, 5000); // 5 seconds
    await page.close();
  }

  async scene2_solution() {
    console.log('💡 Scene 2: Discovering NoSpoilers');
    
    const page = await this.browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Show NoSpoilers homepage
    await page.goto(`http://localhost:8080`);
    await page.waitForSelector('.hero-section', { timeout: 5000 });
    
    // Add annotation
    await this.addAnnotation(page, 'One link. No signup. Fair decisions.', 960, 200);
    
    // Highlight the "Create Movie Night" button
    await page.evaluate(() => {
      const button = document.querySelector('button');
      if (button) {
        button.style.transform = 'scale(1.1)';
        button.style.boxShadow = '0 0 30px rgba(255, 107, 107, 0.5)';
      }
    });
    
    await this.captureFrames(page, 2000);
    
    // Click create button
    await this.clickWithVisual(page, 'button:has-text("Create")', 960, 540);
    await page.waitForNavigation();
    
    // Show the share link
    await this.addAnnotation(page, 'Share this link with friends', 960, 300);
    await this.captureFrames(page, 2000);
    
    this.roomUrl = page.url();
    await page.close();
  }

  async scene3_collaboration() {
    console.log('🤝 Scene 3: Real-time Collaboration');
    
    // Create 4 browser contexts for 4 users
    const contexts = await Promise.all(
      Array(4).fill(null).map(() => this.browser.createIncognitoBrowserContext())
    );
    
    const pages = await Promise.all(
      contexts.map(async (context, index) => {
        const page = await context.newPage();
        await page.setViewport({ width: 960, height: 540 }); // Smaller for grid
        await page.goto(this.roomUrl);
        await page.waitForSelector('.movie-search-container', { timeout: 5000 });
        
        // Set user name
        const user = this.users[index];
        await page.evaluate((name) => {
          const input = document.querySelector('input[placeholder*="Your name"]');
          if (input) {
            input.value = name;
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }, user.name);
        
        return { page, user, context };
      })
    );
    
    // Create composite view
    await this.createCompositeView(pages.map(p => p.page), '2x2');
    
    // Add annotation to composite
    await this.addAnnotationToComposite('Everyone joins instantly - no barriers', 960, 50);
    await this.captureCompositeFrames(2000);
    
    // Each user searches for and adds movies
    for (let i = 0; i < pages.length; i++) {
      const { page, user } = pages[i];
      
      // Search for first movie
      await this.slowType(page, 'input[placeholder*="Search"]', user.movies[0]);
      await page.waitForSelector('.search-results', { timeout: 5000 });
      
      // Add movie
      await page.click('.search-results .movie-item:first-child button');
      
      // Capture the real-time sync
      await this.captureCompositeFrames(1000);
    }
    
    // Add final annotation
    await this.addAnnotationToComposite('Movies appear instantly for everyone!', 960, 1000);
    await this.captureCompositeFrames(2000);
    
    // Cleanup
    for (const { context } of pages) {
      await context.close();
    }
  }

  async scene4_voting() {
    console.log('🗳️ Scene 4: Smart Ranked Choice Voting');
    
    // Continue with existing contexts or create new ones
    const contexts = await Promise.all(
      Array(4).fill(null).map(() => this.browser.createIncognitoBrowserContext())
    );
    
    const pages = await Promise.all(
      contexts.map(async (context, index) => {
        const page = await context.newPage();
        await page.setViewport({ width: 960, height: 540 });
        await page.goto(this.roomUrl);
        await page.waitForSelector('.vote-button', { timeout: 5000 });
        return { page, user: this.users[index], context };
      })
    );
    
    // Start voting
    const admin = pages[0];
    await admin.page.click('.admin-panel button:has-text("Start Voting")');
    
    // Create composite view for voting
    await this.createCompositeView(pages.map(p => p.page), '2x2');
    await this.addAnnotationToComposite('Ranked Choice: Vote for your top 3 movies', 960, 50);
    
    // Simulate realistic voting patterns
    const votingPatterns = [
      [0, 2, 3], // Alex: Action first, then compromises
      [1, 3, 0], // Sam: Romance first, then compromises  
      [2, 0, 1], // Jordan: Sci-fi first, mixed second
      [3, 1, 2], // Casey: Unique choice, then variety
    ];
    
    for (let i = 0; i < pages.length; i++) {
      const { page } = pages[i];
      const pattern = votingPatterns[i];
      
      // Cast votes in order
      for (let rank of pattern) {
        await page.click(`.movie-item:nth-child(${rank + 1}) .rank-button:nth-child(${pattern.indexOf(rank) + 1})`);
        await this.captureCompositeFrames(500);
      }
      
      // Submit vote
      await page.click('button:has-text("Submit Vote")');
      await this.captureCompositeFrames(1000);
    }
    
    // Cleanup
    for (const { context } of pages) {
      await context.close();
    }
  }

  async scene5_results() {
    console.log('🏆 Scene 5: Fair Results with IRV');
    
    const page = await this.browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(`${this.roomUrl}/results`);
    await page.waitForSelector('.results-container', { timeout: 5000 });
    
    // Show initial results
    await this.addAnnotation(page, 'No clear majority? IRV finds consensus!', 960, 100);
    await this.captureFrames(page, 2000);
    
    // Highlight elimination rounds if visible
    const hasElimination = await page.$('.elimination-round');
    if (hasElimination) {
      await this.addAnnotation(page, 'Instant Runoff: Eliminating lowest choices', 960, 400);
      await this.captureFrames(page, 2000);
    }
    
    // Show final winner
    await page.evaluate(() => {
      const winner = document.querySelector('.winner-card');
      if (winner) {
        winner.style.transform = 'scale(1.05)';
        winner.style.boxShadow = '0 0 40px rgba(255, 215, 0, 0.5)';
      }
    });
    
    await this.addAnnotation(page, 'A winner everyone can enjoy! 🎉', 960, 300);
    await this.captureFrames(page, 3000);
    
    // End screen with call to action
    await page.setContent(`
      <html>
        <head>
          <style>
            body {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              text-align: center;
            }
            .end-screen {
              animation: fadeIn 1s ease-out;
            }
            h1 { font-size: 48px; margin-bottom: 20px; }
            p { font-size: 24px; margin-bottom: 40px; opacity: 0.9; }
            .cta {
              font-size: 20px;
              padding: 15px 40px;
              background: white;
              color: #667eea;
              border: none;
              border-radius: 50px;
              font-weight: bold;
              cursor: pointer;
              text-decoration: none;
              display: inline-block;
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          </style>
        </head>
        <body>
          <div class="end-screen">
            <h1>NoSpoilers</h1>
            <p>Fair movie nights, finally.</p>
            <a href="http://localhost:8080" class="cta">Try it now →</a>
          </div>
        </body>
      </html>
    `);
    
    await this.captureFrames(page, 2000);
    await page.close();
  }

  async generate30SecondVersion() {
    console.log('✂️ Generating 30-second version...');
    // Use FFmpeg to create a sped-up 30-second version
    await this.generateVideo('nospoilers_compelling_demo_30s.mp4', { 
      duration: 30,
      speedUp: true 
    });
  }

  async generate60SecondVersion() {
    console.log('✂️ Generating 60-second version...');
    // Use FFmpeg to create a 60-second version with key scenes
    await this.generateVideo('nospoilers_compelling_demo_60s.mp4', { 
      duration: 60,
      selectedScenes: [1, 3, 4, 5] // Skip solution scene for brevity
    });
  }
}

// Run the demo
if (require.main === module) {
  const demo = new CompellingDemoRecorder();
  demo.run().catch(console.error);
}

module.exports = { CompellingDemoRecorder };