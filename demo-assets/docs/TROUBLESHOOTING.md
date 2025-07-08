# Troubleshooting Guide

Common issues and solutions when creating NoSpoilers demo videos.

## 🚨 Common Issues

### 1. Browser Launch Failures

**Error:** `Failed to launch the browser process!`

**Solutions:**
```bash
# Install Puppeteer dependencies
npx puppeteer browsers install chrome

# On macOS, if Chrome is in a non-standard location
export PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Use system Chrome instead of Chromium
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true
});
```

### 2. Timeout Errors

**Error:** `Navigation timeout of 30000 ms exceeded`

**Solutions:**
```javascript
// Increase timeout
await page.goto(url, { 
  waitUntil: 'networkidle2',
  timeout: 60000 
});

// Increase protocol timeout
const browser = await puppeteer.launch({
  protocolTimeout: 300000 // 5 minutes
});

// Add explicit waits
await page.waitForSelector('button', { 
  visible: true,
  timeout: 10000 
});
```

### 3. WebSocket Connection Issues

**Error:** `WebSocket connection failed`

**Solutions:**
```bash
# Ensure WebSocket server is running
npm run dev:ws

# Check port availability
lsof -i :8081

# Verify environment variables
echo $WS_PORT
```

### 4. Missing Elements

**Error:** `Cannot find element with selector`

**Solutions:**
```javascript
// Wait for element before interacting
await page.waitForSelector('.movie-card');

// Use more specific selectors
const button = await page.$('button:has-text("Start Voting")');

// Try alternative selectors
const searchInput = await page.$('input[placeholder*="Search"]') || 
                   await page.$('input[type="search"]');
```

### 5. FFmpeg Errors

**Error:** `ffmpeg: command not found`

**Solutions:**
```bash
# Install FFmpeg
brew install ffmpeg  # macOS
apt-get install ffmpeg  # Ubuntu
choco install ffmpeg  # Windows

# Verify installation
ffmpeg -version
```

**Error:** `Invalid frame dimensions`

**Solutions:**
```javascript
// Ensure even dimensions
const width = Math.floor(originalWidth / 2) * 2;
const height = Math.floor(originalHeight / 2) * 2;

// Use scale filter
-vf "scale=1600:-2"  // -2 maintains aspect ratio with even height
```

## 🔍 Debugging Techniques

### 1. Enable Headful Mode

```javascript
const browser = await puppeteer.launch({
  headless: false,  // See what's happening
  slowMo: 100,      // Slow down actions
  devtools: true    // Open DevTools
});
```

### 2. Take Debug Screenshots

```javascript
async debugScreenshot(page, label) {
  await page.screenshot({ 
    path: `debug_${label}_${Date.now()}.png`,
    fullPage: true 
  });
  console.log(`Debug screenshot saved: ${label}`);
}

// Use throughout script
await this.debugScreenshot(page, 'before_click');
await button.click();
await this.debugScreenshot(page, 'after_click');
```

### 3. Log Network Activity

```javascript
page.on('request', request => {
  console.log('Request:', request.url());
});

page.on('response', response => {
  console.log('Response:', response.url(), response.status());
});

page.on('console', msg => {
  console.log('Browser console:', msg.text());
});
```

### 4. Check Element State

```javascript
async function debugElement(page, selector) {
  const element = await page.$(selector);
  if (!element) {
    console.log(`Element not found: ${selector}`);
    return;
  }
  
  const isVisible = await element.isVisible();
  const isEnabled = await element.isEnabled();
  const boundingBox = await element.boundingBox();
  
  console.log(`Element ${selector}:`, {
    visible: isVisible,
    enabled: isEnabled,
    position: boundingBox
  });
}
```

## 🛠️ Performance Issues

### Slow Frame Capture

**Problem:** Frame capture takes too long

**Solutions:**
```javascript
// Reduce viewport size
defaultViewport: { width: 360, height: 640 }

// Capture fewer frames
await this.captureFrames('scene', 1);  // Instead of 3

// Use JPEG for frames (smaller files)
await page.screenshot({ 
  path: filename,
  type: 'jpeg',
  quality: 90 
});
```

