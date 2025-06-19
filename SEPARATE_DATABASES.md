# Database Separation Issue

## Current Issue
Both development and production environments are using the same Supabase database, which causes conflicts when testing locally.

## Quick Fix Applied
Added environment prefixes to session IDs:
- Development sessions: `dev-{uuid}`
- Production sessions: `prod-{uuid}`

This prevents local testing from interfering with production votes.

## Permanent Solution (Recommended)

### Option 1: Create Separate Supabase Project
1. Go to https://app.supabase.com
2. Create a new project for development
3. Copy the schema from production:
   ```sql
   -- Run all migrations from /supabase/migrations/
   ```
4. Update `.env.local` with new development credentials

### Option 2: Use Local PostgreSQL with Docker
The project already has Docker Compose setup:

```bash
# Start local PostgreSQL
docker-compose up -d

# Update .env.local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nospoilers
USE_LOCAL_DB=true

# Comment out Supabase variables in .env.local
```

## Clear Browser Cache
After the fix, clear your browser's localStorage:
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Find localStorage for your site
4. Delete the `nospoilers-session-id` key
5. Refresh the page to get a new prefixed session ID