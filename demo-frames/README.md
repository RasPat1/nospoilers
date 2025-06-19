# NoSpoilers Demo Recorder

This directory contains the automated demo recorder for the NoSpoilers voting app.

## Quick Start

1. **Install dependencies:**
   ```bash
   cd demo-frames
   npm install
   ```

2. **Ensure NoSpoilers is running:**
   ```bash
   # In the main project directory
   npm run dev
   ```

3. **Run the demo:**
   ```bash
   npm run demo
   ```

## Available Scripts

### Running Demos in Background (Headless)
- `npm run demo:headless` - Desktop demo in background
- `npm run demo:mobile:headless` - Mobile demo in background  
- `npm run demo:all` - Run both demos in background simultaneously

### Running Demos with Visible Browser
- `npm run demo` - Desktop demo with visible browser
- `npm run demo:mobile` - Mobile demo with visible browser

### Advanced Options
- `HEADLESS=true node demo-recorder.js` - Force headless mode
- `SLOW_MO=0 node demo-recorder.js` - Run at full speed

## Requirements

- Node.js 14+
- FFmpeg installed for video generation:
  ```bash
  # macOS
  brew install ffmpeg
  
  # Ubuntu/Debian
  sudo apt install ffmpeg
  
  # Windows
  choco install ffmpeg
  ```

## Output

After running, you'll find:
- Individual screenshots in `demo-frames/` directory
- `movie_night_demo.mp4` - Full demo video
- `movie_night_demo_30sec.mp4` - 30-second version

## Troubleshooting

1. **"Cannot find module 'puppeteer'"**
   - Run `npm install` in this directory

2. **"Connection refused"**
   - Make sure NoSpoilers is running on http://localhost:3000

3. **Movie search not working**
   - Check that TMDB API is configured in the main app

4. **FFmpeg errors**
   - Ensure FFmpeg is installed: `ffmpeg -version`

## Customization

Edit `demo-recorder.js` to:
- Change timing between scenes
- Add/remove movies
- Modify annotations
- Adjust user behavior