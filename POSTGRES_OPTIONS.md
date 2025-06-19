# PostgreSQL Setup Options for NoSpoilers

You have several options for setting up PostgreSQL locally:

## Option 1: Docker Compose (Recommended)

**Prerequisites:** Docker Desktop installed

```bash
# Start PostgreSQL
docker-compose up -d

# Your database will be available at:
# postgresql://postgres:postgres@localhost:5432/nospoilers
```

## Option 2: Homebrew (macOS)

```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create database and user
createdb nospoilers
psql nospoilers < supabase-schema.sql
```

## Option 3: Postgres.app (macOS)

1. Download from https://postgresapp.com/
2. Start the app
3. Create database:
   ```bash
   createdb nospoilers
   psql nospoilers < supabase-schema.sql
   ```

## Option 4: Use Supabase (Cloud - Original Setup)

Follow the instructions in `SUPABASE_SETUP.md` to use the free cloud service.

## Configuration

Regardless of which option you choose, update your `.env.local`:

### For Local PostgreSQL (Options 1-3):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nospoilers
USE_LOCAL_DB=true
ADMIN_SECRET=admin123
```

### For Supabase (Option 4):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ADMIN_SECRET=admin123
```

## Quick Test

After setup, test your database connection:
```bash
# For local PostgreSQL
psql postgresql://postgres:postgres@localhost:5432/nospoilers -c "SELECT current_database();"
```

This should return `nospoilers` if everything is working.