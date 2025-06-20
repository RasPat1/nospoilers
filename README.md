# NoSpoilers - Movie Night Voting App

A real-time collaborative web app for democratically choosing movies using ranked choice voting with WebSocket synchronization.

## Problem Statement

Movie night shouldn't start with a 45-minute argument about whether to watch "The Princess Bride" for the 47th time or finally give Sarah's obscure documentary about mushrooms a chance. NoSpoilers brings democracy to your couch by using ranked choice voting - so when "Die Hard" inevitably wins, at least everyone had their fair shot at pushing their weird indie film.

## Key Features

### 🎬 Real-Time Collaboration
- **WebSocket Synchronization**: Movies added by one user instantly appear for all connected users
- **Live Results Updates**: Watch votes come in real-time as each person submits
- **Multi-User Sessions**: Up to hundreds of users can participate simultaneously
- **Zero Refresh Required**: Everything updates automatically

### 🗳️ Ranked Choice Voting
- **Fair Algorithm**: Uses instant-runoff voting to find the movie with broadest appeal
- **Better Than First-Past-The-Post**: Avoids ties and finds true consensus
- **Transparent Process**: See elimination rounds to understand how winner was selected
- **Points-Based System**: Higher ranked movies get more points (1st choice = most points)

## Routes Overview

### Public Routes
- `/` - Marketing landing page with interactive demo video
- `/vote` - Main voting interface where users add and rank movies
- `/results` - Live results page showing current rankings and winner

### Admin Routes
- `/admin` - Admin login and dashboard
  - Default Username: `admin` (or set `ADMIN_USERNAME` env var)
  - Default Password: `nospoilers123` (or set `ADMIN_PASSWORD` env var)

### API Routes
- `/api/movies` - GET (list movies), POST (add movie with full details)
- `/api/movies/search` - Search movies via TMDB with autocomplete
- `/api/votes` - POST (submit rankings)
- `/api/votes/results` - GET voting results with point calculations
- `/api/voting-session` - GET current session info
- `/api/voting-session/close` - POST close voting and declare winner
- `/api/admin/auth` - POST (login), DELETE (logout)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: 
  - Production: Supabase (PostgreSQL with Row Level Security)
  - Local Development: PostgreSQL via Docker
- **Real-Time**: WebSocket server for instant synchronization
- **Process Management**: PM2 for always-on development servers
- **Movie Data**: TMDB API
- **Testing**: Jest with React Testing Library
- **Hosting**: Optimized for Vercel deployment

## Getting Started

### Quick Start with PM2 (Recommended)

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (copy `.env.local.example` to `.env.local`)
4. Start servers with PM2: `npm run pm2:start`
5. Open [http://localhost:8080](http://localhost:8080)

### PM2 Commands

```bash
npm run pm2:start    # Start both Next.js and WebSocket servers
npm run pm2:stop     # Stop all servers
npm run pm2:restart  # Restart all servers
npm run pm2:logs     # View server logs
npm run pm2:status   # Check server status
```

### Manual Development Mode

```bash
# Start local PostgreSQL
docker-compose up -d

# Run development servers separately
npm run dev         # Next.js on port 8080
npm run dev:ws      # WebSocket on port 8081

# Or run both together
npm run dev:all
```

### Testing

```bash
npm test           # Run all tests (38 tests across 7 suites)
npm run test:watch # Run tests in watch mode
```

## Environment Variables

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nospoilers_dev
USE_LOCAL_DB=true  # Set to false for production (Supabase)

# Supabase (production only)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# WebSocket Configuration
WS_PORT=8081
NEXT_PUBLIC_WS_PORT=8081

# TMDB API (required for movie search)
TMDB_API_KEY=your_tmdb_api_key
TMDB_API_READ_ACCESS_TOKEN=your_tmdb_read_token

# Admin credentials (optional, defaults shown)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=nospoilers123
```

## User Flow

1. **Start Session**: Admin creates a new voting session
2. **Share Link**: Send the voting URL to all participants
3. **Add Movies**: Everyone searches and adds movie suggestions
   - Real-time sync shows new movies instantly to all users
   - TMDB integration provides posters, ratings, cast info
4. **Rank Preferences**: Drag movies into personal ranking order
5. **Submit Vote**: One click to submit ranked choices
6. **Watch Results**: Live updates as each vote comes in
7. **See Winner**: Ranked choice algorithm determines fairest winner
   - View elimination rounds to understand the process
8. **Start Watching**: Admin closes voting, winner is final

## Database Schema

The app uses PostgreSQL with the following tables:
- `movies` - Movie entries with TMDB data and metadata
- `voting_sessions` - Tracks voting periods and winners
- `user_sessions` - Anonymous session tracking
- `votes` - Stores rankings for each user

Row Level Security (RLS) ensures data integrity while keeping the app open.

## Architecture Highlights

- **Database Abstraction Layer**: Single interface supports both Supabase and local PostgreSQL
- **WebSocket Broadcasting**: Custom server enables real-time features without external dependencies
- **Session-Based Voting**: No accounts needed, prevents duplicate votes
- **Type-Safe**: Full TypeScript coverage with strict typing
- **Mobile-First**: Responsive design works perfectly on all devices
- **Hot Reloading**: PM2 watches for changes and auto-restarts

## Demo Video

The homepage features an interactive demo showing:
- 4 concurrent users (Alice, Bob, Charlie, Diana)
- Real-time movie synchronization via WebSockets
- Ranked choice voting defeating first-past-the-post
- Live results updates as votes are submitted

## Deployment

- **Production**: See `DEPLOYMENT.md` for Vercel + Supabase setup
- **Local**: Uses Docker PostgreSQL for development
- **Environment-Based**: Automatic database selection based on environment

## Success Metrics

- ✅ All participants can easily add and vote for movies
- ✅ Voting process takes less than 2 minutes per person
- ✅ Real-time sync keeps everyone on the same page
- ✅ Ranked choice finds consensus where simple voting fails
- ✅ No accounts or sign-ups required
- ✅ Movie details load instantly with autocomplete