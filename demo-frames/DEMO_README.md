# NoSpoilers Comprehensive Demo

This demo showcases all core features of NoSpoilers through 8 independent scenes.

## Features Highlighted

### Visual Enhancements
- **Red circular click indicators** - Every click shows a pulsing red circle
- **Slow typing animation** - Text input is visible character by character  
- **Multiple viewports** - Desktop (1920x1080) and mobile (390x844)
- **Scene transitions** - Clear breaks between different parts

### Scenes Breakdown

#### Scene 1: The Problem (15 seconds)
- Landing page introduction
- "What should we watch?" dilemma
- Start voting flow

#### Scene 2: Sarah Adds Movies (45 seconds)
- TMDB search with autocomplete
- Rich movie data (poster, rating, cast)
- Manual movie entry
- Offline capability demonstration

#### Scene 3: Mike Joins (30 seconds)
- Multi-user real-time updates
- Duplicate prevention
- Error message handling
- Adding multiple movies

#### Scene 4: Emma Votes (30 seconds)
- Mobile interface
- Touch-friendly movie selection
- Ranking interface
- Vote submission

#### Scene 5: Live Results (30 seconds)
- Real-time vote counting
- Dynamic ranking updates
- Multiple voters joining
- Live leaderboard

#### Scene 6: Alex Joins Late (30 seconds)
- Late participation
- Adding new movies after voting started
- Complete ranking of all movies
- Vote prevention (already voted)

#### Scene 7: Admin Closes Voting (30 seconds)
- Admin panel access
- Voting statistics
- Session management
- Close voting action

#### Scene 8: Winner Announcement (15 seconds)
- Final results with IRV
- Winner details
- Complete movie information
- Transparent algorithm

## Running the Demo

### Full Demo
```bash
./demo-frames/run-comprehensive-demo.sh
```

### Individual Scenes
```bash
# Re-record just Scene 2 (Sarah adds movies)
./demo-frames/run-comprehensive-demo.sh scene 2

# Re-record just Scene 5 (Live results)  
./demo-frames/run-comprehensive-demo.sh scene 5
```

### Prerequisites
- Node.js and npm installed
- FFmpeg installed
- Development server running (`npm run dev:all`)

### Output
- Individual scene videos in `demo-output/comprehensive/`
- Combined full demo: `nospoilers_complete_demo.mp4`
- Frame rate: 2 FPS for smaller file size
- Resolution: 1920x1080 (scaled for all scenes)

## Technical Details

### Click Visualization
Every mouse click shows:
- 60px red circle at click point
- Semi-transparent red fill
- Pulse animation (0.6s)
- No interference with actual clicks

### Scene Independence
- Each scene can be re-recorded individually
- State is preserved between scenes
- Clean setup for each recording session

### Mobile Simulation
- Scene 4 uses iPhone 14 Pro viewport (390x844)
- Shows mobile-specific UI elements
- Touch-friendly interface demonstration

### Error Handling
- Shows duplicate movie prevention
- Already voted message
- Manual entry fallback

## Tips for Recording

1. **Server Setup**: Make sure `npm run dev:all` is running
2. **Clean State**: Run `npm run test:setup` for fresh database
3. **Individual Scenes**: Use scene numbers 1-8 for specific re-records
4. **File Size**: Videos use CRF 23 for good quality/size balance
5. **Bell Alert**: Terminal bell rings when recording completes

## Customization

Edit `comprehensive-demo.js` to:
- Change viewport sizes
- Adjust typing speed
- Modify click indicator style
- Add more scenes
- Change frame rate