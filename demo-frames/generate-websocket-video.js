const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function generateWebSocketVideo() {
  const frameDir = path.join(__dirname, 'websocket-demo-frames');
  const outputDir = __dirname;
  
  try {
    // Get all frame files
    const files = await fs.readdir(frameDir);
    const frameFiles = files.filter(f => f.endsWith('.png'));
    
    // Group frames by frame number
    const frameGroups = {};
    for (const file of frameFiles) {
      const match = file.match(/frame_(\d{4})/);
      if (match) {
        const frameNum = match[1];
        if (!frameGroups[frameNum]) frameGroups[frameNum] = [];
        frameGroups[frameNum].push(file);
      }
    }
    
    console.log(`Found ${Object.keys(frameGroups).length} frame groups`);
    
    // Create composite frames
    console.log('Creating composite frames...');
    let compositeCount = 0;
    
    for (const [frameNum, files] of Object.entries(frameGroups)) {
      const outputFile = path.join(frameDir, `composite_${frameNum}.png`);
      
      if (files.length === 4) {
        // Create 2x2 grid
        const inputs = files
          .sort() // Ensure consistent order
          .slice(0, 4)
          .map(f => `-i "${path.join(frameDir, f)}"`)
          .join(' ');
        
        const cmd = `ffmpeg -y ${inputs} -filter_complex "[0:v][1:v]hstack=inputs=2[top];[2:v][3:v]hstack=inputs=2[bottom];[top][bottom]vstack=inputs=2,scale=1920:1080[v]" -map "[v]" "${outputFile}"`;
        
        try {
          await execPromise(cmd);
          compositeCount++;
        } catch (error) {
          console.error(`Failed to create composite ${frameNum}:`, error.message);
        }
      } else {
        // Single frame - just use the first one
        const sourceFile = path.join(frameDir, files[0]);
        await fs.copyFile(sourceFile, outputFile);
        compositeCount++;
      }
    }
    
    console.log(`Created ${compositeCount} composite frames`);
    
    // Generate main video
    console.log('Generating main video...');
    const mainVideoPath = path.join(outputDir, 'nospoilers_websocket_demo.mp4');
    const videoCmd = `ffmpeg -y -framerate 8 -pattern_type glob -i "${frameDir}/composite_*.png" -c:v libx264 -pix_fmt yuv420p -preset medium -crf 23 "${mainVideoPath}"`;
    
    await execPromise(videoCmd);
    console.log(`✅ Main video created: ${mainVideoPath}`);
    
    // Get video info
    const infoCmd = `ffmpeg -i "${mainVideoPath}" 2>&1 | grep Duration`;
    const { stdout: durationInfo } = await execPromise(infoCmd);
    console.log(`Video info: ${durationInfo.trim()}`);
    
    // Generate 30-second version
    console.log('Generating 30-second version...');
    const shortVideoPath = path.join(outputDir, 'nospoilers_websocket_demo_30s.mp4');
    const shortCmd = `ffmpeg -y -i "${mainVideoPath}" -t 30 -c copy "${shortVideoPath}"`;
    
    await execPromise(shortCmd);
    console.log(`✅ 30-second version created: ${shortVideoPath}`);
    
    // Generate thumbnail
    console.log('Generating thumbnail...');
    const thumbnailPath = path.join(outputDir, 'websocket_demo_thumbnail.jpg');
    const thumbCmd = `ffmpeg -y -i "${mainVideoPath}" -ss 00:00:02 -vframes 1 "${thumbnailPath}"`;
    
    await execPromise(thumbCmd);
    console.log(`✅ Thumbnail created: ${thumbnailPath}`);
    
    console.log('\n🎉 WebSocket demo video generation complete!');
    console.log('\nGenerated files:');
    console.log(`  - Main video: ${mainVideoPath}`);
    console.log(`  - 30s version: ${shortVideoPath}`);
    console.log(`  - Thumbnail: ${thumbnailPath}`);
    
  } catch (error) {
    console.error('Error generating video:', error);
  }
}

// Run the generator
generateWebSocketVideo().catch(console.error);