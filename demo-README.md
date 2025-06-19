# Movie Night Demo Automation - Complete Guide for Claude Code

## Overview
This is an automated demo recorder for the Movie Night voting app. It uses Puppeteer to simulate multiple users interacting with the app, captures screenshots at key moments, and generates a video demo. The script requires zero manual clicking - everything is automated!

## Prerequisites & Installation

### 1. Install Dependencies
```bash
# Core dependencies
npm init -y
npm install puppeteer

# For video generation (install system-wide)
# macOS:
brew install ffmpeg

# Ubuntu/Debian:
sudo apt update
sudo apt install ffmpeg

# Windows (using Chocolatey):
choco install ffmpeg
```

### 2. Directory Structure
```
project/
├── demo-recorder.js      (the main script from artifact)
├── demo-frames/          (created automatically)
├── package.json
└── movie_night_demo.mp4  (output)
```

## Running the Demo

### Basic Usage
```bash
# Ensure your Movie Night app is running on http://localhost:3000
# Then run:
node demo-recorder.js
```

### With Environment Variables
```bash
# Run with custom settings
APP_URL=http://localhost:4000 HEADLESS=true SLOW_MO=0 node demo-recorder.js
```

### Configuration Options
- `APP_URL`: Your app's URL (default: http://localhost:3000)
- `HEADLESS`: Run in headless mode for faster execution (default: false)
- `SLOW_MO`: Milliseconds to slow down Puppeteer actions (default: 50)

## What the Script Does

### Automated Flow:
1. **Creates 4 users**: Sarah, Mike, Ana, and Admin
2. **Scene progression**:
   - Landing page capture
   - User login (Sarah)
   - Movie search via TMDB
   - Adding multiple movies
   - Other users joining and adding movies
   - Ranked choice voting simulation
   - Live results with elimination rounds
   - Winner announcement
   - Admin panel and new event creation
3. **Outputs**:
   - Individual screenshots in `demo-frames/`
   - Full demo video: `movie_night_demo.mp4`
   - 30-second version: `movie_night_demo_30sec.mp4`

## Troubleshooting Guide

### Common Issues & Solutions

#### 1. "Cannot find module 'puppeteer'"
```bash
npm install puppeteer
```

#### 2. "FFmpeg not found" or video creation fails
- Install FFmpeg (see Prerequisites)
- Verify installation: `ffmpeg -version`
- On Windows, ensure FFmpeg is in PATH

#### 3. "Timeout waiting for selector"
Your app's selectors might be different. Update these in the script:
- `#username` → your username input
- `#login-button` → your login button
- `.movie-grid` → your movies container
- `#add-movie-button` → your add movie button
- etc.

To debug selectors:
```javascript
// Add this to capture HTML when selector fails
await page.screenshot({ path: 'debug.png' });
const html = await page.content();
await fs.writeFile('debug.html', html);
```

#### 4. "Connection refused" or "ERR_CONNECTION_REFUSED"
- Ensure your Movie Night app is running
- Check the URL matches your app's address
- Try: `curl http://localhost:3000` to verify

#### 5. Drag and drop not working
The script uses a simplified voting simulation. For real drag-and-drop:
```javascript
// Replace simulateVoting with:
async simulateVoting(page, choices) {
  await page.evaluate((movieChoices) => {
    // Custom drag-drop implementation
    movieChoices.forEach((movie, index) => {
      const movieEl = document.querySelector(`[data-movie-title="${movie}"]`);
      const dropZone = document.querySelector(`#rank-${index + 1}`);
      
      // Simulate drag events
      const dragEvent = new DragEvent('dragstart', { bubbles: true });
      movieEl.dispatchEvent(dragEvent);
      
      const dropEvent = new DragEvent('drop', { bubbles: true });
      dropZone.dispatchEvent(dropEvent);
    });
  }, choices);
}
```

#### 6. Screenshots are blank or wrong size
```javascript
// Adjust viewport in config:
viewport: { width: 1920, height: 1080 }

// Or wait for content to load:
await page.waitForTimeout(2000); // Add extra wait
await page.waitForSelector('.movie-grid', { visible: true });
```

## Customization Guide

### Modify Demo Scenes
To add/remove/modify scenes, edit the `runDemo()` method:

```javascript
// Add a new scene
await this.captureScene('custom_scene_name', {
  user: 'Sarah',           // Which user's view to capture
  annotation: 'New text',  // Overlay text
  duration: 3000,          // How long this frame shows (ms)
  fullPage: false          // Capture full page scroll
});
```

### Change Timing for 30-Second Demo
Adjust durations in capture calls:
```javascript
// Shorter duration = faster demo
await this.captureScene('scene_name', { duration: 1000 }); // 1 second

