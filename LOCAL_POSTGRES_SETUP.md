# Local PostgreSQL Setup

This guide helps you set up a local PostgreSQL database for testing NoSpoilers without needing a Supabase account.

## Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ installed

## Setup Steps

### 1. Start PostgreSQL with Docker

```bash
# Start the PostgreSQL container
docker-compose up -d

# Verify it's running
docker-compose ps
```

This will:
- Start PostgreSQL on port 5432
- Create a database named `nospoilers`
- Automatically run the schema from `supabase-schema.sql`

### 2. Configure Environment Variables

Update your `.env.local` file:

```bash
# Comment out or remove Supabase configuration
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Enable local database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nospoilers
USE_LOCAL_DB=true

# Keep admin secret
ADMIN_SECRET=admin123
```

### 3. Install Dependencies

If you haven't already:
```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to use the app.

## Database Management

### View Database
```bash
# Connect to PostgreSQL
docker exec -it nospoilers-postgres psql -U postgres -d nospoilers

# Useful commands in psql:
\dt              # List tables
\d movies        # Describe movies table
SELECT * FROM movies;  # View all movies
\q               # Quit
```

### Reset Database
```bash
# Stop and remove containers and volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

### Stop Database
```bash
docker-compose down
```

## Switching Between Local and Supabase

To switch back to Supabase:
1. Comment out `USE_LOCAL_DB=true` in `.env.local`
2. Uncomment your Supabase credentials
3. Restart the dev server

## Troubleshooting

### Port 5432 already in use
If you have another PostgreSQL instance running:
```bash
# Change the port in docker-compose.yml:
ports:
  - "5433:5432"  # Use port 5433 instead

# Update DATABASE_URL in .env.local:
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/nospoilers
```

### Connection refused
Make sure Docker is running and the container started successfully:
```bash
docker-compose logs postgres
```