# NoSpoilers - Complete Feature List & Behaviors

This document comprehensively lists all features, behaviors, and edge cases implemented in NoSpoilers, compiled from tests and documentation.

## Core Features

### 1. Movie Management
- **Add Movies via TMDB Search**
  - Autocomplete search functionality
  - Rich movie data fetching (poster, rating, cast, director, plot, release date, genres)
  - Automatic metadata population
  
- **Manual Movie Entry**
  - Add movies with just a title (no internet required)
  - Works offline without TMDB API
  - Supports obscure/indie films not in TMDB

- **Duplicate Prevention**
  - Prevents adding same movie twice (based on TMDB ID)
  - Shows error message if movie already exists
  - Returns existing movie data on duplicate attempt

- **Movie Display**
  - Shows all candidate movies
  - Displays rich movie details when available
  - Gracefully handles missing metadata
  - Orders by creation date (newest first)

### 2. Voting System

- **Ranked Choice Voting (IRV)**
  - Instant Runoff Voting algorithm implementation
  - Majority winner detection
  - Elimination rounds when no majority
  - Handles partial ballots correctly

- **User Interface**
  - Mobile-first responsive design
  - Click to add movies to ranking
  - Drag-and-drop reordering (desktop)
  - Button-based reordering (mobile)
  - Visual feedback for all interactions
  - Disabled states for invalid actions

- **Voting Rules**
  - One vote per session
  - Must rank at least one movie
  - Can rank subset of available movies (partial ballot)
  - Cannot submit empty rankings
  - Points awarded by position (1st = most points)

- **Session Management**
  - Automatic session creation
  - UUID-based session tracking
  - Session persistence via localStorage
  - Prevents duplicate voting

### 3. Results & Live Updates

- **Real-time Results**
  - Live vote counting
  - Auto-refresh every 5 seconds
  - WebSocket updates (when enabled)
  - Shows current rankings and points

- **Winner Determination**
  - IRV algorithm calculates true winner
  - Shows elimination rounds
  - Handles ties appropriately
  - Displays final winner with full details

- **Results Display**
  - Total vote count
  - Points per movie
  - Ranking positions
  - Winner announcement
  - Movie details (poster, cast, director)

### 4. Admin Features

- **Protected Access**
  - URL parameter access (?admin=password)
  - Username/password authentication
  - Session-based admin state

- **Admin Controls**
  - View voting statistics
  - Close voting sessions
  - Reset voting data
  - Delete specific movies
  - View all sessions

- **Statistics Dashboard**
  - Total votes cast
  - Number of participants
  - Movies per session
  - Voting session status

### 5. Multi-Environment Support

- **Production (Supabase)**
  - Cloud PostgreSQL database
  - Row Level Security
  - Real-time subscriptions

- **Development (Local PostgreSQL)**
  - Docker Compose setup
  - Local database instance
  - Hot reloading

- **Test Environment**
  - Isolated test database
  - Demo recording support
  - No production data pollution

## Edge Cases & Behaviors

### Error Handling
- **No Internet Connection**: Falls back to manual movie entry
- **TMDB API Unavailable**: Graceful degradation, manual entry works
- **Duplicate Vote Attempt**: Shows "Thanks for voting!" message
- **Empty Rankings**: Validation prevents submission
- **Missing Movie Data**: Displays available fields only

### Voting Edge Cases
- **No Votes Cast**: Results show 0 votes, no winner
- **Single Vote**: Winner determined immediately
- **All Tied**: Tie-breaking logic handles equal points
- **Partial Rankings**: Only ranked movies receive points
- **Session Expired**: Creates new session automatically

### Data Integrity
- **Movie Deduplication**: TMDB ID prevents exact duplicates
- **Session Validation**: Ensures one vote per session
- **Concurrent Users**: Handles multiple simultaneous voters
- **Race Conditions**: Proper transaction handling

### UI/UX Behaviors
- **Loading States**: Shows spinners during data fetches
- **Error Messages**: User-friendly error descriptions
- **Success Feedback**: Confirmation after actions
- **Responsive Design**: Adapts to all screen sizes
- **Accessibility**: Keyboard navigation, ARIA labels

## API Behaviors

### Movies API
- **GET /api/movies**: Returns candidates ordered by date
- **POST /api/movies**: Creates movie, checks duplicates
- **DELETE /api/movies/[id]**: Admin-only deletion

### Voting API
- **POST /api/votes**: Validates and stores rankings
- **GET /api/votes/results**: Calculates IRV results
- **GET /api/votes/count**: Returns current vote total
- **POST /api/votes/clear**: Resets user's vote

### Session API
- **GET /api/voting-session**: Gets current session
- **POST /api/voting-session**: Creates new session
- **POST /api/voting-session/close**: Ends voting

### Admin API
- **POST /api/admin/auth**: Validates credentials
- **POST /api/admin/reset**: Clears session data
- **GET /api/admin/stats**: Returns statistics

## Performance Features
- **Optimistic Updates**: Immediate UI feedback
- **Caching**: Reduces redundant API calls
- **Lazy Loading**: Images load on demand
- **Debounced Search**: Prevents excessive API calls
- **Connection Pooling**: Efficient database usage

## Security Features
- **Input Validation**: All inputs sanitized
- **Rate Limiting**: Prevents API abuse
- **Session Security**: HTTP-only cookies (when applicable)
- **Admin Protection**: Password-based access
- **SQL Injection Prevention**: Parameterized queries

## Deployment Features
- **Auto-Deploy**: GitHub push triggers deployment
- **Environment Variables**: Secure configuration
- **Health Checks**: Monitor application status
- **Error Logging**: Track issues in production
- **Rollback Support**: Version control integration