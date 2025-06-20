# System Architecture Diagram

> **Auto-generated document** - Do not edit directly!  
> Source: `docs/machine-readable/system-diagram.json`  
> Generated: 2025-06-20T01:02:57.588Z

---

## Table of Contents

- [Component Overview](#component-overview)
- [API Routes](#api-routes)
- [Data Flow](#data-flow)
- [Database Schema](#database-schema)
- [State Management](#state-management)
- [Deployment](#deployment)

## Component Overview

### Frontend Architecture

```mermaid
graph TB
    subgraph "Pages"
        HomePage[HomePage /]
        VotePage[VotePage /vote]
        ResultsPage[ResultsPage /results]
        AdminPage[AdminPage /admin]
    end
    
    subgraph "Components"
        VotingInterface[VotingInterface]
        MovieSearch[MovieSearch]
        Results[Results]
    end
    
    subgraph "Hooks"
        WebSocket[useWebSocket]
    end
    
    HomePage --> DemoVideo[DemoVideoGallery]
    VotePage --> VotingInterface
    VotingInterface --> MovieSearch
    ResultsPage --> Results
    Results --> WebSocket
    VotingInterface --> WebSocket
```

### Pages

| Path | Component | Purpose | State Type |
|------|-----------|---------|------------|
| / | app/page.tsx | Landing page with value proposition | none |
| /vote | app/vote/page.tsx | Movie selection and ranking interface | session-based |
| /results | app/results/page.tsx | Live voting results display | real-time updates |
| /admin | app/admin/page.tsx | Administrative controls | authenticated |

### Components

#### comp_voting_interface

- **File:** `components/VotingInterface.tsx`
- **State:** movies, rankings, hasVoted

#### comp_movie_search

- **File:** `components/MovieSearch.tsx`
- **State:** None
- **Props:** onMovieSelect, existingMovies
- **API Calls:** /api/movies/search

#### comp_results

- **File:** `components/Results.tsx`
- **State:** results, voteCount, winner
- **API Calls:** /api/votes/results, /api/votes/count

## API Routes

| Endpoint | Methods | Purpose | Auth Required |
|----------|---------|---------|---------------|
| /api/movies | GET, POST, DELETE | app/api/movies/route.ts | ❌ No |
| /api/movies/search | GET | app/api/movies/search/route.ts | ❌ No |
| /api/votes | POST | app/api/votes/route.ts | ❌ No |
| /api/votes/results | GET | app/api/votes/results/route.ts | ❌ No |
| /api/voting-session | GET, POST | Manage voting lifecycle | ❌ No |
| /api/admin/* | POST, GET | undefined | 🔒 Yes |

## Data Flow

### Flow Add Movie

**Trigger:** User searches for movie

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Database
    participant External

    User->>Frontend: Input text in search box
    Frontend->>API: Debounced API call
    API->>External: TMDB API request (TMDB)
    User->>Frontend: Display autocomplete
    User->>Frontend: Update UI

```

### Flow Submit Vote

**Trigger:** User clicks submit vote

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Database
    participant External

    User->>Frontend: Validate rankings
    API->>Database: Check existing vote
    API->>Database: Create user session
    API->>Database: Store vote
    API-->>Frontend: Broadcast event (WebSocket)
    Frontend->>User: Redirect to results

```

### Flow Real Time Updates

**Trigger:** WebSocket connection

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Database
    participant External

    User->>Frontend: Trigger refresh
    Frontend->>API: Fetch latest data

```

### Flow Calculate Winner

**Trigger:** Results page load or refresh

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Database
    participant External

    User->>Frontend: GET /api/votes/results
    API->>Database: Fetch all votes
    User->>Frontend: Display results

```

## Database Schema

```mermaid
erDiagram
    movies {
        string id
        string title
        string tmdb_id
        string poster_path
        string vote_average
        string director
        string actors
        string plot
    }
    voting_sessions {
        string id
        string status
        string winner_movie_id
        string created_at
        string closed_at
        string environment
    }
    user_sessions {
        string id
        string created_at
    }
    votes {
        string id
        string voting_session_id
        string user_session_id
        string rankings
        string created_at
    }
    voting_sessions ||--o{ movies : "winner_movie_id"
    votes ||--o{ voting_sessions : "voting_session_id"
    votes ||--o{ user_sessions : "user_session_id"

```

## State Management

### Client-Side State

#### React Component State

| Component | State Variables | Purpose |
|-----------|----------------|----------|
| VotingInterface | movies, rankings, isSubmitting | Component-specific UI state |
| Results | results, voteCount, lastUpdated | Component-specific UI state |
| Admin | isAuthenticated, stats | Component-specific UI state |

#### Local Storage

| Key | Type | Purpose |
|-----|------|----------|
| voting-session-id | UUID | Track user session |
| has-voted | boolean | Prevent duplicate votes |

## Deployment

### Environment Configuration

| Environment | Database | API | WebSocket |
|-------------|----------|-----|------------|
| development | Local PostgreSQL via Docker | Next.js dev server | Local Node.js server |
| production | Supabase PostgreSQL | Vercel Serverless Functions | Separate Node.js server |
| test | Test Supabase project | undefined | undefined |
