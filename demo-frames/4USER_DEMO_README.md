# 4-User Comprehensive Demo Scripts

This directory contains comprehensive demo scripts that showcase all NoSpoilers features with 4 users displayed side-by-side.

## Available Demo Scripts

### 1. `comprehensive-4-user-websocket-demo.js`
The main comprehensive demo showing all requested features:
- 4 users displayed in a 2x2 grid
- WebSocket real-time synchronization
- Multiple users adding movies simultaneously
- Users voting at different speeds
- One user submitting before others
- Live results updating
- IRV elimination rounds expansion

### 2. `enhanced-4user-websocket-demo.js`
An enhanced version with:
- Visual annotations and captions
- User indicators and highlights
- Better timing and pacing
- Clearer demonstration of features
- Frame duplication for emphasis

## Running the Demos

### Prerequisites
1. Start the NoSpoilers app:
   ```bash
   npm run dev
   ```

2. Start the WebSocket server:
   ```bash
   npm run websocket
   ```

3. Ensure ports 8080 (app) and 8081 (WebSocket) are available

### Run the Comprehensive Demo
```bash
cd demo-frames
./run-comprehensive-4user-demo.sh
```

Or run directly:
```bash
node comprehensive-4-user-websocket-demo.js
```

### Run the Enhanced Demo
```bash
node enhanced-4user-websocket-demo.js
```

## Demo Features Demonstrated

### 1. **4 Users Side by Side**
- 2x2 grid layout showing all 4 users simultaneously
- Each user has their own browser context
- Mobile-sized viewports (480x800) for better visibility
- User names displayed on each quadrant

### 2. **WebSocket Functionality**
- When one user adds a movie, it instantly appears on all screens
- No page refresh needed
- Visual emphasis on the real-time nature
- Clear before/after captures

### 3. **Multiple Movies by Different Users**
- Users add movies at different speeds
- Simultaneous movie additions
- Shows how the system handles concurrent updates
- Demonstrates conflict-free collaboration

### 4. **Voting at Different Speeds**
- Alex votes quickly and submits first
- Sam votes at medium speed
- Jordan votes slowly and carefully
- Casey takes the longest time
- Shows how early voters see live results

### 5. **Live Results Updates**
- Results page updates in real-time
- Vote counts change as new votes come in
- Percentages update dynamically
- No refresh needed to see updates

### 6. **IRV Elimination Rounds**
- Toggle button to expand elimination details
- Shows vote transfers between rounds
- Displays eliminated candidates
- Explains the winner determination

## Video Output

Each demo generates:
- Full-length video (all scenes)
- 60-second highlight version
- Individual frame captures
- Composite frames with annotations

Videos are saved to:
- `demo-frames/[demo-name].mp4` - Full video
- `demo-frames/[demo-name]_60s.mp4` - 60-second version
- `public/videos/[demo-name].mp4` - For web display

## Customization

### Changing User Names/Movies
Edit the `users` array in the demo script:
```javascript
this.users = [
  { 
    name: 'YourName', 
    movies: ['Movie 1', 'Movie 2'],
    votingSpeed: 'fast', // fast, medium, slow
    votingPattern: ['Movie preferences in order']
  },
  // ... more users
];
```

### Adjusting Timing
- Frame rate: Change `framerate` in ffmpeg commands
- Capture delays: Modify `wait()` calls
- Typing speed: Adjust `slowType()` parameters

### Adding Annotations
In the enhanced demo, use:
```javascript
await this.captureFrame('label', {
  annotation: 'Your annotation text',
  duration: 3, // seconds to display
  highlight: { 
    userIndex: 0, 
    selector: '.element-to-highlight' 
  }
});
```

## Troubleshooting

### "App not running" error
- Ensure `npm run dev` is running
- Check that port 8080 is accessible
- Try `http://localhost:8080` in browser

### WebSocket not syncing
- Start WebSocket server: `npm run websocket`
- Check port 8081 is available
- Look for WebSocket errors in console

### Video generation fails
- Install ffmpeg: `brew install ffmpeg`
- Check disk space for video output
- Ensure all frames were captured

### Frames missing users
- Check all browser contexts loaded
- Increase timeout values
- Verify selectors match your UI

## Demo Script Flow

1. **Setup Phase**
   - Clear existing data
   - Create movie night room
   - All 4 users join

2. **WebSocket Demo**
   - Single user adds movie
   - Instant sync to all screens
   - Clear visual indication

3. **Collaborative Adding**
   - Multiple users add movies
   - Different speeds and timing
   - Conflict-free updates

4. **Voting Phase**
   - Admin starts voting
   - Users rank movies
   - Different completion times

5. **Results Phase**
   - Live updates as votes come in
   - IRV rounds expansion
   - Winner announcement

## Best Practices

1. **Clear the database** before demos to ensure consistent results
2. **Test the demo** once before recording to verify all features work
3. **Monitor the console** for any errors during recording
4. **Keep demos under 2 minutes** for best engagement
5. **Use annotations** to explain what's happening
6. **Highlight key moments** with visual indicators

## Future Enhancements

- [ ] Add voice-over narration support
- [ ] Create mobile-specific demo
- [ ] Add network latency simulation
- [ ] Show database state visualization
- [ ] Create split-screen comparisons
- [ ] Add performance metrics overlay