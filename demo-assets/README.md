# NoSpoilers Demo Assets

This folder contains all demo-related materials for NoSpoilers, including videos, scripts, and documentation.

## 📁 Folder Structure

```
demo-assets/
├── videos/          # Generated demo videos
├── scripts/         # Demo creation scripts
├── docs/           # Documentation and instructions
└── output/         # Temporary output files during generation
```

## 🎬 Available Demo Videos

### Production-Ready Videos

1. **`horizontal_4user_demo.mp4`** (Current Production Video)
   - Layout: 4 phones side-by-side (1600x216)
   - Users: Alex, Sam, Jordan, Casey with color-coded labels
   - Features: WebSocket sync, voting process, live results
   - Duration: ~17 seconds

2. **`perfect_horizontal_4user_demo.mp4`**
   - Enhanced version with user labels at bottom
   - No gaps between phone screens
   - Shows 5+ movies being voted on

3. **`comprehensive_4user_demo.mp4`**
   - 2x2 grid layout version
   - Full feature demonstration

### Other Available Demos

- `nospoilers_4users_demo_final.mp4` - Original 4-user demo
- `nospoilers_2x2_grid_demo.mp4` - 2x2 grid layout
- Various WebSocket and mobile demos

## 🛠️ Demo Scripts

### Main Demo Creation Scripts

1. **`perfect-horizontal-demo.js`**
   - Creates horizontal layout with 4 phones
   - Adds user indicators at bottom
   - Shows full voting flow with 6 movies

2. **`create-adjacent-horizontal.sh`**
   - Converts existing videos to horizontal layout
   - Adds user labels with FFmpeg
   - Quick generation from existing footage

3. **`horizontal-4user-demo.js`**
   - Original horizontal demo script
   - Puppeteer-based automation

### Utility Scripts

- `convert-to-horizontal.sh` - Converts 2x2 to horizontal
- `run-comprehensive-4user-demo.sh` - Runs full demo
- `run-best-4user-demo.sh` - Runs optimized demo

## 📚 Documentation

See the `docs/` folder for:
- Step-by-step demo creation guide
- Script customization instructions
- Video editing guidelines
- Troubleshooting tips

## 🚀 Quick Start

### Generate a New Demo Video

1. Ensure the app is running:
   ```bash
   npm run dev        # In one terminal
   npm run dev:ws     # In another terminal
   ```

2. Run the demo script:
   ```bash
   cd demo-assets/scripts
   node perfect-horizontal-demo.js
   ```

3. Find the output in `demo-assets/output/`

### Convert Existing Video to Horizontal

```bash
cd demo-assets/scripts
./create-adjacent-horizontal.sh input-video.mp4
```

## 🎯 Best Practices

1. **Always test locally** before generating production demos
2. **Keep demos short** - 30-60 seconds is ideal
3. **Show key features** in order:
   - User joining
   - WebSocket sync (movie addition)
   - Voting process
   - Live results
   - IRV elimination rounds

4. **Use consistent styling**:
   - User colors: Alex (Red), Sam (Teal), Jordan (Blue), Casey (Green)
   - Font size: 16-24px for labels
   - Video dimensions: 1600x216 for horizontal layout

## 🔧 Technical Requirements

- Node.js 18+
- FFmpeg 4.0+
- Puppeteer dependencies
- 4GB+ RAM for video generation

## 📝 Notes

- Demo generation can take 2-5 minutes
- Frame captures are stored temporarily in `output/`
- Final videos are optimized for web playback
- Use H.264 codec for maximum compatibility