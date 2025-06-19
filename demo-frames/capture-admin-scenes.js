const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function captureAdminScenes() {
  console.log('🎬 Capturing Admin Scenes...\n');

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--window-size=1920,1080']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to admin with secret parameter
    console.log('📍 Navigating to admin panel...');
    await page.goto('http://localhost:3000/admin?admin=admin123');
    await new Promise(r => setTimeout(r, 1500));

    // Take screenshot of login page
    await page.screenshot({ 
      path: './demo-frames/scene_012_admin_login.png' 
    });
    console.log('📸 Captured: Admin login page');

    // Login to admin panel
    console.log('📍 Logging in...');
    await page.type('input[type="text"]', 'admin');
    await page.type('input[type="password"]', 'admin123');
    
    // Click login button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const loginButton = buttons.find(btn => btn.textContent.includes('Login'));
      if (loginButton) loginButton.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));

    // Take screenshot of admin dashboard
    await page.screenshot({ 
      path: './demo-frames/scene_012_admin_dashboard.png' 
    });
    console.log('📸 Captured: Admin dashboard');

    // Take another screenshot showing the reset button
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ 
      path: './demo-frames/scene_013_admin_reset_option.png' 
    });
    console.log('📸 Captured: Admin reset option');

    console.log('\n✅ Admin scenes captured successfully!');
    
  } catch (error) {
    console.error('❌ Error capturing admin scenes:', error);
  } finally {
    await browser.close();
  }
}

// Run the capture
captureAdminScenes();