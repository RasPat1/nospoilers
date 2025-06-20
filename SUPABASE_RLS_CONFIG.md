# Supabase Row Level Security (RLS) Configuration

## Issue

When using Supabase as the database backend, the application encounters RLS policy violations when trying to create user sessions. This prevents users from voting.

## Error Message

```
Failed to create user session: new row violates row-level security policy for table "user_sessions"
```

## Root Cause

The `user_sessions` table has RLS enabled but the policies are too restrictive for anonymous users. Since NoSpoilers doesn't use authentication (users vote anonymously with session IDs), the default RLS policies prevent row creation.

## Solutions

### Option 1: Disable RLS on user_sessions table (Recommended for this use case)

Since the app uses anonymous sessions and doesn't contain sensitive user data, you can disable RLS on the `user_sessions` table:

```sql
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
```

### Option 2: Create Permissive RLS Policy

If you prefer to keep RLS enabled, create a policy that allows anonymous users to create and read their own sessions:

```sql
-- Allow anyone to create a user session
CREATE POLICY "Allow anonymous session creation" ON user_sessions
FOR INSERT TO anon
WITH CHECK (true);

-- Allow anyone to read their own session
CREATE POLICY "Allow reading own session" ON user_sessions
FOR SELECT TO anon
USING (true);
```

### Option 3: Use Supabase Service Role Key

Add the service role key to your environment variables:

```bash
# .env.local
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

**Warning**: The service role key bypasses all RLS policies. Only use this in server-side code and never expose it to the client.

### Option 4: Use Supabase Edge Functions

Create an edge function to handle vote submissions that runs with elevated privileges.

## Verification

After applying one of the above solutions, test voting functionality:

1. Clear any existing test data
2. Add a few movies
3. Submit a vote
4. Verify the vote was recorded

## Current Workaround

The application currently catches RLS errors and provides informative error messages. However, voting functionality will not work until one of the above solutions is implemented.

## Related Files

- `/lib/database.ts` - Database abstraction layer
- `/lib/supabase.ts` - Supabase client configuration
- `/app/api/votes/route.ts` - Vote submission endpoint