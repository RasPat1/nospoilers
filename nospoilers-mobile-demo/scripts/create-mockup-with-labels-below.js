const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function createMockupWithLabelsBelow() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
    defaultViewport: { width: 400, height: 800 }
  });

  try {
    const users = [
      { name: 'Art House', emoji: '🎭', endEmoji: '🎨', color: '#FF6B6B' },
      { name: 'Rom-Com Fan', emoji: '💕', endEmoji: '💖', color: '#4ECDC4' },
      { name: 'Sci-Fi Nerd', emoji: '🚀', endEmoji: '👽', color: '#45B7D1' },
      { name: 'Indie Buff', emoji: '🎬', endEmoji: '🎞️', color: '#96CEB4' }
    ];

    // Create 4 pages WITHOUT labels
    const screenshots = [];
    for (let i = 0; i < 4; i++) {
      const page = await browser.newPage();
      await page.goto('http://localhost:8080/vote');
      await new Promise(r => setTimeout(r, 2000));
      
      // Take screenshot without any label
      const screenshot = await page.screenshot();
      const filename = `phone_clean_${i}.png`;
      await fs.writeFile(filename, screenshot);
      screenshots.push(filename);
      
      await page.close();
    }

    // Create label bar as separate image
    const labelPage = await browser.newPage();
    await labelPage.setViewport({ width: 1600, height: 100 });
    
    const labelHtml = `
      <html>
        <body style="margin: 0; background: #1a1a1a; display: flex; height: 100vh;">
          ${users.map((user, i) => `
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
    
    await labelPage.setContent(labelHtml);
    await labelPage.screenshot({ path: 'labels.png' });
    
    // Combine phones horizontally
    const phonesCmd = `ffmpeg -y ${screenshots.map(f => `-i ${f}`).join(' ')} ` +
      `-filter_complex "[0:v][1:v][2:v][3:v]hstack=inputs=4:shortest=1" phones.png`;
    await execPromise(phonesCmd);
    
    // Stack phones and labels vertically
    const finalCmd = `ffmpeg -y -i phones.png -i labels.png ` +
      `-filter_complex "[0:v][1:v]vstack=inputs=2" ../output/mockup-4-iphones-labels-below.png`;
    await execPromise(finalCmd);
    
    // Clean up temp files
    for (const file of screenshots) {
      await fs.unlink(file);
    }
    await fs.unlink('phones.png');
    await fs.unlink('labels.png');
    
    console.log('✅ Mockup created: ../output/mockup-4-iphones-labels-below.png');
    console.log('Dimensions: 1600x900 (4 phones @ 400x800 + 100px label bar)');
    
  } finally {
    await browser.close();
  }
}

createMockupWithLabelsBelow().catch(console.error);