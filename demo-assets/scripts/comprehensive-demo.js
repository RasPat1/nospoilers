const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const fs = require('fs').promises;
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const ADMIN_PASSWORD = 'admin123';
const OUTPUT_DIR = 'demo-output/comprehensive';
const FRAME_RATE = 2; // 2 FPS for better file size
const VIEWPORT = { width: 1920, height: 1080 };

// Utility functions
async function ensureDirectoryExists(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dir}:`, error);
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function clickWithVisualFeedback(page, selector, description = '') {
  console.log(`Clicking: ${description || selector}`);
  
  // Wait for element and get position
  await page.waitForSelector(selector, { timeout: 5000 }).catch(() => {
    console.log(`Could not find selector: ${selector}`);
  });
  
  const element = await page.$(selector);
  if (!element) {
    console.log(`Element not found: ${selector}`);
    return;
  }
  
  const box = await element.boundingBox();
  if (!box) {
    console.log(`Could not get bounding box for: ${selector}`);
    return;
  }
  
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  
  // Create visual click indicator
  await page.evaluate((x, y) => {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: fixed;
      left: ${x - 30}px;
      top: ${y - 30}px;
      width: 60px;
      height: 60px;
      border: 3px solid #FF0000;
      border-radius: 50%;
      background-color: rgba(255, 0, 0, 0.3);
      z-index: 99999;
      pointer-events: none;
      animation: clickPulse 0.6s ease-out;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes clickPulse {
        0% { transform: scale(0.5); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(indicator);
    
    setTimeout(() => indicator.remove(), 600);
  }, x, y);
  
  await delay(200); // Let indicator appear
  await page.click(selector);
  await delay(400); // Let animation complete
}

async function typeWithVisualFeedback(page, selector, text, description = '') {
  console.log(`Typing in ${description}: "${text}"`);
  
  // Wait for element to exist
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
  } catch (e) {
    console.log(`Could not find input: ${selector}`);
    return;
  }
  
  await clickWithVisualFeedback(page, selector, description);
  
  // Clear existing text
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  
  // Type new text slowly for visibility
  for (const char of text) {
    await page.type(selector, char);
    await delay(100);
  }
  await delay(500);
}

async function captureScene(page, sceneName, frameCount) {
  const sceneDir = path.join(OUTPUT_DIR, sceneName);
  await ensureDirectoryExists(sceneDir);
  
  console.log(`\n📹 Capturing ${sceneName}...`);
  
  for (let i = 0; i < frameCount; i++) {
    await page.screenshot({
      path: path.join(sceneDir, `frame_${String(i).padStart(4, '0')}.png`),
      fullPage: false
    });
    await delay(1000 / FRAME_RATE);
  }
}

async function createSceneVideo(sceneName) {
  const sceneDir = path.join(OUTPUT_DIR, sceneName);
  const outputPath = path.join(OUTPUT_DIR, `${sceneName}.mp4`);
  
  console.log(`\n🎬 Creating video for ${sceneName}...`);
  
  await execPromise(
    `ffmpeg -y -framerate ${FRAME_RATE} -i ${sceneDir}/frame_%04d.png ` +
    `-c:v libx264 -r 30 -pix_fmt yuv420p -crf 23 ` +
    `-vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" ` +
    outputPath
  );
  
  console.log(`✅ Video created: ${outputPath}`);
}

// Scene functions
async function scene1_TheProblem(page) {
  console.log('\n🎬 SCENE 1: The Problem');
  
  await page.goto(BASE_URL);
  await page.waitForSelector('h1');
  
  await captureScene(page, 'scene1_problem', 3);
  
  // Find and click start voting button
  try {
    // Look for button with full text "Start Voting Now"
    await page.waitForSelector('button', { timeout: 5000 });
    const startButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent.includes('Start Voting'));
    });
    
    if (startButton) {
      const box = await startButton.boundingBox();
      if (box) {
        await clickWithVisualFeedback(page, 'button:nth-of-type(1)', 'Start Voting Now button');
      }
    }
  } catch (error) {
    console.log('Could not find start button, navigating directly to /vote');
  }
  
  await delay(2000);
  await page.goto(`${BASE_URL}/vote`);
  
  await captureScene(page, 'scene1_problem', 2);
}

