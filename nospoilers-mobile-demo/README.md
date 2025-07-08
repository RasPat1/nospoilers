# NoSpoilers Mobile 4-User Demo

This demo showcases NoSpoilers' real-time collaboration and ranked choice voting features using 4 mobile users with cinephile personas.

## 🎬 Demo Features

### User Personas
- 🎭 **Art House** (Red) - Admin user who appreciates experimental cinema
- 💕 **Rom-Com Fan** (Teal) - Loves romantic comedies and feel-good films
- 🚀 **Sci-Fi Nerd** (Blue) - Passionate about science fiction and futuristic themes
- 🎬 **Indie Buff** (Green) - Seeks out independent and underground films

### Key Demonstrations

1. **WebSocket Real-time Sync**
   - Art House adds "Everything Everywhere All at Once"
   - Movie appears "everywhere all at once" on all screens (clever wordplay!)
   - Multiple users add fringe/indie movies simultaneously

2. **Voting Process**
   - Users rank their favorite movies
   - Shows someone changing their mind (re-ranking)
   - Staggered vote submission shows live updates

3. **Instant Runoff Voting (IRV)**
   - Visualizes elimination rounds
   - Explains how ranked choice finds majority winner
   - Shows vote redistribution process

## 🚀 Running the Demo

### Prerequisites
- Node.js 18+
- FFmpeg (`brew install ffmpeg` on macOS)
- NoSpoilers app running:
  ```bash
  npm run dev      # Main app on port 8080
  npm run dev:ws   # WebSocket server on port 8081
  ```

### Generate Demo Video
```bash
cd nospoilers-mobile-demo/scripts
node mobile-4user-demo.js
```

### Output Files
After running, you'll find in the `output/` folder:
- `mobile-4user-demo-full.mp4` - Complete demo (~75 seconds)
- `mobile-4user-demo-60s.mp4` - 60-second version
- `mobile-4user-demo-30s.mp4` - 30-second version
- `mobile-4user-demo-thumbnail.jpg` - Video thumbnail

## 🎨 Visual Design

- **Mobile viewport**: 400x800 pixels per user
- **Layout**: 4 phones horizontally adjacent (no gaps)
- **User badges**: Emoji + name with distinct colors
- **Frame rate**: 2 FPS for smooth playback

## 🎯 Demo Script Flow

1. **Setup** (10s)
   - All users join the voting room
   - User indicators appear at bottom

2. **Adding Movies** (20s)
   - "Everything Everywhere" sync demonstration
   - Each user adds a fringe/indie film
   - Real-time updates across all screens

3. **Voting** (25s)
   - Admin starts voting phase
   - Users rank movies by preference
   - Someone changes their mind
   - Staggered submissions

4. **Results & IRV** (20s)
   - Live vote counting
   - IRV elimination rounds explained
   - Majority winner determination

## 🛠️ Customization

### Changing Users
Edit the `users` array in the script:
```javascript
this.users = [
  { name: 'Art House', emoji: '🎭', color: '#FF6B6B', isAdmin: true },
  // Add your custom users here
];
```

### Changing Movies
Edit the `movies` array:
```javascript
this.movies = [
  { title: 'Everything Everywhere All at Once', addedBy: 0 },
  // Add your movie selections
];
```

### Adjusting Timing
- Change frame capture rate in `captureScene()`
- Adjust wait times between actions
- Modify video frame rate in FFmpeg commands

## 📝 Notes

- Demo requires ~2GB of disk space for temporary frames
- Generation takes 3-5 minutes depending on system
- Frames are cleaned up after video creation
- Videos are optimized for web playback (H.264)