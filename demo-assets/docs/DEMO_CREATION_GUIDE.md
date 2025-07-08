# Demo Creation Guide

This guide explains how to create professional demo videos for NoSpoilers.

## Prerequisites

1. **Running Services**
   ```bash
   # Terminal 1: Start the main app
   npm run dev

   # Terminal 2: Start WebSocket server
   npm run dev:ws
   ```

2. **Required Tools**
   - Node.js 18+
   - FFmpeg (`brew install ffmpeg` on macOS)
   - Chrome/Chromium (for Puppeteer)

## Creating a Demo Video

### Method 1: Automated Demo Script (Recommended)

The automated scripts use Puppeteer to simulate real user interactions.

```bash
cd demo-assets/scripts
node perfect-horizontal-demo.js
```

This will:
1. Launch 4 browser instances
2. Create a room and join with 4 users
3. Add movies demonstrating WebSocket sync
4. Show the voting process
5. Display results with IRV rounds
6. Generate a horizontal video with all 4 screens

### Method 2: Convert Existing Video

If you have an existing demo in 2x2 format:

```bash
cd demo-assets/scripts
./create-adjacent-horizontal.sh ../../nospoilers_2x2_grid_demo.mp4
```

This will:
1. Extract frames from the source video
2. Split each frame into 4 quadrants
3. Add user labels to each quadrant
4. Combine horizontally with no gaps
5. Generate optimized MP4

## Customizing Demos

### Changing User Names/Colors

Edit the users array in any demo script:

```javascript
this.users = [
  { name: 'Alex', color: '#FF6B6B' },     // Red
  { name: 'Sam', color: '#4ECDC4' },      // Teal
  { name: 'Jordan', color: '#45B7D1' },   // Blue
  { name: 'Casey', color: '#96CEB4' }     // Green
];
```

### Changing Movies

Edit the movies array:

```javascript
this.movies = [
  'Inception',
  'The Matrix', 
  'Interstellar',
  'Parasite',
  'Everything Everywhere All at Once',
  'The Grand Budapest Hotel'
];
```

### Adjusting Timing

Control the pace of the demo:

```javascript
await this.captureFrames('scene_name', 3); // Capture for 3 frames
await this.wait(1500); // Wait 1.5 seconds
```

### Changing Layout

For horizontal layout (4x1):
```javascript
defaultViewport: { width: 400, height: 800 }
```

For 2x2 grid layout:
```javascript
defaultViewport: { width: 480, height: 720 }
```

## Demo Script Structure

Every demo follows this pattern:

1. **Setup**
   - Initialize browser
   - Create output directory
   - Clear existing data

2. **Room Creation**
   - Navigate to homepage
   - Create new room
   - Get room URL

3. **User Joining**
   - Create 4 browser contexts
   - Join room with each user
   - Add visual indicators

4. **Feature Demonstration**
   - WebSocket sync (movie addition)
   - Voting process
   - Results display
   - IRV rounds expansion

5. **Video Generation**
   - Capture frames at each step
   - Combine frames into video
   - Optimize for web playback

## Frame Capture Best Practices

1. **Consistent Frame Rate**
   ```javascript
   // Capture 3 frames for important moments
   await this.captureFrames('important_scene', 3);
   
   // Capture 1 frame for transitions
   await this.captureFrames('transition', 1);
   ```

2. **Wait for Elements**
   ```javascript
   await page.waitForSelector('input[placeholder="Search for a movie..."]');
   ```

3. **Handle Async Operations**
   ```javascript
   await this.wait(2000); // Wait for TMDB API response
   ```

## Video Processing

### Frame Assembly

Frames are combined using FFmpeg:

```bash
# Horizontal layout (4x1)
ffmpeg -i user1.png -i user2.png -i user3.png -i user4.png \
  -filter_complex "[0:v][1:v][2:v][3:v]hstack=inputs=4" \
  output.png

# 2x2 Grid layout
ffmpeg -i user1.png -i user2.png -i user3.png -i user4.png \
  -filter_complex "[0:v][1:v]hstack[top];[2:v][3:v]hstack[bottom];[top][bottom]vstack" \
  output.png
```

### Video Encoding

```bash
# Create MP4 from frames
ffmpeg -framerate 2 -pattern_type glob -i "frame_*.png" \
  -c:v libx264 -pix_fmt yuv420p output.mp4

# Create 60-second version
ffmpeg -i output.mp4 -t 60 -c copy output_60s.mp4
```

## Troubleshooting

### Common Issues

1. **Timeout Errors**
   - Increase protocol timeout in browser launch
   - Add explicit waits after actions
   - Use smaller viewport sizes

2. **Missing Elements**
   - Verify selectors are correct
   - Add waitForSelector before interactions
   - Check if app is running on correct port

3. **Video Quality Issues**
   - Use consistent frame dimensions
   - Maintain aspect ratio in scaling
   - Use higher bitrate for encoding

### Debug Mode

Add logging to track progress:

```javascript
console.log(`📸 Capturing: ${label}`);
console.log(`✅ ${userName} completed action`);
```

## Production Checklist

Before creating a production demo:

- [ ] Test app locally with demo data
- [ ] Verify WebSocket connection works
- [ ] Clear any existing votes/sessions
- [ ] Check all movie titles load properly
- [ ] Ensure voting flow completes
- [ ] Verify IRV rounds display correctly
- [ ] Test video plays in browser
- [ ] Optimize file size (<5MB ideal)