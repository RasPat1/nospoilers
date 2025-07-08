const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const fs = require('fs').promises;
const path = require('path');

async function createQuickDemo() {
  console.log('Creating quick demo video...');
  
  // Use existing screenshots if available
  const frames = [
    'demo-output/test-homepage.png',
    'demo-output/test-vote.png',
    'demo-output/comprehensive/scene1_problem/frame_0000.png',
    'demo-output/comprehensive/scene1_problem/frame_0001.png',
    'demo-output/comprehensive/scene2_sarah/frame_0000.png',
    'demo-output/comprehensive/scene2_sarah/frame_0001.png'
  ];
  
  // Create frames directory
  await fs.mkdir('demo-output/quick-frames', { recursive: true });
  
  // Copy and rename frames
  let frameIndex = 0;
  for (const frame of frames) {
    try {
      await fs.access(frame);
      const dest = `demo-output/quick-frames/frame_${String(frameIndex).padStart(4, '0')}.png`;
      await fs.copyFile(frame, dest);
      console.log(`Copied ${frame} -> ${dest}`);
      frameIndex++;
    } catch (e) {
      console.log(`Skipping missing frame: ${frame}`);
    }
  }
  
  if (frameIndex === 0) {
    console.error('No frames found to create video!');
    return;
  }
  
  // Create video from frames
  console.log('\nCreating video from frames...');
  try {
    await execPromise(
      `ffmpeg -y -framerate 1 -i demo-output/quick-frames/frame_%04d.png ` +
      `-c:v libx264 -r 30 -pix_fmt yuv420p -crf 23 ` +
      `-vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" ` +
      `demo-output/quick-demo.mp4`
    );
    
    console.log('✅ Created demo-output/quick-demo.mp4');
    
    // Copy to comprehensive location
    await fs.mkdir('demo-output/comprehensive', { recursive: true });
    await fs.copyFile(
      'demo-output/quick-demo.mp4',
      'demo-output/comprehensive/nospoilers_complete_demo.mp4'
    );
    
    console.log('✅ Copied to comprehensive location for homepage');
    
  } catch (error) {
    console.error('Failed to create video:', error.message);
  }
}

createQuickDemo();