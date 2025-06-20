# Demo Video Integration Guide

## Overview
The NoSpoilers homepage now includes interactive demo video players to showcase the app's features.

## Video Locations

### Development (Local Testing)
- **Demo Output**: `demo-output/comprehensive/`
  - Main demo: `nospoilers_complete_demo.mp4`
  - Individual scenes: `scene1_problem.mp4`, `scene2_sarah.mp4`, etc.

### Production (Deployed Site)
- **Public Videos**: `public/videos/`
- **Thumbnails**: `public/demo-thumbnails/`

## Homepage Integration

### Main Demo Video
Located in the "See It In Action" section:
- Full comprehensive demo (all 8 scenes combined)
- Large video player with play/pause controls
- Fallback to placeholder if video not found

### Scene Gallery
Located in the "Feature Walkthrough" section:
- 8 individual scene videos
- Grid layout with thumbnails
- Click to play individual scenes
- Duration badges on each scene

## Preparing Videos for Deployment

1. **Generate Demo Videos**:
   ```bash
   node demo-frames/comprehensive-demo.js
   ```

2. **Review Videos**:
   - Check `demo-output/comprehensive/` for generated videos
   - Ensure all scenes rendered correctly

3. **Deploy to Public Folder** (after approval):
   ```bash
   ./scripts/prepare-demo-videos.sh deploy
   ```

## Video Player Features

### Main Video Player
- Play/pause button overlay
- Error handling with fallback
- Poster image support
- Responsive sizing

### Scene Gallery
- Thumbnail previews
- Hover effects
- Active scene highlighting
- Duration display
- Automatic playback on selection

## Adding New Demo Scenes

1. Update `demo-frames/comprehensive-demo.js` with new scene
2. Add scene metadata to `components/DemoVideoGallery.tsx`
3. Generate new videos
4. Deploy to public folder

## Video Formats
- **Primary**: MP4 (H.264)
- **Fallback**: WebM (optional)
- **Thumbnails**: JPEG

## File Size Optimization
- Videos use CRF 23 for quality/size balance
- 2 FPS for demo videos (smaller files)
- 1920x1080 resolution

## Troubleshooting

### Videos Not Playing
1. Check browser console for errors
2. Verify video files exist in `public/videos/`
3. Check MIME types are correct
4. Ensure CORS headers allow video playback

### Missing Thumbnails
- Thumbnails auto-generate from first frame
- Fallback to placeholder if generation fails
- Can manually add thumbnails to `public/demo-thumbnails/`