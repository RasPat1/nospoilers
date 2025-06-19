-- Add DELETE policies to allow deletion of records

-- Allow deletion of movies
CREATE POLICY "Allow delete movies" ON movies
  FOR DELETE USING (true);

-- Allow deletion of votes
CREATE POLICY "Allow delete votes" ON votes
  FOR DELETE USING (true);

-- Allow deletion of voting sessions
CREATE POLICY "Allow delete voting sessions" ON voting_sessions
  FOR DELETE USING (true);

-- Allow deletion of user sessions
CREATE POLICY "Allow delete user sessions" ON user_sessions
  FOR DELETE USING (true);