async function scene2_SarahAddsMovies(page) {
  console.log('\n🎬 SCENE 2: Sarah Adds Movies');
  
  // Add Inception via search
  await typeWithVisualFeedback(page, 'input[type="text"]', 'Inception', 'movie search box');
  await delay(1500); // Wait for search results
  
  await captureScene(page, 'scene2_sarah', 2);
  
  // Wait for search results and click first one
  await page.waitForSelector('[data-testid="movie-search-result"]', { timeout: 5000 }).catch(() => {
    console.log('No search results found, trying alternate selector');
  });
  
  // Try multiple possible selectors for search results
  const searchResultSelectors = [
    '[data-testid="movie-search-result"]:first-child',
    '.search-results > div:first-child',
    '.movie-search-result:first-child',
    'div[role="option"]:first-child'
  ];
  
  let clicked = false;
  for (const selector of searchResultSelectors) {
    const element = await page.$(selector);
    if (element) {
      await clickWithVisualFeedback(page, selector, 'Inception from search results');
      clicked = true;
      break;
    }
  }
  
  if (!clicked) {
    console.log('Could not find search results to click');
  }
  await delay(2000);
  
  // Add Everything Everywhere
  await typeWithVisualFeedback(page, 'input[type="text"]', 'Everything Everywhere', 'movie search box');
  await delay(1500);
  
  // Click Everything Everywhere from search results
  const searchResultSelectors = [
    '[data-testid="movie-search-result"]:first-child',
    '.search-results > div:first-child',
    '.movie-search-result:first-child',
    'div[role="option"]:first-child'
  ];
  
  for (const selector of searchResultSelectors) {
    const element = await page.$(selector);
    if (element) {
      await clickWithVisualFeedback(page, selector, 'Everything Everywhere from results');
      break;
    }
  }
  await delay(2000);
  
  // Manual entry
  await typeWithVisualFeedback(page, 'input[type="text"]', "My Cousin's Wedding Video", 'movie search box');
  await delay(1000);
  
  // Click Add Movie button
  const addButtonSelectors = [
    'button:has-text("Add Movie")',
    'button[type="submit"]',
    '.add-movie-button',
    'button.primary'
  ];
  
  for (const selector of addButtonSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        await clickWithVisualFeedback(page, selector, 'Add Movie button');
        break;
      }
    } catch (e) {
      // Try next selector
    }
  }
  await delay(2000);
  
  await captureScene(page, 'scene2_sarah', 3);
}

async function scene3_MikeJoins(page) {
  console.log('\n🎬 SCENE 3: Mike Joins');
  
  const mikePage = await page.browser().newPage();
  await mikePage.setViewport(VIEWPORT);
  await mikePage.goto(`${BASE_URL}/vote`);
  await mikePage.waitForSelector('.movie-card');
  
  await captureScene(mikePage, 'scene3_mike', 2);
  
  // Try to add duplicate
  await typeWithVisualFeedback(mikePage, 'input[type="text"]', 'Inception', 'movie search box');
  await delay(1500);
  
  await clickWithVisualFeedback(mikePage, '.search-results > div:first-child', 'Inception (duplicate)');
  await delay(2000);
  
  // Show error message
  await captureScene(mikePage, 'scene3_mike', 2);
  
  // Add The Matrix
  await typeWithVisualFeedback(mikePage, 'input[type="text"]', 'The Matrix', 'movie search box');
  await delay(1500);
  
  await clickWithVisualFeedback(mikePage, '.search-results > div:first-child', 'The Matrix');
  await delay(2000);
  
  // Add Parasite
  await typeWithVisualFeedback(mikePage, 'input[type="text"]', 'Parasite', 'movie search box');
  await delay(1500);
  
  await clickWithVisualFeedback(mikePage, '.search-results > div:first-child', 'Parasite');
  await delay(2000);
  
  await captureScene(mikePage, 'scene3_mike', 2);
  
  await mikePage.close();
}