### Memory Leaks

**Problem:** Process runs out of memory

**Solutions:**
```javascript
// Close pages after use
await page.close();

// Clear browser cache
await page.evaluate(() => {
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
});

// Garbage collection hint
if (global.gc) {
  global.gc();
}
```

### Large Output Files

**Problem:** Video files are too large

**Solutions:**
```bash
# Optimize with FFmpeg
ffmpeg -i input.mp4 -c:v libx264 -crf 28 -preset slow output.mp4

# Reduce resolution
ffmpeg -i input.mp4 -vf scale=1280:-2 output.mp4

# Limit bitrate
ffmpeg -i input.mp4 -b:v 1M output.mp4
```

## 🔧 Environment-Specific Issues

### Docker/CI Environment

```javascript
const browser = await puppeteer.launch({
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-first-run',
    '--no-zygote',
    '--single-process'
  ]
});
```

### macOS Specific

```bash
# If getting "cannot open display" errors
export DISPLAY=:0

# Permission issues
sudo chmod -R 755 /usr/local/lib/node_modules/puppeteer/.local-chromium
```

### Windows Specific

```javascript
// Use Windows-compatible paths
const outputDir = path.join(__dirname, 'output').replace(/\\/g, '/');

// Handle long path names
const browser = await puppeteer.launch({
  userDataDir: 'C:\\temp\\puppeteer'
});
```

## 📊 Validation Checks

### Pre-Demo Checklist

```javascript
async function validateEnvironment() {
  // Check app is running
  try {
    const response = await fetch('http://localhost:8080');
    if (!response.ok) throw new Error('App not responding');
  } catch (e) {
    console.error('❌ App is not running on port 8080');
    process.exit(1);
  }
  
  // Check WebSocket
  try {
    const ws = new WebSocket('ws://localhost:8081');
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
      setTimeout(reject, 5000);
    });
    ws.close();
  } catch (e) {
    console.error('❌ WebSocket server not running on port 8081');
    process.exit(1);
  }
  
  // Check FFmpeg
  try {
    await execPromise('ffmpeg -version');
  } catch (e) {
    console.error('❌ FFmpeg not installed');
    process.exit(1);
  }
  
  console.log('✅ Environment validated');
}
```

### Post-Demo Validation

```javascript
async function validateOutput(videoPath) {
  // Check file exists
  if (!fs.existsSync(videoPath)) {
    throw new Error('Video file not created');
  }
  
  // Check file size
  const stats = fs.statSync(videoPath);
  if (stats.size === 0) {
    throw new Error('Video file is empty');
  }
  
  // Check video properties
  const { stdout } = await execPromise(
    `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of json ${videoPath}`
  );
  
  const info = JSON.parse(stdout);
  console.log('Video info:', info.streams[0]);
  
  return info.streams[0];
}
```

## 📞 Getting Help

If you're still experiencing issues:

1. Check the [demo-frames/CLAUDE.md](../CLAUDE.md) for architecture details
2. Review existing demo scripts for working examples
3. Enable verbose logging and share the output
4. Check browser console for client-side errors
5. Verify all dependencies are up to date

### Debug Mode Script

```bash
#!/bin/bash
# debug-demo.sh

echo "🔍 Debug Mode Enabled"

# Check services
echo "Checking app..."
curl -s http://localhost:8080 > /dev/null && echo "✅ App running" || echo "❌ App not running"

echo "Checking WebSocket..."
curl -s http://localhost:8081 > /dev/null && echo "✅ WebSocket running" || echo "❌ WebSocket not running"

# Check dependencies
echo "Checking FFmpeg..."
ffmpeg -version > /dev/null 2>&1 && echo "✅ FFmpeg installed" || echo "❌ FFmpeg missing"

echo "Checking Puppeteer..."
node -e "require('puppeteer')" 2>/dev/null && echo "✅ Puppeteer installed" || echo "❌ Puppeteer missing"

# Run demo with logging
echo "Running demo with debug logging..."
DEBUG=* node perfect-horizontal-demo.js 2>&1 | tee debug.log
```