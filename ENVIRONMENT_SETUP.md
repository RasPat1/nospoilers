# NoSpoilers Environment Setup Guide

This guide explains how to set up and use the different database environments for NoSpoilers.

## Overview

NoSpoilers supports three database environments:

1. **Production** - Uses Supabase (cloud PostgreSQL)
2. **Development** - Uses local PostgreSQL via Docker
3. **Test** - Uses isolated PostgreSQL for demos and tests

## Quick Start

### Local Development

```bash
# 1. Set up the development database
npm run dev:setup

# 2. Start the development server with WebSocket support
npm run dev:all
```

### Running Tests

```bash
# 1. Set up the test database
npm run test:setup

# 2. Run tests
npm test
```

### Running Demos

```bash
# Run a demo in isolated test environment
npm run demo demo-frames/simple-demo.js
```

## Environment Configuration

### Development (.env.local)

```env
# Local Database Configuration
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nospoilers_dev
USE_LOCAL_DB=true

# WebSocket Configuration
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# TMDB API (required)
TMDB_API_KEY=your_key_here
TMDB_API_READ_ACCESS_TOKEN=your_token_here
```

### Test (.env.test)

```env
# Test Database Configuration
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/nospoilers_test
USE_LOCAL_DB=true
NODE_ENV=test

# Test WebSocket (different port)
WS_PORT=3002
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3002
```

### Production (.env.production)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
DATABASE_TYPE=supabase

# Production WebSocket
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-websocket-server.com
```

## Database Management

### Starting Databases

```bash
# Start development database only
npm run db:dev

# Start test database only
npm run db:test

# Start both databases
docker-compose up -d
```

### Stopping Databases

```bash
# Stop all databases (data persists)
npm run db:stop

# Stop and remove all data
npm run db:clean
```

### Accessing Databases

```bash
# Development database
docker exec -it nospoilers-postgres-dev psql -U postgres -d nospoilers_dev

# Test database
docker exec -it nospoilers-postgres-test psql -U postgres -d nospoilers_test
```

## Switching Between Environments

### Use Local Development

1. Ensure `.env.local` has `USE_LOCAL_DB=true`
2. Run `npm run dev:setup`
3. Start with `npm run dev:all`

### Use Supabase (Production)

1. Update `.env.local`:
   - Comment out `USE_LOCAL_DB=true`
   - Uncomment Supabase credentials
2. Restart the development server

### Use Test Environment

For demos and tests, the environment is automatically set:

```bash
# Demos automatically use test DB
npm run demo demo-frames/your-demo.js

# Tests automatically use test DB
npm test
```

## Database Schema

The complete schema is in `schema/complete-schema.sql` and includes:

- Movies table (with TMDB integration)
- Voting sessions (with environment separation)
- User sessions
- Votes (with ranked choice support)

## Troubleshooting

### Port Already in Use

If port 5432 is taken:
1. Change the port in `docker-compose.yml`
2. Update `DATABASE_URL` in `.env.local`

### WebSocket Connection Issues

Check that the WebSocket server is running:
```bash
# For development
npm run dev:ws

# Check logs
tail -f /tmp/ws-server.log
```

### Database Connection Refused

Ensure Docker is running and the database container is up:
```bash
docker-compose ps
docker-compose logs postgres-dev
```

## Best Practices

1. **Always use test environment for demos** - This prevents test data from polluting development
2. **Keep environments isolated** - Don't mix development and test data
3. **Use environment variables** - Never hardcode database connections
4. **Clean test data regularly** - Run `npm run test:setup` before demo recordings

## Migration Management

When adding new database fields:

1. Update `schema/complete-schema.sql`
2. For existing local databases, create a migration file
3. Apply to all environments before deploying