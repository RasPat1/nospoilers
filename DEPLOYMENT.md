# NoSpoilers Auto-Deploy Setup Guide

This guide explains how to set up automatic deployments from GitHub to production.

## Vercel Auto-Deploy Setup

### 1. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account
2. Click "Add New..." → "Project"
3. Import your `nospoilers` repository from GitHub
4. Vercel will automatically detect it's a Next.js app

### 2. Configure Environment Variables

In Vercel project settings → Environment Variables, add:

```env
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# WebSocket Server (Production)
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-websocket-server.com

# Admin Credentials
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password

# TMDB API
TMDB_API_KEY=your_tmdb_key
TMDB_API_READ_ACCESS_TOKEN=your_tmdb_token

# Database Type (Production)
DATABASE_TYPE=supabase
```

### 3. Deploy Settings

Vercel will automatically:
- Deploy every push to `main` branch to production
- Create preview deployments for pull requests
- Run build checks before deploying

### 4. WebSocket Server Deployment

The WebSocket server needs separate deployment. Options:

#### Option A: Railway
1. Create account at [railway.app](https://railway.app)
2. Create new project from GitHub
3. Select the `nospoilers` repo
4. Add a new service pointing to `websocket-server.js`
5. Set environment variables:
   - `PORT=3001`
   - `NODE_ENV=production`
6. Railway will provide a URL like `wss://your-app.railway.app`

#### Option B: Render
1. Create account at [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub and select `nospoilers`
4. Settings:
   - Build Command: `npm install`
   - Start Command: `node websocket-server.js`
5. Add environment variables

#### Option C: Fly.io
1. Install Fly CLI: `brew install flyctl`
2. Create `fly.toml` in project root
3. Deploy with `fly deploy`

### 5. Database Setup (Supabase)

1. Create project at [supabase.com](https://supabase.com)
2. Run the schema from `schema/complete-schema.sql` in SQL Editor
3. Copy the URL and anon key to Vercel environment variables

## GitHub Actions Alternative

If you prefer GitHub Actions for deployment:

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Post-Deploy Checklist

1. ✅ Main app deployed to Vercel
2. ✅ WebSocket server deployed separately
3. ✅ Environment variables configured
4. ✅ Supabase database initialized with schema
5. ✅ Custom domain configured (optional)
6. ✅ SSL certificates active
7. ✅ Test voting flow in production

## Monitoring

- Vercel Dashboard: Monitor deployments and function logs
- Supabase Dashboard: Monitor database usage and logs
- WebSocket logs: Check your WebSocket hosting provider

## Rollback

If issues occur:
- Vercel: Use "Instant Rollback" in dashboard
- Database: Supabase has point-in-time recovery
- Git: `git revert` and push to trigger new deploy
