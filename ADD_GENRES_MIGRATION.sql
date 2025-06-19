-- Add genres column to movies table
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS genres TEXT[];

-- Example of how to update existing movies with genres:
-- UPDATE movies SET genres = ARRAY['Drama', 'Crime'] WHERE title = 'The Shawshank Redemption';