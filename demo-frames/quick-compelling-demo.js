const { MovieNightDemoRecorder } = require('./demo-recorder');

class QuickCompellingDemo extends MovieNightDemoRecorder {
  constructor() {
    super({
      appUrl: 'http://localhost:8080',
      headless: true,
      screenshotDir: './quick-demo-frames',
      outputVideo: 'nospoilers_quick_compelling_demo.mp4'
    });
  }

  async run() {
    try {
      await this.init();
      
      // Create main user
      const mainPage = await this.createUser('Alex');
      
      // Scene 1: Landing page
      console.log('🎬 Scene 1: Landing Page');
      await mainPage.goto(this.config.appUrl);
      await mainPage.waitForSelector('h1');
      await this.captureScene('landing_page', { duration: 2000, user: 'Alex' });
      
      // Create a movie night
      const createButton = await mainPage.$('button');
      if (createButton) {
        await createButton.click();
        await mainPage.waitForNavigation();
      }
      
      const roomUrl = mainPage.url();
      console.log('📍 Room URL:', roomUrl);
      
      // Scene 2: Add movies
      console.log('🎬 Scene 2: Adding Movies');
      await mainPage.waitForSelector('input[placeholder*="Search"]', { timeout: 5000 });
      
      // Add a movie
      await this.slowType(mainPage, 'input[placeholder*="Search"]', 'Top Gun Maverick');
      await mainPage.waitForSelector('.search-results', { timeout: 5000 });
      await this.captureScene('search_results', { duration: 1000, user: 'Alex' });
      
      const addButton = await mainPage.$('.search-results button');
      if (addButton) {
        await addButton.click();
        await this.wait(500);
      }
      
      // Scene 3: Multi-user collaboration
      console.log('🎬 Scene 3: Multi-user Collaboration');
      
      // Create additional users
      const samPage = await this.createUser('Sam');
      const jordanPage = await this.createUser('Jordan');
      
      await samPage.goto(roomUrl);
      await jordanPage.goto(roomUrl);
      
      // Each user adds a movie
      await this.slowType(samPage, 'input[placeholder*="Search"]', 'The Notebook');
      await samPage.waitForSelector('.search-results');
      const samAddButton = await samPage.$('.search-results button');
      if (samAddButton) await samAddButton.click();
      
      await this.slowType(jordanPage, 'input[placeholder*="Search"]', 'Interstellar');
      await jordanPage.waitForSelector('.search-results');
      const jordanAddButton = await jordanPage.$('.search-results button');
      if (jordanAddButton) await jordanAddButton.click();
      
      await this.captureScene('multiple_movies_added', { duration: 2000, user: 'Alex' });
      
      // Scene 4: Voting
      console.log('🎬 Scene 4: Voting');
      
      // Start voting (admin action)
      const adminButton = await mainPage.$('.admin-controls button');
      if (adminButton) {
        await adminButton.click();
        await this.wait(1000);
      }
      
      // Vote on movies
      const voteButtons = await mainPage.$$('.vote-button, .rank-button');
      for (let i = 0; i < Math.min(3, voteButtons.length); i++) {
        await voteButtons[i].click();
        await this.wait(300);
      }
      
      await this.captureScene('voting_interface', { duration: 2000, user: 'Alex' });
      
      // Scene 5: Results
      console.log('🎬 Scene 5: Results');
      await mainPage.goto(roomUrl + '/results');
      await mainPage.waitForSelector('.results-container, .winner, body');
      await this.captureScene('results_page', { duration: 3000, user: 'Alex' });
      
      // Generate video
      await this.generateVideo();
      
      console.log('✅ Demo completed successfully!');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run demo if called directly
if (require.main === module) {
  const demo = new QuickCompellingDemo();
  demo.run();
}

module.exports = QuickCompellingDemo;