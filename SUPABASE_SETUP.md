# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign up or log in
3. Click "New project"
4. Choose your organization
5. Name your project (e.g., "nospoilers")
6. Generate a strong database password
7. Select a region close to you
8. Click "Create new project"

## 2. Set up the Database Schema

1. In your Supabase dashboard, go to the SQL Editor (left sidebar)
2. Click "New query"
3. Copy the entire contents of `supabase-schema.sql` and paste it into the editor
4. Click "Run" to execute the SQL

## 3. Get Your API Keys

1. Go to Settings → API in your Supabase dashboard
2. Copy these values:
   - **Project URL**: This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key**: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. Update Your Environment Variables

1. Open `.env.local` in your project
2. Replace the placeholder values with your actual Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ADMIN_SECRET=create_your_own_admin_secret
   ```

## 5. Test the Connection

After setting up, run `npm install` and `npm run dev` to start the development server.