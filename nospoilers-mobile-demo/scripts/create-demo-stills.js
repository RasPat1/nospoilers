const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function createDemoStills() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1600, height: 900 }
  });

  try {
    const stillsDir = path.join(__dirname, '..', 'output', 'stills');
    await fs.mkdir(stillsDir, { recursive: true });
    
    // Create mockup pages for key scenes
    const scenes = [
      {
        name: '1_everything_everywhere_sync',
        title: 'Scene: "Everything Everywhere" Syncs Instantly',
        html: `
          <html>
            <body style="margin: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
              <div style="display: flex; height: 800px;">
                <!-- Art House -->
                <div style="width: 400px; background: #1a1a1a; position: relative; border-right: 1px solid #333;">
                  <div style="background: #2a2a2a; padding: 20px; color: white;">
                    <h2>NoSpoilers Movie Night</h2>
                  </div>
                  <div style="padding: 20px;">
                    <input style="width: 100%; padding: 15px; background: #2a2a2a; border: none; color: white; border-radius: 8px;" 
                           value="Everything Everywhere All at Once" />
                    <div style="background: #3a3a3a; padding: 15px; margin-top: 20px; border-radius: 8px; color: white;">
                      <img src="data:image/svg+xml,%3Csvg width='60' height='90' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='60' height='90' fill='%23666'/%3E%3C/svg%3E" style="float: left; margin-right: 15px;">
                      <h3>Everything Everywhere All at Once</h3>
                      <p style="color: #aaa;">2022 • ★ 8.0</p>
                    </div>
                  </div>
                  <div style="position: absolute; top: 200px; left: 50%; transform: translateX(-50%); 
                              background: linear-gradient(45deg, #ff6b6b, #4ecdc4); 
                              padding: 15px 30px; border-radius: 25px; color: white; font-weight: bold;">
                    ✨ Movie synced everywhere all at once! ✨
                  </div>
                </div>
                
                <!-- Rom-Com Fan -->
                <div style="width: 400px; background: #1a1a1a; position: relative; border-right: 1px solid #333;">
                  <div style="background: #2a2a2a; padding: 20px; color: white;">
                    <h2>NoSpoilers Movie Night</h2>
                  </div>
                  <div style="padding: 20px;">
                    <div style="background: #3a3a3a; padding: 15px; margin-top: 20px; border-radius: 8px; color: white;">
                      <img src="data:image/svg+xml,%3Csvg width='60' height='90' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='60' height='90' fill='%23666'/%3E%3C/svg%3E" style="float: left; margin-right: 15px;">
                      <h3>Everything Everywhere All at Once</h3>
                      <p style="color: #aaa;">2022 • ★ 8.0</p>
                      <p style="color: #4ecdc4;">✨ Just appeared!</p>
                    </div>
                  </div>
                  <div style="position: absolute; top: 200px; left: 50%; transform: translateX(-50%); 
                              background: linear-gradient(45deg, #ff6b6b, #4ecdc4); 
                              padding: 15px 30px; border-radius: 25px; color: white; font-weight: bold;">
                    ✨ Movie synced everywhere all at once! ✨
                  </div>
                </div>
                
                <!-- Sci-Fi Nerd -->
                <div style="width: 400px; background: #1a1a1a; position: relative; border-right: 1px solid #333;">
                  <div style="background: #2a2a2a; padding: 20px; color: white;">
                    <h2>NoSpoilers Movie Night</h2>
                  </div>
                  <div style="padding: 20px;">
                    <div style="background: #3a3a3a; padding: 15px; margin-top: 20px; border-radius: 8px; color: white;">
                      <img src="data:image/svg+xml,%3Csvg width='60' height='90' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='60' height='90' fill='%23666'/%3E%3C/svg%3E" style="float: left; margin-right: 15px;">
                      <h3>Everything Everywhere All at Once</h3>
                      <p style="color: #aaa;">2022 • ★ 8.0</p>
                      <p style="color: #45B7D1;">✨ Just appeared!</p>
                    </div>
                  </div>
                  <div style="position: absolute; top: 200px; left: 50%; transform: translateX(-50%); 
                              background: linear-gradient(45deg, #ff6b6b, #4ecdc4); 
                              padding: 15px 30px; border-radius: 25px; color: white; font-weight: bold;">
                    ✨ Movie synced everywhere all at once! ✨
                  </div>
                </div>
                
                <!-- Indie Buff -->
                <div style="width: 400px; background: #1a1a1a; position: relative;">
                  <div style="background: #2a2a2a; padding: 20px; color: white;">
                    <h2>NoSpoilers Movie Night</h2>
                  </div>
                  <div style="padding: 20px;">
                    <div style="background: #3a3a3a; padding: 15px; margin-top: 20px; border-radius: 8px; color: white;">
                      <img src="data:image/svg+xml,%3Csvg width='60' height='90' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='60' height='90' fill='%23666'/%3E%3C/svg%3E" style="float: left; margin-right: 15px;">
                      <h3>Everything Everywhere All at Once</h3>
                      <p style="color: #aaa;">2022 • ★ 8.0</p>
                      <p style="color: #96CEB4;">✨ Just appeared!</p>
                    </div>
                  </div>
                  <div style="position: absolute; top: 200px; left: 50%; transform: translateX(-50%); 
                              background: linear-gradient(45deg, #ff6b6b, #4ecdc4); 
                              padding: 15px 30px; border-radius: 25px; color: white; font-weight: bold;">
                    ✨ Movie synced everywhere all at once! ✨
                  </div>
                </div>
              </div>
              
              <!-- Label bar -->
              <div style="display: flex; height: 100px;">
                <div style="width: 400px; background: #FF6B6B; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
                  🎭 Art House 🎨
                </div>
                <div style="width: 400px; background: #4ECDC4; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
                  💕 Rom-Com Fan 💖
                </div>
                <div style="width: 400px; background: #45B7D1; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
                  🚀 Sci-Fi Nerd 👽
                </div>
                <div style="width: 400px; background: #96CEB4; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
                  🎬 Indie Buff 🎞️
                </div>
              </div>
            </body>
          </html>
        `
      },
      {
        name: '2_users_ranking',
        title: 'Scene: Users Ranking Their Favorites',
        html: `
          <html>
            <body style="margin: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
              <div style="display: flex; height: 800px;">
                <!-- Show different ranking states for each user -->
                ${[
                  { ranked: ['Everything Everywhere', 'Coherence', 'Swiss Army Man'], color: '#FF6B6B' },
                  { ranked: ['The Lobster', 'Everything Everywhere'], color: '#4ECDC4' },
                  { ranked: ['Swiss Army Man', 'Under the Skin', 'Everything Everywhere'], color: '#45B7D1' },
                  { ranked: ['Under the Skin', 'The Lobster'], color: '#96CEB4' }
                ].map((user, i) => `
                  <div style="width: 400px; background: #1a1a1a; border-right: ${i < 3 ? '1px solid #333' : 'none'};">
                    <div style="background: #2a2a2a; padding: 20px; color: white;">
                      <h2>NoSpoilers Movie Night</h2>
                    </div>
                    <div style="padding: 20px;">
                      <h3 style="color: white;">Your Ranking (${user.ranked.length})</h3>
                      <div style="background: #2a2a2a; padding: 10px; border-radius: 8px; margin: 10px 0;">
                        ${user.ranked.map((movie, idx) => `
                          <div style="padding: 10px; margin: 5px 0; background: #3a3a3a; border-radius: 6px; color: white; display: flex; align-items: center;">
                            <span style="background: ${user.color}; color: white; padding: 5px 10px; border-radius: 50%; margin-right: 10px; font-weight: bold;">${idx + 1}</span>
                            ${movie}
                          </div>
                        `).join('')}
                      </div>
                      <button style="width: 100%; padding: 15px; background: #4a4a4a; border: none; color: white; border-radius: 8px; margin-top: 20px; font-size: 16px;">
                        Submit Rankings
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
              
              <!-- Label bar -->
              <div style="display: flex; height: 100px;">
                <div style="width: 400px; background: #FF6B6B; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
                  🎭 Art House 🎨
                </div>
                <div style="width: 400px; background: #4ECDC4; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
                  💕 Rom-Com Fan 💖
                </div>
                <div style="width: 400px; background: #45B7D1; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
                  🚀 Sci-Fi Nerd 👽
                </div>
                <div style="width: 400px; background: #96CEB4; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
                  🎬 Indie Buff 🎞️
                </div>
              </div>
            </body>
          </html>
        `
      },
      {
        name: '3_irv_explanation',
        title: 'Scene: IRV Elimination Rounds Explained',
        html: `
          <html>
            <body style="margin: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
              <div style="display: flex; height: 800px;">
                <!-- Art House showing IRV explanation -->
                <div style="width: 400px; background: #1a1a1a; position: relative; border-right: 1px solid #333;">
                  <div style="background: #2a2a2a; padding: 20px; color: white;">
                    <h2>Voting Results</h2>
                  </div>
                  <div style="padding: 20px; color: white;">
                    <div style="background: #3a3a3a; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                      <h3>Round 1 Results</h3>
                      <div style="margin: 10px 0;">Everything Everywhere: 2 votes (40%)</div>
                      <div style="margin: 10px 0;">The Lobster: 1 vote (20%)</div>
                      <div style="margin: 10px 0;">Swiss Army Man: 1 vote (20%)</div>
                      <div style="margin: 10px 0; color: #ff6b6b;">Under the Skin: 1 vote (20%) ❌ Eliminated</div>
                    </div>
                    <div style="position: absolute; top: 250px; left: 50%; transform: translateX(-50%); 
                                background: rgba(0, 0, 0, 0.95); 
                                padding: 25px 35px; border-radius: 15px; 
                                max-width: 350px; z-index: 10001; 
                                box-shadow: 0 4px 30px rgba(0,0,0,0.5); 
                                border: 2px solid rgba(255,255,255,0.1);">
                      <div style="font-size: 20px; margin-bottom: 15px; font-weight: bold;">
                        🗳️ Ranked Choice Voting Explained
                      </div>
                      <div style="font-size: 16px; line-height: 1.5;">
                        1. No movie has >50% first-choice votes<br>
                        2. Eliminate the movie with fewest votes<br>
                        3. Those voters' 2nd choices count instead<br>
                        4. Repeat until one movie has majority!
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Other users viewing results -->
                ${[1, 2, 3].map(i => `
                  <div style="width: 400px; background: #1a1a1a; border-right: ${i < 3 ? '1px solid #333' : 'none'};">
                    <div style="background: #2a2a2a; padding: 20px; color: white;">
                      <h2>Voting Results</h2>
                    </div>
                    <div style="padding: 20px; color: white;">
                      <div style="background: #3a3a3a; padding: 15px; border-radius: 8px;">
                        <h3>Current Rankings</h3>
                        <div style="margin: 10px 0;">1. Everything Everywhere All at Once</div>
                        <div style="margin: 10px 0;">2. The Lobster</div>
                        <div style="margin: 10px 0;">3. Swiss Army Man</div>
                      </div>
                      <p style="color: #888; margin-top: 20px;">Watching elimination rounds...</p>
                    </div>
                  </div>
                `).join('')}
              </div>
              
              <!-- Label bar -->
              <div style="display: flex; height: 100px;">
                <div style="width: 400px; background: #FF6B6B; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
                  🎭 Art House 🎨
                </div>
                <div style="width: 400px; background: #4ECDC4; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
                  💕 Rom-Com Fan 💖
                </div>
                <div style="width: 400px; background: #45B7D1; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
                  🚀 Sci-Fi Nerd 👽
                </div>
                <div style="width: 400px; background: #96CEB4; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
                  🎬 Indie Buff 🎞️
                </div>
              </div>
            </body>
          </html>
        `
      }
    ];
    
    // Create each still
    for (const scene of scenes) {
      console.log(`Creating still: ${scene.title}`);
      
      const page = await browser.newPage();
      await page.setViewport({ width: 1600, height: 900 });
      await page.setContent(scene.html);
      await page.screenshot({ 
        path: path.join(stillsDir, `${scene.name}.png`),
        fullPage: false 
      });
      await page.close();
    }
    
    console.log(`\n✅ Created ${scenes.length} demo stills in output/stills/`);
    
  } finally {
    await browser.close();
  }
}

createDemoStills().catch(console.error);