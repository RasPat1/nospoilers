const puppeteer = require('puppeteer');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function create4UserDemo() {
  console.log('🎬 Recording 4-User NoSpoilers Demo with Ranked Choice Voting...\n');
  
  let browser;
  let screenshots = [];
  let frameCount = 0;
  
  try {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--window-size=1400,900', '--no-sandbox']
    });
    
    // Create 4 pages for 4 users
    const pages = [];
    const userNames = ['Alice', 'Bob', 'Charlie', 'Diana'];
    const userColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F8B500'];
    
    // Create pages for each user
    for (let i = 0; i < 4; i++) {
      const page = await browser.newPage();
      await page.setViewport({ width: 600, height: 450 });
      pages.push(page);
    }
    
    // Function to take a composite screenshot of all 4 users
    const takeCompositeScreenshot = async (label, duration = 2000) => {
      console.log(`📸 ${label}`);
      const numFrames = Math.floor(duration / 100);
      
      for (let frame = 0; frame < numFrames; frame++) {
        // Take screenshots from all 4 pages
        const pageScreenshots = await Promise.all(
          pages.map(page => page.screenshot({ encoding: 'base64' }))
        );
        
        // Create a composite image using canvas
        const compositeHtml = `
          <html>
          <body style="margin: 0; background: #1a1a1a;">
            <div style="width: 1200px; height: 900px; position: relative;">
              <h1 style="color: white; text-align: center; margin: 20px 0; font-family: Arial;">
                NoSpoilers - 4 Users Voting in Real-Time
              </h1>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 0 20px;">
                ${pageScreenshots.map((screenshot, i) => `
                  <div style="position: relative; border: 3px solid ${userColors[i]}; border-radius: 8px; overflow: hidden;">
                    <img src="data:image/png;base64,${screenshot}" style="width: 100%; display: block;" />
                    <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
                                background: ${userColors[i]}; color: white; padding: 8px 16px;
                                border-radius: 20px; font-family: Arial; font-weight: bold;">
                      ${userNames[i]}
                    </div>
                  </div>
                `).join('')}
              </div>
              <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
                          background: rgba(0,0,0,0.8); color: white; padding: 12px 24px;
                          border-radius: 8px; font-family: Arial; font-size: 18px;">
                ${label}
              </div>
            </div>
          </body>
          </html>
        `;
        
        // Create a new page for composite
        const compositePage = await browser.newPage();
        await compositePage.setViewport({ width: 1200, height: 900 });
        await compositePage.setContent(compositeHtml);
        const compositeScreenshot = await compositePage.screenshot({ encoding: 'base64' });
        await compositePage.close();
        
        screenshots.push(compositeScreenshot);
        await sleep(100);
      }
    };
    
    // Scene 1: All users join the voting session
    console.log('\n🎬 SCENE 1: Users joining the session');
    for (let i = 0; i < 4; i++) {
      await pages[i].goto('http://localhost:8080/vote');
      await sleep(500);
    }
    await takeCompositeScreenshot('All users connected to the voting session', 3000);
    
    // Scene 2: Alice adds "The Shawshank Redemption"
    console.log('\n🎬 SCENE 2: Alice adds a movie');
    await pages[0].type('input[placeholder*="Search"]', 'The Shawshank Redemption');
    await sleep(2000);
    await takeCompositeScreenshot('Alice searches for "The Shawshank Redemption"', 2000);
    
    // Click on the first search result
    await pages[0].click('button[class*="hover:bg-neutral"]');
    await sleep(1000);
    await takeCompositeScreenshot('Movie appears on all screens in real-time!', 3000);
    
    // Scene 3: Bob adds "The Dark Knight"
    console.log('\n🎬 SCENE 3: Bob adds another movie');
    await pages[1].type('input[placeholder*="Search"]', 'The Dark Knight');
    await sleep(2000);
    await pages[1].click('button[class*="hover:bg-neutral"]');
    await sleep(1000);
    await takeCompositeScreenshot('Bob adds "The Dark Knight" - synced to all users', 3000);
    
    // Scene 4: Charlie adds "Inception"
    console.log('\n🎬 SCENE 4: Charlie adds a third movie');
    await pages[2].type('input[placeholder*="Search"]', 'Inception');
    await sleep(2000);
    await pages[2].click('button[class*="hover:bg-neutral"]');
    await sleep(1000);
    await takeCompositeScreenshot('Charlie adds "Inception" - 3 movies to choose from', 3000);
    
    // Scene 5: Diana adds "Pulp Fiction"
    console.log('\n🎬 SCENE 5: Diana adds the final movie');
    await pages[3].type('input[placeholder*="Search"]', 'Pulp Fiction');
    await sleep(2000);
    await pages[3].click('button[class*="hover:bg-neutral"]');
    await sleep(1000);
    await takeCompositeScreenshot('Diana adds "Pulp Fiction" - 4 movies total', 3000);
    
    // Scene 6: Users start ranking their preferences
    console.log('\n🎬 SCENE 6: Users rank their preferences');
    
    // Alice's ranking: 1. Shawshank, 2. Inception, 3. Dark Knight, 4. Pulp Fiction
    const aliceButtons = await pages[0].$$('button:has-text("Add to Ranking")');
    if (aliceButtons.length >= 4) {
      await aliceButtons[0].click(); await sleep(300);
      await aliceButtons[2].click(); await sleep(300);
      await aliceButtons[1].click(); await sleep(300);
      await aliceButtons[3].click(); await sleep(300);
    }
    
    // Bob's ranking: 1. Dark Knight, 2. Pulp Fiction, 3. Inception, 4. Shawshank
    const bobButtons = await pages[1].$$('button:has-text("Add to Ranking")');
    if (bobButtons.length >= 4) {
      await bobButtons[1].click(); await sleep(300);
      await bobButtons[3].click(); await sleep(300);
      await bobButtons[2].click(); await sleep(300);
      await bobButtons[0].click(); await sleep(300);
    }
    
    await takeCompositeScreenshot('Users ranking their movie preferences', 3000);
    
    // Charlie's ranking: 1. Inception, 2. Pulp Fiction, 3. Dark Knight, 4. Shawshank
    const charlieButtons = await pages[2].$$('button:has-text("Add to Ranking")');
    if (charlieButtons.length >= 4) {
      await charlieButtons[2].click(); await sleep(300);
      await charlieButtons[3].click(); await sleep(300);
      await charlieButtons[1].click(); await sleep(300);
      await charlieButtons[0].click(); await sleep(300);
    }
    
    // Diana's ranking: 1. Pulp Fiction, 2. Shawshank, 3. Dark Knight, 4. Inception
    const dianaButtons = await pages[3].$$('button:has-text("Add to Ranking")');
    if (dianaButtons.length >= 4) {
      await dianaButtons[3].click(); await sleep(300);
      await dianaButtons[0].click(); await sleep(300);
      await dianaButtons[1].click(); await sleep(300);
      await dianaButtons[2].click(); await sleep(300);
    }
    
    await takeCompositeScreenshot('All users have ranked their preferences', 3000);
    
    // Scene 7: Alice submits her vote
    console.log('\n🎬 SCENE 7: Voting begins');
    await pages[0].click('button:has-text("Submit Rankings")');
    await sleep(1000);
    
    // Navigate Alice to results
    await pages[0].goto('http://localhost:8080/results');
    await takeCompositeScreenshot('Alice submits vote - sees live results', 3000);
    
    // Scene 8: Bob submits his vote
    await pages[1].click('button:has-text("Submit Rankings")');
    await sleep(1000);
    await pages[1].goto('http://localhost:8080/results');
    await takeCompositeScreenshot('Bob votes - results update in real-time!', 3000);
    
    // Scene 9: Charlie submits
    await pages[2].click('button:has-text("Submit Rankings")');
    await sleep(1000);
    await pages[2].goto('http://localhost:8080/results');
    await takeCompositeScreenshot('Charlie votes - tie situation emerges', 3000);
    
    // Scene 10: Diana's vote decides the winner
    await pages[3].click('button:has-text("Submit Rankings")');
    await sleep(1000);
    await pages[3].goto('http://localhost:8080/results');
    await takeCompositeScreenshot('Diana votes - Ranked Choice determines winner!', 4000);
    
    // Scene 11: Show ranked choice vs first-past-the-post difference
    console.log('\n🎬 SCENE 11: Ranked Choice vs First-Past-The-Post');
    
    // Click to expand elimination rounds on all results pages
    for (let i = 0; i < 4; i++) {
      try {
        await pages[i].click('button:has-text("View Elimination Rounds")');
      } catch (e) {
        // Page might not have the button
      }
    }
    await sleep(1000);
    
    await takeCompositeScreenshot('Ranked Choice Voting: Different from First-Past-The-Post!', 5000);
    
    // Scene 12: Final winner celebration
    await takeCompositeScreenshot('Fair winner selected through ranked choice voting!', 3000);
    
    console.log('\n🎞️ Creating video...');
    
    // Save screenshots
    for (let i = 0; i < screenshots.length; i++) {
      const buffer = Buffer.from(screenshots[i], 'base64');
      fs.writeFileSync(`/tmp/4user_frame_${String(i).padStart(4, '0')}.png`, buffer);
    }
    
    // Create video with higher quality
    console.log('🎥 Encoding video...');
    await execPromise(`ffmpeg -y -framerate 10 -i /tmp/4user_frame_%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 -vf "scale=1200:900" public/demo.mp4`);
    
    // Clean up
    await execPromise('rm -f /tmp/4user_frame_*.png');
    
    console.log('✅ Advanced 4-user demo video created at public/demo.mp4');
    
  } catch (error) {
    console.error('Demo error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Add explanation of the voting scenario
console.log(`
📊 Voting Scenario Explanation:
================================
This demo shows how Ranked Choice Voting can produce different results than First-Past-The-Post:

First-Past-The-Post Results (just counting first choices):
- Shawshank: 1 vote (Alice)
- Dark Knight: 1 vote (Bob)  
- Inception: 1 vote (Charlie)
- Pulp Fiction: 1 vote (Diana)
Result: 4-way tie!

Ranked Choice Voting Process:
1. Round 1: All movies tied with 1 first-choice vote each
2. Round 2: Eliminate movie with fewest 2nd choice votes
3. Votes redistribute based on next preferences
4. Continue until one movie has majority

The winner through ranked choice better represents the group's overall preferences!
`);

create4UserDemo();