# Production Movie Addition Fix

## Environment Variables to Check/Add

Make sure these are set in your production environment (Vercel):

```env
# Required for movie addition
SUPABASE_SERVICE_KEY=your_service_role_key_here
TMDB_API_KEY=your_tmdb_api_key_here

# Ensure these are also set
DATABASE_TYPE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Quick Verification Steps

1. **Check Vercel Environment Variables:**
   - Go to your Vercel project settings
   - Navigate to Environment Variables
   - Verify all the above are set for Production

2. **Get Your Supabase Service Key:**
   - Go to Supabase Dashboard
   - Settings → API
   - Copy the "service_role" key (NOT the anon key)
   - This bypasses RLS policies

3. **Test in Production:**
   - After adding env vars, redeploy
   - Try adding a movie
   - Check browser console for errors

## Alternative: Disable RLS (Quick Fix)

If you need it working immediately, in Supabase SQL Editor:

```sql
-- Disable RLS on movies table temporarily
ALTER TABLE movies DISABLE ROW LEVEL SECURITY;

-- Or create a permissive policy
CREATE POLICY "Anyone can do anything with movies" ON movies
  FOR ALL USING (true) WITH CHECK (true);
```

## Debug Information

To see the actual error, temporarily add this to `/app/api/movies/route.ts`:

```typescript
} catch (dbError: any) {
  console.error('Database error adding movie:', {
    message: dbError.message,
    code: dbError.code,
    detail: dbError.detail,
    hint: dbError.hint,
    table: dbError.table
  });
  
  // Return more detailed error in development
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.json({ 
      error: 'Database error', 
      details: dbError.message 
    }, { status: 500 });
  }
```

## Most Common Fix

90% of the time, adding the `SUPABASE_SERVICE_KEY` to production environment variables solves this issue.