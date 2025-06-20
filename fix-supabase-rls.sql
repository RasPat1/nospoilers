-- Fix Supabase RLS policies to allow proper user session management

-- Add missing SELECT policy for user_sessions table
CREATE POLICY IF NOT EXISTS "Users can view sessions" ON user_sessions
  FOR SELECT USING (true);

-- Update the INSERT policy to ensure it's working correctly  
DROP POLICY IF EXISTS "Users can create sessions" ON user_sessions;
CREATE POLICY "Users can create sessions" ON user_sessions
  FOR INSERT WITH CHECK (true);

-- Add UPDATE policy for user_sessions (for last_seen updates)
CREATE POLICY IF NOT EXISTS "Users can update sessions" ON user_sessions
  FOR UPDATE USING (true);

-- Make sure all necessary policies exist for votes table
CREATE POLICY IF NOT EXISTS "Users can delete their votes" ON votes
  FOR DELETE USING (true);

-- Verify the policies are working by listing them
-- (Run these queries in Supabase SQL editor to check)
-- SELECT * FROM pg_policies WHERE tablename = 'user_sessions';
-- SELECT * FROM pg_policies WHERE tablename = 'votes';