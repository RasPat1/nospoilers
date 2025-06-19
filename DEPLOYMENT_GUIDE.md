# NoSpoilers Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Project**: Create a project at [supabase.com](https://supabase.com)
3. **TMDB API Key**: Get one at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)

## Step 1: Set Up Supabase Database

1. Create a new Supabase project
2. Go to SQL Editor in your Supabase dashboard
3. Run the following SQL scripts in order:

```sql
-- 1. Run supabase-schema.sql
-- 2. Run add-rotten-tomatoes-migration.sql
-- 3. Run add-movie-details-migration.sql
-- 4. Run voting-sessions-rls-fix.sql (if not already included)
```

4. Get your Supabase credentials:
   - Go to Settings → API
   - Copy the `URL` and `anon public` key

## Step 2: Deploy to Vercel

### Option A: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts and set environment variables when asked
```

### Option B: Deploy via GitHub

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Configure environment variables (see below)
5. Click "Deploy"

## Step 3: Configure Environment Variables

In Vercel dashboard, go to Settings → Environment Variables and add:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | `eyJhbGc...` |
| `TMDB_API_KEY` | Your TMDB API key | `1234567890abcdef` |
| `ADMIN_USERNAME` | Admin panel username | `admin` |
| `ADMIN_PASSWORD` | Admin panel password | `your-secure-password` |

## Step 4: Verify Deployment

1. Visit your Vercel deployment URL
2. Test the following:
   - Landing page loads at `/`
   - Can access voting interface at `/vote`
   - Can add movies (with and without TMDB data)
   - Can submit votes
   - Results update at `/results`
   - Admin panel works at `/admin`

## Troubleshooting

### Database Connection Issues
- Ensure all SQL migrations ran successfully
- Check Supabase URL and keys are correct
- Verify Row Level Security policies are in place

### Movie Search Not Working
- Verify TMDB_API_KEY is set correctly
- Check TMDB API key has proper permissions

### Admin Login Not Working
- Ensure ADMIN_USERNAME and ADMIN_PASSWORD are set
- Check they match what you're entering

### General Issues
- Check Vercel function logs: Dashboard → Functions → Logs
- Verify all environment variables are set
- Ensure you're using Node.js 18.x or higher

## Production Considerations

1. **Custom Domain**: Add your domain in Vercel dashboard → Settings → Domains
2. **Analytics**: Enable Vercel Analytics for performance monitoring
3. **Security**: 
   - Use strong admin password
   - Consider implementing rate limiting
   - Monitor for suspicious voting patterns
4. **Backup**: Regularly backup your Supabase database

## Updating the App

To deploy updates:

```bash
# If using Vercel CLI
vercel --prod

# If using GitHub
git push origin main
# Vercel will auto-deploy
```

## Environment Variables Reference

Create a `.env.production` file (don't commit this!):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
TMDB_API_KEY=your_tmdb_api_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here
```

## Support

- Vercel Issues: [vercel.com/support](https://vercel.com/support)
- Supabase Issues: [supabase.com/docs](https://supabase.com/docs)
- App Issues: Check the GitHub repository