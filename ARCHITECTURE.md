# NoSpoilers Technical Architecture

## Tech Stack

### Frontend
- **React** with TypeScript
- **@dnd-kit** - Drag and drop library (mobile-friendly)
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Data fetching and caching

### Backend
- **Vercel** - Hosting and serverless functions
- **Next.js API Routes** - Backend endpoints
- **Supabase** - PostgreSQL database and authentication

### Deployment
- **Vercel** - Automatic deployments from GitHub
- **Supabase** - Managed PostgreSQL (500MB free tier)

## Database Schema

### Tables

```sql
-- Movies table
movies (
  id: uuid PRIMARY KEY,
  title: TEXT NOT NULL,
  added_by_session: uuid,
  status: TEXT DEFAULT 'candidate', -- 'candidate', 'watched', 'archived'
  created_at: TIMESTAMP DEFAULT NOW()
)

-- Voting sessions
voting_sessions (
  id: uuid PRIMARY KEY,
  status: TEXT DEFAULT 'open', -- 'open', 'closed'
  winner_movie_id: uuid REFERENCES movies(id),
  created_at: TIMESTAMP DEFAULT NOW(),
  closed_at: TIMESTAMP
)

-- User sessions (for anonymous voting)
user_sessions (
  id: uuid PRIMARY KEY,
  created_at: TIMESTAMP DEFAULT NOW()
)

-- Votes table
votes (
  id: uuid PRIMARY KEY,
  voting_session_id: uuid REFERENCES voting_sessions(id),
  user_session_id: uuid REFERENCES user_sessions(id),
  rankings: JSONB, -- Array of movie IDs in order of preference
  created_at: TIMESTAMP DEFAULT NOW(),
  UNIQUE(voting_session_id, user_session_id) -- One vote per session per user
)
```

## Architecture Diagram

```
┌─────────────────┐
│   React App     │
│  (Vercel CDN)   │
└────────┬────────┘
         │
         ├─── API Requests
         │
┌────────▼────────┐
│ Next.js API     │
│ Routes (Vercel) │
└────────┬────────┘
         │
         ├─── Database Queries
         │
┌────────▼────────┐
│   Supabase      │
│  (PostgreSQL)   │
└─────────────────┘
```

## Key Features Implementation

### Anonymous Voting
- Generate UUID session on first visit
- Store in localStorage
- Use for vote tracking without user accounts

### Ranked Choice Voting Algorithm
- Implemented in API route
- Instant runoff calculation
- Returns winner when voting closes

### Real-time Updates (Optional Enhancement)
- Supabase Realtime subscriptions
- Live movie additions
- Vote count updates

## API Endpoints

- `POST /api/movies` - Add a new movie
- `GET /api/movies` - Get all movies for current session
- `POST /api/votes` - Submit ranked vote
- `POST /api/voting-session/close` - Close voting (admin only)
- `GET /api/results` - Get voting results

## Security Considerations

- Rate limiting on API routes
- Session validation for voting
- Admin authentication for closing votes
- Input sanitization for movie titles

## Deployment Process

1. Push to GitHub
2. Vercel auto-deploys from main branch
3. Environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `ADMIN_SECRET` (for admin actions)

## Cost Analysis

**Free Tier Limits:**
- Vercel: 100GB bandwidth, unlimited deployments
- Supabase: 500MB database, 2GB bandwidth, 50k active users
- Total Cost: $0 for typical movie night usage