# NoSpoilers - Movie Night Voting App

A simple web app for democratically choosing movies using ranked choice voting.

## Problem Statement

Movie night shouldn't start with a 45-minute argument about whether to watch "The Princess Bride" for the 47th time or finally give Sarah's obscure documentary about mushrooms a chance. NoSpoilers brings democracy to your couch by using ranked choice voting - so when "Die Hard" inevitably wins, at least everyone had their fair shot at pushing their weird indie film.

## Routes Overview

### Public Routes
- `/` - Marketing landing page with app overview and demo
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
- `/api/admin/reset` - POST reset voting session (coming soon)

## Core Features (MVP)

### Movie Management
- **Add Movies**: Smart search with autocomplete from TMDB database
- **Rich Movie Data**: Automatic fetching of posters, ratings, cast, director, plot
- **Rotten Tomatoes Links**: Direct links to RT pages for each movie
- **View Candidates**: See all proposed movies with full details

### Voting System
- **Ranked Choice Voting**: Users drag and drop movies to create their ranked preference list
- **Fair Scoring**: Movies get points based on ranking (1st = most points)
- **One Vote Per Person**: Session-based tracking prevents duplicate votes
- **Drag & Drop Interface**: 
  - Drag movies from candidate list to personal ranking
  - Reorder preferences by dragging within the ranking list
  - Visual feedback for all interactions

### Results & History
- **Live Results**: Results update in real-time as votes come in
- **Close Voting**: Admin can end the voting period
- **View Results**: See the winning movie based on ranked choice algorithm
- **Point System**: Transparent scoring shows how winner was determined

### Access & Sharing
- **No Sign-ups**: Just share the link and start voting
- **Multi-User Access**: Multiple people can access and use the app simultaneously
- **Admin Controls**: Protected admin panel for managing sessions
- **Mobile Optimized**: Works perfectly on phones and tablets

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Movie Data**: TMDB API
- **Hosting**: Optimized for Vercel deployment

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (copy `.env.example` to `.env.local`)
4. Run database migrations in Supabase:
   - `supabase-schema.sql` - Core tables and RLS policies
   - `add-rotten-tomatoes-migration.sql` - RT URL support
   - `add-movie-details-migration.sql` - Extended movie fields
5. Run the development server: `npm run dev`
6. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# TMDB API (required for movie search)
TMDB_API_KEY=your_tmdb_api_key

# Admin credentials (optional, defaults shown)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=nospoilers123
```

## User Flow

1. Admin shares the voting link with the group
2. Users search and add movies they'd like to watch
3. Movie details auto-populate (poster, cast, plot, ratings)
4. Users drag movies into their ranked preference list
5. Submit rankings with one click
6. View live results as votes come in
7. Admin closes voting when everyone has participated
8. Winner is announced with final point tallies

## Database Schema

The app uses PostgreSQL via Supabase with the following tables:
- `movies` - Movie entries with TMDB data and metadata
- `voting_sessions` - Tracks voting periods and winners
- `user_sessions` - Anonymous session tracking
- `votes` - Stores rankings for each user

Row Level Security (RLS) ensures data integrity while keeping the app open.

## Deployment

See `DEPLOYMENT.md` for detailed deployment instructions for Vercel + Supabase.

## Success Metrics

- All participants can easily add and vote for movies
- Voting process takes less than 2 minutes per person
- Clear winner is determined automatically
- No duplicate votes are counted
- Movie details load instantly with search