async function scene4_EmmaVotes(page) {
  console.log('\n🎬 SCENE 4: Emma Votes');
  
  const emmaPage = await page.browser().newPage();
  await emmaPage.setViewport({ width: 390, height: 844 }); // iPhone 14 Pro
  await emmaPage.goto(`${BASE_URL}/vote`);
  await emmaPage.waitForSelector('.movie-card');
  
  await captureScene(emmaPage, 'scene4_emma', 2);
  
  // Add movies to ranking
  const moviesToRank = [
    'Everything Everywhere',
    'Parasite',
    'Inception'
  ];
  
  for (const movieTitle of moviesToRank) {
    const movieCard = await emmaPage.$x(`//h3[contains(text(), "${movieTitle}")]/ancestor::div[contains(@class, "movie-card")]`);
    if (movieCard[0]) {
      await clickWithVisualFeedback(movieCard[0], '.movie-card', `${movieTitle} card`);
      await delay(1000);
    }
  }
  
  await captureScene(emmaPage, 'scene4_emma', 2);
  
  // Submit vote
  await emmaPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await delay(500);
  
  await clickWithVisualFeedback(emmaPage, 'button:has-text("Submit Vote")', 'Submit Vote button');
  await emmaPage.waitForNavigation();
  
  await captureScene(emmaPage, 'scene4_emma', 2);
  
  await emmaPage.close();
}

async function scene5_LiveResults(page) {
  console.log('\n🎬 SCENE 5: Live Results');
  
  await page.goto(`${BASE_URL}/results`);
  await page.waitForSelector('h1');
  
  await captureScene(page, 'scene5_results', 3);
  
  // Simulate more votes coming in
  const voters = [
    { name: 'Mike', rankings: ['The Matrix', 'Inception', 'Parasite'] },
    { name: 'Sarah', rankings: ['Everything Everywhere', 'Inception', 'The Matrix'] }
  ];
  
  for (const voter of voters) {
    const voterPage = await page.browser().newPage();
    await voterPage.setViewport(VIEWPORT);
    await voterPage.goto(`${BASE_URL}/vote`);
    
    // Quick vote
    for (const movie of voter.rankings) {
      const movieCard = await voterPage.$x(`//h3[contains(text(), "${movie}")]/ancestor::div[contains(@class, "movie-card")]`);
      if (movieCard[0]) {
        await movieCard[0].click();
        await delay(500);
      }
    }
    
    const submitButton = await voterPage.$('button:has-text("Submit Vote")');
    if (submitButton) {
      await submitButton.click();
    }
    
    await voterPage.close();
    
    // Show results updating
    await page.reload();
    await captureScene(page, 'scene5_results', 2);
  }
}

async function scene6_AlexJoinsLate(page) {
  console.log('\n🎬 SCENE 6: Alex Joins Late');
  
  const alexPage = await page.browser().newPage();
  await alexPage.setViewport(VIEWPORT);
  await alexPage.goto(`${BASE_URL}/vote`);
  await alexPage.waitForSelector('.movie-card');
  
  // Add Dune
  await typeWithVisualFeedback(alexPage, 'input[type="text"]', 'Dune', 'movie search box');
  await delay(1500);
  
  await clickWithVisualFeedback(alexPage, '.search-results > div:first-child', 'Dune');
  await delay(2000);
  
  await captureScene(alexPage, 'scene6_alex', 2);
  
  // Create ranking with all movies
  const allMovies = ['Dune', 'Everything Everywhere', 'The Matrix', 'Inception'];
  for (const movie of allMovies) {
    const movieCard = await alexPage.$x(`//h3[contains(text(), "${movie}")]/ancestor::div[contains(@class, "movie-card")]`);
    if (movieCard[0]) {
      await clickWithVisualFeedback(movieCard[0], '.movie-card', `${movie} card`);
      await delay(800);
    }
  }
  
  await captureScene(alexPage, 'scene6_alex', 2);
  
  // Submit vote
  await clickWithVisualFeedback(alexPage, 'button:has-text("Submit Vote")', 'Submit Vote button');
  await alexPage.waitForNavigation();
  
  // Try to vote again
  await alexPage.goto(`${BASE_URL}/vote`);
  await delay(2000);
  await captureScene(alexPage, 'scene6_alex', 2);
  
  await alexPage.close();
}

