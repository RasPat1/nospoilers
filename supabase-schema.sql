-- Create movies table
CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  added_by_session UUID,
  status TEXT DEFAULT 'candidate' CHECK (status IN ('candidate', 'watched', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create voting sessions table
CREATE TABLE voting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  winner_movie_id UUID REFERENCES movies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Create user sessions table
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voting_session_id UUID REFERENCES voting_sessions(id),
  user_session_id UUID REFERENCES user_sessions(id),
  rankings JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voting_session_id, user_session_id)
);

-- Enable Row Level Security
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policies for movies (everyone can read and insert)
CREATE POLICY "Movies are viewable by everyone" ON movies
  FOR SELECT USING (true);

CREATE POLICY "Anyone can add movies" ON movies
  FOR INSERT WITH CHECK (true);

-- Create policies for voting_sessions (everyone can read, insert, and update)
CREATE POLICY "Voting sessions are viewable by everyone" ON voting_sessions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create voting sessions" ON voting_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update voting sessions" ON voting_sessions
  FOR UPDATE USING (true);

-- Create policies for user_sessions (users can create their own)
CREATE POLICY "Users can create sessions" ON user_sessions
  FOR INSERT WITH CHECK (true);

-- Create policies for votes (users can vote once per session)
CREATE POLICY "Votes are viewable by everyone" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Users can submit votes" ON votes
  FOR INSERT WITH CHECK (true);