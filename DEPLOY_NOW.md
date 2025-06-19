# Deploy NoSpoilers to Vercel - Quick Steps

## Option 1: Deploy with Vercel CLI (Recommended)

Run these commands in your terminal:

```bash
# 1. Deploy to Vercel
vercel

# When prompted:
# - Set up and deploy "~/dev/nospoilers"? [Y/n]: Y
# - Which scope? Select your account
# - Link to existing project? [y/N]: N
# - Project name: nospoilers (or your preferred name)
# - In which directory is your code located? ./ (press Enter)
# - Want to modify settings? [y/N]: N
```

After initial deployment, set environment variables:

```bash
# 2. Set production environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add ADMIN_SECRET production

# 3. Deploy to production with env vars
vercel --prod
```

## Option 2: Deploy via Vercel Dashboard

1. Visit: https://vercel.com/new/clone?repository-url=https://github.com/RasPat1/nospoilers

2. Click "Deploy"

3. After deployment, go to Settings → Environment Variables and add:
   - `NEXT_PUBLIC_SUPABASE_URL` = (your Supabase URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your Supabase anon key)
   - `ADMIN_SECRET` = (choose a strong password)

4. Redeploy for env vars to take effect

## Your Deployment URLs

Once deployed, you'll get:
- Production: `https://nospoilers.vercel.app` (or custom domain)
- Preview: `https://nospoilers-[hash].vercel.app`

## Test Your Deployment

1. Visit your production URL
2. Add some movies
3. Test voting functionality
4. Access admin with `?admin=your_admin_secret`

## Need Your Supabase Credentials?

Check your `.env.local` file or Supabase dashboard:
- Project Settings → API → Project URL
- Project Settings → API → Anon public key