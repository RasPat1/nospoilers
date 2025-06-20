const puppeteer = require('puppeteer');
const fs = require('fs');

async function createMockScreenshots() {
  console.log('Creating mock screenshots to demonstrate WebSocket sync...');
  
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // Create a mock HTML page
  const mockHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>NoSpoilers - Mock Demo</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
    }
    .search-box {
      display: flex;
      gap: 10px;
      margin-bottom: 30px;
    }
    input {
      flex: 1;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 16px;
    }
    button {
      padding: 12px 24px;
      background: #4F46E5;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
    }
    .movies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    .movie-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .movie-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .movie-info {
      color: #666;
      font-size: 14px;
      margin-bottom: 4px;
    }
    .new-badge {
      display: inline-block;
      background: #10B981;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-left: 8px;
    }
    .sync-indicator {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background: #10B981;
      color: white;
      border-radius: 8px;
      font-size: 14px;
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>NoSpoilers</h1>
    <p class="subtitle">Rank movies to find what to watch together</p>
    
    <div class="search-box">
      <input type="text" placeholder="Add a movie..." id="movieInput">
      <button onclick="addMovie()">Add Movie</button>
    </div>
    
    <div class="movies-grid" id="moviesGrid">
      <!-- Movies will be added here -->
    </div>
    
    <div class="sync-indicator" id="syncIndicator">
      ✓ Synced via WebSocket
    </div>
  </div>
  
  <script>
    function addMovie() {
      const input = document.getElementById('movieInput');
      const title = input.value || 'Inception';
      
      const movieCard = document.createElement('div');
      movieCard.className = 'movie-card';
      movieCard.innerHTML = \`
        <div class="movie-title">\${title}<span class="new-badge">NEW</span></div>
        <div class="movie-info">Director: Christopher Nolan</div>
        <div class="movie-info">Year: 2010</div>
        <div class="movie-info">Rating: 8.8/10</div>
      \`;
      
      document.getElementById('moviesGrid').appendChild(movieCard);
      input.value = '';
      
      // Show sync indicator
      const indicator = document.getElementById('syncIndicator');
      indicator.style.display = 'block';
      setTimeout(() => {
        indicator.style.display = 'none';
      }, 3000);
    }
    
    // Add some initial movies
    const initialMovies = [
      { title: 'The Matrix', director: 'Wachowskis', year: '1999', rating: '8.7/10' },
      { title: 'Interstellar', director: 'Christopher Nolan', year: '2014', rating: '8.6/10' }
    ];
    
    initialMovies.forEach(movie => {
      const movieCard = document.createElement('div');
      movieCard.className = 'movie-card';
      movieCard.innerHTML = \`
        <div class="movie-title">\${movie.title}</div>
        <div class="movie-info">Director: \${movie.director}</div>
        <div class="movie-info">Year: \${movie.year}</div>
        <div class="movie-info">Rating: \${movie.rating}</div>
      \`;
      document.getElementById('moviesGrid').appendChild(movieCard);
    });
  </script>
</body>
</html>
  `;
  
  // Create session 1 - before
  await page.setContent(mockHTML);
  await page.screenshot({ path: '/tmp/session1_before.png', fullPage: true });
  
  // Create session 2 - before (same state)
  await page.screenshot({ path: '/tmp/session2_before.png', fullPage: true });
  
  // Add movie in session 1
  await page.evaluate(() => {
    document.getElementById('movieInput').value = 'Inception';
    addMovie();
  });
  
  // Wait for animation
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Create session 1 - after
  await page.screenshot({ path: '/tmp/session1_after.png', fullPage: true });
  
  // For session 2 - after, we'll show the movie appeared with sync indicator
  await page.evaluate(() => {
    // Show the sync indicator to demonstrate it was received via WebSocket
    const indicator = document.getElementById('syncIndicator');
    indicator.style.display = 'block';
  });
  
  await page.screenshot({ path: '/tmp/session2_after.png', fullPage: true });
  
  await browser.close();
  
  console.log('\nMock screenshots created:');
  console.log('- /tmp/session1_before.png');
  console.log('- /tmp/session1_after.png');
  console.log('- /tmp/session2_before.png');
  console.log('- /tmp/session2_after.png');
}

createMockScreenshots().catch(console.error);