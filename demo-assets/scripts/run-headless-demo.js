#!/usr/bin/env node
const MovieNightDemoRecorder = require('./demo-recorder.js');

console.log('🎬 NoSpoilers Headless Demo Runner\n');
console.log('This will run completely in the background.');
console.log('You can continue using your computer normally.\n');

async function runHeadlessDemo() {
  const startTime = Date.now();
  
  const demo = new MovieNightDemoRecorder({
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    headless: true,  // Always run headless
    slowMo: 0,       // No delays needed
    viewport: { width: 1920, height: 1080 },
    screenshotDir: './demo-frames',
    outputVideo: 'movie_night_demo_headless.mp4'
  });

  // Progress indicator
  const progressInterval = setInterval(() => {
    process.stdout.write('.');
  }, 1000);

  try {
    console.log('📍 Starting demo recording...');
    await demo.init();
    
    console.log('📍 Running demo scenarios...');
    await demo.runDemo();
    
    console.log('\n📍 Creating video from screenshots...');
    await demo.createVideo();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✅ Demo complete in ${duration} seconds!`);
    console.log('\n📁 Output files:');
    console.log(`   - Full video: ${demo.config.outputVideo}`);
    console.log(`   - 30-sec version: ${demo.config.outputVideo.replace('.mp4', '_30sec.mp4')}`);
    console.log(`   - Screenshots: ${demo.screenshots.length} files in ${demo.config.screenshotDir}/`);
    
  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    process.exit(1);
  } finally {
    clearInterval(progressInterval);
    await demo.cleanup();
  }
}

// Check if app is running
const http = require('http');
const checkApp = () => {
  return new Promise((resolve) => {
    http.get('http://localhost:3000', (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
};

// Main execution
(async () => {
  console.log('🔍 Checking if NoSpoilers is running...');
  const appRunning = await checkApp();
  
  if (!appRunning) {
    console.error('❌ NoSpoilers is not running on http://localhost:3000');
    console.error('   Please start it with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ NoSpoilers is running\n');
  
  await runHeadlessDemo();
})();