// Key scenes get more time
await this.captureScene('winner_announcement', { duration: 4000 }); // 4 seconds
```

### Different User Scenarios
```javascript
// Add more users
const david = await this.createUser('David');

// Different viewport for mobile demo
const mobileSarah = await this.createUser('MobileSarah', {
  viewport: { width: 375, height: 667 } // iPhone size
});
```

### Custom Annotations Style
Modify the `addAnnotation` method for different styles:
```javascript
overlay.style.cssText = `
  position: fixed;
  bottom: 40px;  // Change position
  left: 40px;
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%); // Gradient
  // ... rest of styles
`;
```

## App Requirements

Your Movie Night app should have these elements for the demo to work:

### Required Selectors:
- `#username` - Username input field
- `#login-button` - Login button
- `.movie-grid` - Container showing movies
- `#add-movie-button` - Button to add movies
- `#movie-search` - Movie search input
- `.movie-result` - Individual movie results
- `#start-voting` - Start voting button
- `#submit-vote` - Submit vote button
- `#view-results` - View results button
- `/admin` - Admin route
- `#create-new-event` - Create event button

### Required Features:
- Multi-user support (no auth required for demo)
- TMDB search integration
- Movie addition
- Voting interface
- Results display
- Admin panel

## Output Files

After successful run:
1. `demo-frames/` - Folder with all screenshots
2. `movie_night_demo.mp4` - Full demo video
3. `movie_night_demo_30sec.mp4` - Speed-adjusted 30-second version
4. `demo-frames/concat.txt` - FFmpeg concat file (can be deleted)

## Advanced Video Options

### Add intro/outro slides:
```bash
# Create title card (use any image editor)
# Then combine:
ffmpeg -i intro.png -i movie_night_demo.mp4 -i outro.png \
  -filter_complex "[0:v]duration=2[v0];[2:v]duration=2[v2];[v0][1:v][v2]concat=n=3:v=1[out]" \
  -map "[out]" final_demo.mp4
```

### Add background music:
```bash
ffmpeg -i movie_night_demo_30sec.mp4 -i music.mp3 \
  -c:v copy -c:a aac -shortest \
  -af "afade=t=out:st=27:d=3" \
  demo_with_music.mp4
```

### Convert to GIF:
```bash
ffmpeg -i movie_night_demo_30sec.mp4 \
  -vf "fps=10,scale=960:-1:flags=lanczos" \
  -c:v gif demo.gif
```

## Testing Individual Parts

Test specific functions:
```javascript
// Test only login
async function testLogin() {
  const demo = new MovieNightDemoRecorder();
  await demo.init();
  const sarah = await demo.createUser('Sarah');
  await sarah.goto('http://localhost:3000');
  await demo.captureScene('test');
  await demo.cleanup();
}
```

## Environment-Specific Notes

### Running on CI/CD:
```javascript
// Use these settings for CI environments
{
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
}
```

### Docker considerations:
Add to Dockerfile:
```dockerfile
RUN apt-get update && apt-get install -y \
  gconf-service libxext6 libxfixes3 libxi6 libxrandr2 \
  libxrender1 libcairo2 libcups2 libdbus-1-3 libexpat1 \
  libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 \
  libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 \
  libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 \
  libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxss1 \
  libxtst6 libappindicator1 libnss3 libasound2 libatk1.0-0 \
  libc6 ca-certificates fonts-liberation lsb-release \
  xdg-utils wget ffmpeg
```

## Quick Checklist Before Running

- [ ] Movie Night app is running on correct port
- [ ] FFmpeg is installed (`ffmpeg -version`)
- [ ] Node.js is installed (`node -v`)
- [ ] Puppeteer is installed (`npm list puppeteer`)
- [ ] `demo-frames` directory has write permissions
- [ ] At least 500MB free disk space for video

## Getting Help

If you encounter issues not covered here:
1. Check the console output for specific error messages
2. Look at the debug screenshots in `demo-frames/`
3. Try running with `HEADLESS=false` to see what's happening
4. Reduce `SLOW_MO` value if the demo is too slow
5. Check that all required selectors exist in your app

Good luck with your demo! 🎬🍿