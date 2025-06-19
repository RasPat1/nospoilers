-- Add environment field to voting_sessions table
ALTER TABLE voting_sessions 
ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'production';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_voting_sessions_environment 
ON voting_sessions(environment, status);