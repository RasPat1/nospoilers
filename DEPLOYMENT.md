# Deployment Guide for NoSpoilers

This guide walks you through deploying NoSpoilers to production using Vercel.

## Prerequisites

1. GitHub repository (✓ Already set up at https://github.com/RasPat1/nospoilers)
2. Supabase project with database schema applied
3. Vercel account (free tier works)

## Deployment Steps

### 1. Push Code to GitHub

First, ensure your code is up to date on GitHub:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy
vercel

# Follow the prompts:
# - Link to existing project or create new
# - Select the nospoilers directory
# - Use default build settings
```

#### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository: `RasPat1/nospoilers`
3. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

### 3. Set Environment Variables

In Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ADMIN_SECRET=your_secure_admin_password
```

### 4. Deploy

- If using CLI: Run `vercel --prod`
- If using Dashboard: Click "Deploy"

## Post-Deployment

### Custom Domain (Optional)

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Environment-Specific Configuration

- **Production**: Uses Supabase cloud database
- **Development**: Can use local PostgreSQL or Supabase
- **Preview**: Each PR gets its own preview deployment

## Monitoring

- View logs: Vercel Dashboard → Functions → Logs
- Check build status: Vercel Dashboard → Deployments
- Monitor performance: Vercel Analytics (optional add-on)

## Updating Production

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Vercel automatically deploys on push to main
```

## Rollback

If needed, you can instantly rollback to a previous deployment:
1. Vercel Dashboard → Deployments
2. Find the previous working deployment
3. Click "..." → "Promote to Production"

## Security Notes

- Never commit `.env.local` or `.env` files
- Use strong, unique passwords for `ADMIN_SECRET` in production
- Rotate credentials periodically
- Enable 2FA on GitHub and Vercel accounts