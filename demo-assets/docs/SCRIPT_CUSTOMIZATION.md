# Script Customization Guide

This guide explains how to customize demo scripts for different scenarios.

## Core Script Components

### 1. User Configuration

```javascript
this.users = [
  { name: 'Alex', color: '#FF6B6B' },     // Admin user
  { name: 'Sam', color: '#4ECDC4' },      
  { name: 'Jordan', color: '#45B7D1' },   
  { name: 'Casey', color: '#96CEB4' }     
];
```

**Customization Options:**
- Change names to match your audience
- Adjust colors for brand consistency
- Add more users (up to 6 work well)

### 2. Movie Selection

```javascript
this.movies = [
  'Inception',              // Sci-fi classic
  'The Matrix',            // Action favorite
  'Interstellar',          // Space epic
  'Parasite',              // Award winner
  'Everything Everywhere',  // Recent hit
  'Grand Budapest Hotel'   // Quirky choice
];
```

**Tips:**
- Include variety of genres
- Mix classic and recent films
- Ensure TMDB has good data for each

### 3. Voting Patterns

```javascript
// Different voting strategies
await this.voteForUser(0, [1, 3, 5]); // Strategic voter
await this.voteForUser(1, [2, 4, 6]); // Different preferences
await this.voteForUser(2, [3, 1, 2]); // Compromise voter
await this.voteForUser(3, [4, 5, 1]); // Contrarian
```

**Patterns to Demonstrate:**
- Consensus building (similar top choices)
- Split decisions (very different preferences)
- Strategic voting (ranking to block movies)
- Late joiners (partial rankings)

## Scene Customization

### WebSocket Demonstration

```javascript
// Quick sync demo
await this.addMovie(0, 'Inception');
await this.captureFrames('instant_sync', 3);

// Concurrent additions
await Promise.all([
  this.addMovie(1, 'The Matrix'),
  this.addMovie(2, 'Interstellar')
]);
await this.captureFrames('concurrent_adds', 2);
```

### Voting Process Variations

```javascript
// Fast voter
async fastVoter(userIndex) {
  await this.voteForUser(userIndex, [1, 2, 3]);
  await this.wait(500);
  await this.submitVote(userIndex);
}

// Thoughtful voter
async thoughtfulVoter(userIndex) {
  await this.voteForUser(userIndex, [1]);
  await this.wait(2000);
  await this.voteForUser(userIndex, [1, 3]);
  await this.wait(1500);
  await this.voteForUser(userIndex, [1, 3, 2]);
  await this.wait(1000);
  await this.submitVote(userIndex);
}

// Indecisive voter (changes rankings)
async indecisiveVoter(userIndex) {
  await this.voteForUser(userIndex, [1, 2, 3]);
  await this.wait(1000);
  // Clear and re-vote
  await this.clearVotes(userIndex);
  await this.voteForUser(userIndex, [2, 1, 3]);
  await this.submitVote(userIndex);
}
```

### Results Display Options

```javascript
// Basic results
await this.navigateToResults();
await this.captureFrames('final_results', 3);

// With IRV expansion
await this.expandIRVRounds();
await this.captureFrames('irv_details', 4);

// With vote count updates
for (let i = 0; i < 4; i++) {
  await this.submitVote(i);
  await this.captureFrames(`vote_update_${i}`, 2);
}
```

## Layout Configurations

### Horizontal Layout (Side-by-Side)

```javascript
class HorizontalDemo {
  constructor() {
    this.browser = await puppeteer.launch({
      defaultViewport: { 
        width: 400,   // Narrow for side-by-side
        height: 800   // Full phone height
      }
    });
  }
  
  async generateVideo() {
    // Combine horizontally
    const cmd = `ffmpeg ${inputs} -filter_complex 
      "[0:v][1:v][2:v][3:v]hstack=inputs=4" output.mp4`;
  }
}
```

### Grid Layout (2x2)

```javascript
class GridDemo {
  constructor() {
    this.browser = await puppeteer.launch({
      defaultViewport: { 
        width: 480,   // Wider for grid
        height: 720   // Shorter for 2x2
      }
    });
  }
  
  async generateVideo() {
    // Combine in 2x2 grid
    const cmd = `ffmpeg ${inputs} -filter_complex 
      "[0:v][1:v]hstack[top];
       [2:v][3:v]hstack[bottom];
       [top][bottom]vstack" output.mp4`;
  }
}
```

### Vertical Stack (For Mobile)

```javascript
class VerticalDemo {
  constructor() {
    this.browser = await puppeteer.launch({
      defaultViewport: { 
        width: 360,   // Mobile width
        height: 640   // Mobile height
      }
    });
  }
  
