-- Complete NoSpoilers Database Schema
-- This file contains the complete schema including all migrations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create movies table
CREATE TABLE IF NOT EXISTS movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  added_by_session UUID,
  status TEXT DEFAULT 'candidate' CHECK (status IN ('candidate', 'watched', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional movie details
  tmdb_id INTEGER,
  poster_path TEXT,
  backdrop_path TEXT,
  release_date DATE,
  vote_average NUMERIC(3, 1),
  overview TEXT,
  
  -- Rotten Tomatoes
  rotten_tomatoes_url TEXT,
  rotten_tomatoes_score INTEGER,
  
  -- Cast and crew
  director TEXT,
  actors TEXT[], -- Array of actor names
  plot TEXT,
  
  -- Genres
  genres TEXT[]
);

-- Create index for TMDB ID to prevent duplicates efficiently
CREATE UNIQUE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id) WHERE tmdb_id IS NOT NULL AND status = 'candidate';

-- Create voting sessions table
CREATE TABLE IF NOT EXISTS voting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  winner_movie_id UUID REFERENCES movies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  environment TEXT DEFAULT 'production'
);

-- Create index for environment and status
CREATE INDEX IF NOT EXISTS idx_voting_sessions_environment ON voting_sessions(environment, status);

-- Create user sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voting_session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE,
  user_session_id UUID REFERENCES user_sessions(id),
  rankings TEXT[] NOT NULL, -- Array of movie IDs in order of preference
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voting_session_id, user_session_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_votes_voting_session ON votes(voting_session_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_session ON votes(user_session_id);

-- For local development, we don't need Row Level Security,
-- but we'll add it for compatibility with Supabase
DO $$ 
BEGIN
  -- Only enable RLS if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'movies' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
    ALTER TABLE voting_sessions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies (for Supabase compatibility)
-- These won't be enforced in local PostgreSQL unless you're using a specific role

-- Movies policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'movies' 
    AND policyname = 'Movies are viewable by everyone'
  ) THEN
    CREATE POLICY "Movies are viewable by everyone" ON movies
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'movies' 
    AND policyname = 'Anyone can add movies'
  ) THEN
    CREATE POLICY "Anyone can add movies" ON movies
      FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'movies' 
    AND policyname = 'Anyone can delete movies'
  ) THEN
    CREATE POLICY "Anyone can delete movies" ON movies
      FOR DELETE USING (true);
  END IF;
END $$;

-- Voting sessions policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'voting_sessions' 
    AND policyname = 'Voting sessions are viewable by everyone'
  ) THEN
    CREATE POLICY "Voting sessions are viewable by everyone" ON voting_sessions
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'voting_sessions' 
    AND policyname = 'Anyone can create voting sessions'
  ) THEN
    CREATE POLICY "Anyone can create voting sessions" ON voting_sessions
      FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'voting_sessions' 
    AND policyname = 'Anyone can update voting sessions'
  ) THEN
    CREATE POLICY "Anyone can update voting sessions" ON voting_sessions
      FOR UPDATE USING (true);
  END IF;
END $$;

-- User sessions policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_sessions' 
    AND policyname = 'Users can create sessions'
  ) THEN
    CREATE POLICY "Users can create sessions" ON user_sessions
      FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_sessions' 
    AND policyname = 'Users can view sessions'
  ) THEN
    CREATE POLICY "Users can view sessions" ON user_sessions
      FOR SELECT USING (true);
  END IF;
END $$;

-- Votes policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'votes' 
    AND policyname = 'Votes are viewable by everyone'
  ) THEN
    CREATE POLICY "Votes are viewable by everyone" ON votes
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'votes' 
    AND policyname = 'Users can submit votes'
  ) THEN
    CREATE POLICY "Users can submit votes" ON votes
      FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'votes' 
    AND policyname = 'Users can delete their votes'
  ) THEN
    CREATE POLICY "Users can delete their votes" ON votes
      FOR DELETE USING (true);
  END IF;
END $$;