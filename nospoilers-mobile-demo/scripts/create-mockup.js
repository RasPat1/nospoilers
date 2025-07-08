const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function createMockup() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
    defaultViewport: { width: 400, height: 800 }
  });

  try {
    // Create 4 pages with full iPhone viewport
    const pages = [];
    const users = [
      { name: 'Art House', emoji: '🎭', endEmoji: '🎨', color: '#FF6B6B' },
      { name: 'Rom-Com Fan', emoji: '💕', endEmoji: '💖', color: '#4ECDC4' },
      { name: 'Sci-Fi Nerd', emoji: '🚀', endEmoji: '👽', color: '#45B7D1' },
      { name: 'Indie Buff', emoji: '🎬', endEmoji: '🎞️', color: '#96CEB4' }
    ];

    // Navigate to app and capture
    for (let i = 0; i < 4; i++) {
      const page = await browser.newPage();
      await page.goto('http://localhost:8080/vote');
      await new Promise(r => setTimeout(r, 2000));
      
      // Add user label
      await page.evaluate((user) => {
        const badge = document.createElement('div');
        badge.innerHTML = `${user.emoji} ${user.name} ${user.endEmoji}`;
        badge.style.cssText = `
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          background: ${user.color};
          color: white;
          padding: 12px 25px;
          border-radius: 30px;
          font-size: 18px;
          font-weight: bold;
          z-index: 10000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          white-space: nowrap;
        `;
        document.body.appendChild(badge);
      }, users[i]);
      
      pages.push(page);
    }

    // Take screenshots
    const screenshots = [];
    for (let i = 0; i < 4; i++) {
      const screenshot = await pages[i].screenshot();
      const filename = `phone_${i}.png`;
      await fs.writeFile(filename, screenshot);
      screenshots.push(filename);
    }

    // Combine into single image showing 4 full phones
    const cmd = `ffmpeg -y -i phone_0.png -i phone_1.png -i phone_2.png -i phone_3.png ` +
      `-filter_complex "[0:v][1:v][2:v][3:v]hstack=inputs=4:shortest=1" ` +
      `../output/mockup-4-iphones.png`;
    
    await execPromise(cmd);
    
    // Clean up
    for (const file of screenshots) {
      await fs.unlink(file);
    }
    
    console.log('✅ Mockup created: ../output/mockup-4-iphones.png');
    console.log('Dimensions: 1600x800 (4 phones @ 400x800 each)');
    
  } finally {
    await browser.close();
  }
}

createMockup().catch(console.error);