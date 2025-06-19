-- Add INSERT policy for voting_sessions table
-- This allows anyone to create a new voting session
CREATE POLICY "Anyone can create voting sessions" ON voting_sessions
  FOR INSERT WITH CHECK (true);

-- Also add UPDATE policy for closing sessions
CREATE POLICY "Anyone can update voting sessions" ON voting_sessions
  FOR UPDATE USING (true);