async function scene7_AdminClosesVoting(page) {
  console.log('\n🎬 SCENE 7: Admin Closes Voting');
  
  await page.goto(`${BASE_URL}/admin?admin=${ADMIN_PASSWORD}`);
  await page.waitForSelector('h1');
  
  await captureScene(page, 'scene7_admin', 3);
  
  // Show statistics
  await delay(2000);
  
  // Close voting
  await clickWithVisualFeedback(page, 'button:has-text("Close Voting")', 'Close Voting button');
  await delay(2000);
  
  await captureScene(page, 'scene7_admin', 2);
}

async function scene8_WinnerAnnouncement(page) {
  console.log('\n🎬 SCENE 8: Winner Announcement');
  
  await page.goto(`${BASE_URL}/results`);
  await page.waitForSelector('h1');
  
  // Show winner with details
  await captureScene(page, 'scene8_winner', 4);
  
  // Scroll to show IRV details if present
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await delay(1000);
  
  await captureScene(page, 'scene8_winner', 2);
}

// Main function
async function createComprehensiveDemo() {
  await ensureDirectoryExists(OUTPUT_DIR);
  
  // Reset database if Docker is running, otherwise use current state
  try {
    await execPromise('docker ps');
    await execPromise('npm run test:setup');
    console.log('✅ Database reset for clean demo');
  } catch (error) {
    console.log('⚠️  Using current database state (Docker not running)');
  }
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  
  try {
    // Run each scene
    await scene1_TheProblem(page);
    await scene2_SarahAddsMovies(page);
    await scene3_MikeJoins(page);
    await scene4_EmmaVotes(page);
    await scene5_LiveResults(page);
    await scene6_AlexJoinsLate(page);
    await scene7_AdminClosesVoting(page);
    await scene8_WinnerAnnouncement(page);
    
    // Create individual scene videos
    const scenes = [
      'scene1_problem',
      'scene2_sarah',
      'scene3_mike',
      'scene4_emma',
      'scene5_results',
      'scene6_alex',
      'scene7_admin',
      'scene8_winner'
    ];
    
    for (const scene of scenes) {
      await createSceneVideo(scene);
    }
    
    // Create combined video
    console.log('\n🎬 Creating combined demo video...');
    const concatFile = path.join(OUTPUT_DIR, 'concat.txt');
    const fileList = scenes.map(s => `file '${s}.mp4'`).join('\n');
    await fs.writeFile(concatFile, fileList);
    
    await execPromise(
      `ffmpeg -y -f concat -safe 0 -i ${concatFile} ` +
      `-c:v libx264 -crf 23 -preset medium ` +
      `${OUTPUT_DIR}/nospoilers_complete_demo.mp4`
    );
    
    console.log('\n✅ Complete demo created: nospoilers_complete_demo.mp4');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

// Individual scene runners for re-recording
async function runSingleScene(sceneNumber) {
  await ensureDirectoryExists(OUTPUT_DIR);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  
  try {
    switch (sceneNumber) {
      case 1:
        await scene1_TheProblem(page);
        await createSceneVideo('scene1_problem');
        break;
      case 2:
        await page.goto(`${BASE_URL}/vote`);
        await scene2_SarahAddsMovies(page);
        await createSceneVideo('scene2_sarah');
        break;
      case 3:
        await scene3_MikeJoins(page);
        await createSceneVideo('scene3_mike');
        break;
      case 4:
        await scene4_EmmaVotes(page);
        await createSceneVideo('scene4_emma');
        break;
      case 5:
        await scene5_LiveResults(page);
        await createSceneVideo('scene5_results');
        break;
      case 6:
        await scene6_AlexJoinsLate(page);
        await createSceneVideo('scene6_alex');
        break;
      case 7:
        await scene7_AdminClosesVoting(page);
        await createSceneVideo('scene7_admin');
        break;
      case 8:
        await scene8_WinnerAnnouncement(page);
        await createSceneVideo('scene8_winner');
        break;
      default:
        console.error('Invalid scene number');
    }
  } finally {
    await browser.close();
  }
}

// Run based on command line arguments
const args = process.argv.slice(2);
if (args[0] === 'scene' && args[1]) {
  const sceneNum = parseInt(args[1]);
  runSingleScene(sceneNum).then(() => {
    console.log(`\n✅ Scene ${sceneNum} recorded successfully!`);
    console.log('\x07'); // Bell
  });
} else {
  createComprehensiveDemo().then(() => {
    console.log('\n✅ Complete demo created successfully!');
    console.log('\x07'); // Bell
  });
}