  async generateVideo() {
    // Stack vertically
    const cmd = `ffmpeg ${inputs} -filter_complex 
      "[0:v][1:v][2:v][3:v]vstack=inputs=4" output.mp4`;
  }
}
```

## Performance Optimizations

### Parallel Operations

```javascript
// Slow: Sequential
for (let i = 0; i < 4; i++) {
  await this.createUser(i);
}

// Fast: Parallel
await Promise.all(
  [0, 1, 2, 3].map(i => this.createUser(i))
);
```

### Smart Waiting

```javascript
// Wait for specific element
await page.waitForSelector('.movie-card', { 
  visible: true,
  timeout: 5000 
});

// Wait for network idle
await page.waitForLoadState('networkidle');

// Wait for custom condition
await page.waitForFunction(
  () => document.querySelectorAll('.movie-card').length >= 4
);
```

### Memory Management

```javascript
// Clear frames after processing
async cleanupFrames() {
  const files = await fs.readdir(this.outputDir);
  for (const file of files) {
    if (file.endsWith('.png')) {
      await fs.unlink(path.join(this.outputDir, file));
    }
  }
}
```

## Advanced Customizations

### Adding Annotations

```javascript
async addAnnotation(page, text, position) {
  await page.evaluate((text, pos) => {
    const annotation = document.createElement('div');
    annotation.textContent = text;
    annotation.style.cssText = `
      position: fixed;
      ${pos.top ? `top: ${pos.top}px` : `bottom: ${pos.bottom}px`};
      ${pos.left ? `left: ${pos.left}px` : `right: ${pos.right}px`};
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 25px;
      font-size: 18px;
      z-index: 10001;
    `;
    document.body.appendChild(annotation);
  }, text, position);
}

// Usage
await this.addAnnotation(page, '← WebSocket Sync!', { top: 100, right: 20 });
```

### Custom Transitions

```javascript
async fadeTransition(fromLabel, toLabel) {
  // Capture fade out
  for (let opacity = 1; opacity >= 0; opacity -= 0.2) {
    await this.setPageOpacity(opacity);
    await this.captureFrames(`${fromLabel}_fade_${opacity}`, 1);
  }
  
  // Switch content
  await this.switchScene();
  
  // Capture fade in
  for (let opacity = 0; opacity <= 1; opacity += 0.2) {
    await this.setPageOpacity(opacity);
    await this.captureFrames(`${toLabel}_fade_${opacity}`, 1);
  }
}
```

### Dynamic Content

```javascript
async showLiveStats(page) {
  await page.evaluate(() => {
    const stats = document.createElement('div');
    stats.innerHTML = `
      <div style="position: fixed; top: 10px; right: 10px; 
                  background: white; padding: 10px; 
                  border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h3>Live Stats</h3>
        <p>Users: <span id="user-count">4</span></p>
        <p>Movies: <span id="movie-count">6</span></p>
        <p>Votes: <span id="vote-count">0</span></p>
      </div>
    `;
    document.body.appendChild(stats);
  });
  
  // Update stats dynamically
  for (let i = 0; i <= 4; i++) {
    await page.evaluate((count) => {
      document.getElementById('vote-count').textContent = count;
    }, i);
    await this.captureFrames(`stats_update_${i}`, 1);
  }
}
```

## Export Options

### Multiple Formats

```javascript
async exportAllFormats() {
  const base = 'output.mp4';
  
  // Web optimized
  await execPromise(`ffmpeg -i ${base} -c:v libx264 -crf 23 web_optimized.mp4`);
  
  // Social media
  await execPromise(`ffmpeg -i ${base} -t 60 -c copy instagram_60s.mp4`);
  await execPromise(`ffmpeg -i ${base} -t 15 -c copy tiktok_15s.mp4`);
  
  // GIF preview
  await execPromise(`ffmpeg -i ${base} -vf "fps=10,scale=320:-1" -t 5 preview.gif`);
}
```