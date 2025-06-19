-- Add additional movie details columns
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS tmdb_id INTEGER,
ADD COLUMN IF NOT EXISTS rotten_tomatoes_url TEXT,
ADD COLUMN IF NOT EXISTS rotten_tomatoes_score INTEGER,
ADD COLUMN IF NOT EXISTS director TEXT,
ADD COLUMN IF NOT EXISTS actors TEXT[], -- Array of actor names
ADD COLUMN IF NOT EXISTS plot TEXT,
ADD COLUMN IF NOT EXISTS backdrop_path TEXT;