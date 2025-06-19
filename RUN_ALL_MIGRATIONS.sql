-- IMPORTANT: Run these migrations in your Supabase SQL editor in order

-- 1. Add Rotten Tomatoes URL field
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS rotten_tomatoes_url TEXT;

-- 2. Add additional movie details columns
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS tmdb_id INTEGER,
ADD COLUMN IF NOT EXISTS poster_path TEXT,
ADD COLUMN IF NOT EXISTS release_date DATE,
ADD COLUMN IF NOT EXISTS vote_average NUMERIC(3, 1),
ADD COLUMN IF NOT EXISTS rotten_tomatoes_score INTEGER,
ADD COLUMN IF NOT EXISTS director TEXT,
ADD COLUMN IF NOT EXISTS actors TEXT[], -- Array of actor names
ADD COLUMN IF NOT EXISTS plot TEXT,
ADD COLUMN IF NOT EXISTS overview TEXT,
ADD COLUMN IF NOT EXISTS backdrop_path TEXT;

-- 3. Fix voting sessions RLS policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Voting sessions are viewable by everyone" ON voting_sessions;
DROP POLICY IF EXISTS "Anyone can create voting sessions" ON voting_sessions;
DROP POLICY IF EXISTS "Anyone can update voting sessions" ON voting_sessions;

-- Recreate policies
CREATE POLICY "Voting sessions are viewable by everyone" ON voting_sessions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create voting sessions" ON voting_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update voting sessions" ON voting_sessions
  FOR UPDATE USING (true);

-- 4. Add environment field to voting_sessions table (for dev/prod separation)
ALTER TABLE voting_sessions 
ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'production';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_voting_sessions_environment 
ON voting_sessions(environment, status);

-- Update existing sessions to production
UPDATE voting_sessions 
SET environment = 'production' 
WHERE environment IS NULL;