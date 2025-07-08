const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createMock4UserDemo() {
  console.log('🎬 Creating Mock 4-User NoSpoilers Demo...\n');
  
  let browser;
  let screenshots = [];
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--window-size=1400,1000', '--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1000 });
    
    // Function to create a frame
    const createFrame = async (sceneData) => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              background: #0a0a0a;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: white;
            }
            .container {
              width: 1400px;
              height: 1000px;
              display: flex;
              flex-direction: column;
            }
            .header {
              text-align: center;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              font-weight: 700;
            }
            .header p {
              margin: 5px 0 0 0;
              font-size: 18px;
              opacity: 0.9;
            }
            .users-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              padding: 20px;
              flex: 1;
            }
            .user-window {
              position: relative;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 10px 30px rgba(0,0,0,0.3);
              background: #1a1a1a;
              border: 3px solid;
              display: flex;
              flex-direction: column;
            }
            .user-label {
              position: absolute;
              bottom: 15px;
              left: 50%;
              transform: translateX(-50%);
              padding: 8px 20px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              z-index: 10;
            }
            .scene-label {
              position: absolute;
              bottom: 30px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(0,0,0,0.9);
              padding: 12px 30px;
              border-radius: 8px;
              font-size: 20px;
              font-weight: 600;
              box-shadow: 0 4px 20px rgba(0,0,0,0.5);
              border: 2px solid rgba(255,255,255,0.1);
            }
            .browser-content {
              flex: 1;
              background: #0f0f0f;
              padding: 20px;
              overflow-y: auto;
            }
            .movie-list {
              display: flex;
              flex-direction: column;
              gap: 10px;
              margin-bottom: 20px;
            }
            .movie-item {
              background: #1f1f1f;
              padding: 15px;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border: 1px solid #333;
            }
            .movie-title {
              font-size: 16px;
              font-weight: 500;
            }
            .add-button {
              background: #667eea;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              font-size: 14px;
              cursor: pointer;
            }
            .ranking-section {
              background: #1f1f1f;
              padding: 15px;
              border-radius: 8px;
              margin-top: 20px;
            }
            .ranking-title {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 10px;
            }
            .ranked-movie {
              background: #2a2a2a;
              padding: 10px;
              margin: 5px 0;
              border-radius: 6px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .rank-number {
              background: #667eea;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
            }
            .results-content {
              text-align: center;
              padding: 40px;
            }
            .winner-box {
              background: linear-gradient(135deg, #4ecdc4 0%, #45b7d1 100%);
              padding: 30px;
              border-radius: 12px;
              margin: 20px 0;
            }
            .vote-count {
              font-size: 14px;
              color: #888;
            }
            .elimination-round {
              background: #1f1f1f;
              padding: 15px;
              margin: 10px 0;
              border-radius: 8px;
              text-align: left;
            }
            .eliminated {
              color: #ff6b6b;
              text-decoration: line-through;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>NoSpoilers - Real-Time Collaborative Voting</h1>
              <p>4 Users Demonstrating WebSocket Synchronization & Ranked Choice Voting</p>
            </div>
            <div class="users-grid">
              ${sceneData.users.map((user, i) => `
                <div class="user-window" style="border-color: ${user.color};">
                  <div class="browser-content">
                    ${user.content}
                  </div>
                  <div class="user-label" style="background: ${user.color}; color: white;">
                    ${user.name}
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="scene-label">${sceneData.sceneTitle}</div>
          </div>
        </body>
        </html>
      `;
      
      await page.setContent(html);
      await sleep(100);
      const screenshot = await page.screenshot({ encoding: 'base64' });
      screenshots.push(screenshot);
    };
    
    // Helper to create movie list HTML
    const movieListHTML = (movies, showButtons = true) => `
      <div class="movie-list">
        ${movies.map(movie => `
          <div class="movie-item">
            <span class="movie-title">${movie}</span>
            ${showButtons ? '<button class="add-button">Add to Ranking</button>' : ''}
          </div>
        `).join('')}
      </div>
    `;
    
    // Helper to create ranking HTML
    const rankingHTML = (rankings) => `
      <div class="ranking-section">
        <h3 class="ranking-title">Your Ranking (${rankings.length})</h3>
        ${rankings.map((movie, i) => `
          <div class="ranked-movie">
            <div class="rank-number">${i + 1}</div>
            <span>${movie}</span>
          </div>
        `).join('')}
      </div>
    `;
    
    // Helper to create results HTML
    const resultsHTML = (winner, votes, showElimination = false) => `
      <div class="results-content">
        <h2>Voting Results</h2>
        ${winner ? `
          <div class="winner-box">
            <h1>🏆 Winner: ${winner}</h1>
          </div>
        ` : ''}
        <div class="movie-list">
          ${Object.entries(votes).map(([movie, count]) => `
            <div class="movie-item">
              <span class="movie-title">${movie}</span>
              <span class="vote-count">${count} points</span>
            </div>
          `).join('')}
        </div>
        ${showElimination ? `
          <div style="margin-top: 30px;">
            <h3>Elimination Rounds (Ranked Choice)</h3>
            <div class="elimination-round">
              <strong>Round 1:</strong> All movies tied with 1 first-choice vote<br>
              The Matrix: 1, Inception: 1, Interstellar: 1, The Dark Knight: 1
            </div>
            <div class="elimination-round">
              <strong>Round 2:</strong> <span class="eliminated">Interstellar eliminated</span><br>
              The Dark Knight: 2, The Matrix: 1, Inception: 1
            </div>
            <div class="elimination-round">
              <strong>Round 3:</strong> <span class="eliminated">Inception eliminated</span><br>
              The Dark Knight: 3, The Matrix: 1
            </div>
            <div class="elimination-round" style="background: #2a4a4a;">
              <strong>Final:</strong> The Dark Knight wins with majority!
            </div>
          </div>
        ` : ''}
      </div>
    `;
    
    const users = [
      { name: 'Alice', color: '#FF6B6B' },
      { name: 'Bob', color: '#4ECDC4' },
      { name: 'Charlie', color: '#45B7D1' },
      { name: 'Diana', color: '#F8B500' }
    ];
    
    // Scene 1: Empty state
    console.log('🎬 Scene 1: Users joining');
    for (let i = 0; i < 20; i++) {
      await createFrame({
        sceneTitle: 'All users connected to the voting session',
        users: users.map(u => ({
          ...u,
          content: '<h2 style="text-align: center; margin-top: 100px;">Waiting for movies to be added...</h2>'
        }))
      });
    }
    
    // Scene 2: Alice adds The Matrix
    console.log('🎬 Scene 2: Alice adds a movie');
    const movies1 = ['The Matrix'];
    for (let i = 0; i < 30; i++) {
      await createFrame({
        sceneTitle: 'Alice adds "The Matrix" - instantly synced to all users!',
        users: users.map(u => ({
          ...u,
          content: movieListHTML(movies1)
        }))
      });
    }
    
    // Scene 3: Bob adds Inception
    console.log('🎬 Scene 3: Bob adds Inception');
    const movies2 = ['The Matrix', 'Inception'];
    for (let i = 0; i < 20; i++) {
      await createFrame({
        sceneTitle: 'Bob adds "Inception" - real-time WebSocket sync!',
        users: users.map(u => ({
          ...u,
          content: movieListHTML(movies2)
        }))
      });
    }
    
    // Scene 4: Charlie adds Interstellar
    console.log('🎬 Scene 4: Charlie adds Interstellar');
    const movies3 = ['The Matrix', 'Inception', 'Interstellar'];
    for (let i = 0; i < 20; i++) {
      await createFrame({
        sceneTitle: 'Charlie adds "Interstellar"',
        users: users.map(u => ({
          ...u,
          content: movieListHTML(movies3)
        }))
      });
    }
    
    // Scene 5: Diana adds The Dark Knight
    console.log('🎬 Scene 5: Diana adds The Dark Knight');
    const allMovies = ['The Matrix', 'Inception', 'Interstellar', 'The Dark Knight'];
    for (let i = 0; i < 20; i++) {
      await createFrame({
        sceneTitle: 'Diana adds "The Dark Knight" - 4 movies ready for voting!',
        users: users.map(u => ({
          ...u,
          content: movieListHTML(allMovies)
        }))
      });
    }
    
    // Scene 6: Users ranking
    console.log('🎬 Scene 6: Users ranking their preferences');
    const userRankings = [
      ['The Matrix', 'The Dark Knight', 'Inception', 'Interstellar'], // Alice
      ['Inception', 'The Dark Knight', 'The Matrix', 'Interstellar'], // Bob
      ['Interstellar', 'The Dark Knight', 'Inception', 'The Matrix'], // Charlie
      ['The Dark Knight', 'The Matrix', 'Inception', 'Interstellar'] // Diana
    ];
    
    for (let i = 0; i < 30; i++) {
      await createFrame({
        sceneTitle: 'Users ranking their movie preferences',
        users: users.map((u, idx) => ({
          ...u,
          content: movieListHTML(allMovies, false) + rankingHTML(userRankings[idx])
        }))
      });
    }
    
    // Scene 7: Voting results - First Past The Post
    console.log('🎬 Scene 7: First-Past-The-Post results');
    const fptp = {
      'The Matrix': 1,
      'Inception': 1,
      'Interstellar': 1,
      'The Dark Knight': 1
    };
    
    for (let i = 0; i < 30; i++) {
      await createFrame({
        sceneTitle: 'First-Past-The-Post: 4-way tie! Each movie gets 1 vote',
        users: users.map(u => ({
          ...u,
          content: resultsHTML(null, fptp)
        }))
      });
    }
    
    // Scene 8: Ranked Choice results
    console.log('🎬 Scene 8: Ranked Choice Voting results');
    const rankedChoice = {
      'The Dark Knight': 3,
      'The Matrix': 1,
      'Inception': 0,
      'Interstellar': 0
    };
    
    for (let i = 0; i < 40; i++) {
      await createFrame({
        sceneTitle: 'Ranked Choice Voting: The Dark Knight wins with majority!',
        users: users.map(u => ({
          ...u,
          content: resultsHTML('The Dark Knight', rankedChoice, true)
        }))
      });
    }
    
    // Scene 9: Final explanation
    console.log('🎬 Scene 9: Final message');
    for (let i = 0; i < 30; i++) {
      await createFrame({
        sceneTitle: 'Ranked Choice finds consensus where First-Past-The-Post fails!',
        users: users.map(u => ({
          ...u,
          content: `
            <div style="text-align: center; padding: 40px;">
              <h2>Why Ranked Choice?</h2>
              <div style="margin: 30px 0; font-size: 18px; line-height: 1.6;">
                <p>✅ First-Past-The-Post: 4-way tie</p>
                <p>✅ Ranked Choice: Clear winner</p>
                <p style="margin-top: 20px;">The Dark Knight was everyone's<br>second choice, making it the<br>best compromise for the group!</p>
              </div>
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; margin-top: 30px;">
                <h3>NoSpoilers</h3>
                <p>Fair movie selection through<br>ranked choice voting</p>
              </div>
            </div>
          `
        }))
      });
    }
    
    // Create video
    console.log('\n🎞️ Creating video...');
    
    // Save all frames
    for (let i = 0; i < screenshots.length; i++) {
      const buffer = Buffer.from(screenshots[i], 'base64');
      fs.writeFileSync(`/tmp/mock_frame_${String(i).padStart(5, '0')}.png`, buffer);
    }
    
    // Create high-quality video
    console.log('🎥 Encoding video with ffmpeg...');
    const ffmpegCmd = `ffmpeg -y -framerate 10 -i /tmp/mock_frame_%05d.png -c:v libx264 -pix_fmt yuv420p -crf 20 -vf "scale=1400:1000" public/demo.mp4`;
    await execPromise(ffmpegCmd);
    
    // Clean up frames
    await execPromise('rm -f /tmp/mock_frame_*.png');
    
    console.log('✅ Demo video created successfully at public/demo.mp4');
    console.log('\n📊 Voting Scenario Demonstrated:');
    console.log('- First choices: Matrix(1), Inception(1), Interstellar(1), Dark Knight(1)');
    console.log('- With ranked choice: Dark Knight wins as most common 2nd choice');
    console.log('- Shows how ranked choice better represents group consensus!\n');
    
  } catch (error) {
    console.error('❌ Demo creation error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the demo
createMock4UserDemo();