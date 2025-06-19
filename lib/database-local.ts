import { Pool } from 'pg';
import { Movie, VotingSession, UserSession } from '@/lib/types';

// Create connection pool based on environment
const getConnectionString = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Default connection strings based on NODE_ENV
  if (process.env.NODE_ENV === 'test') {
    return 'postgresql://postgres:postgres@localhost:5433/nospoilers_test';
  }
  
  return 'postgresql://postgres:postgres@localhost:5432/nospoilers_dev';
};

const pool = new Pool({
  connectionString: getConnectionString(),
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

export const localDb = {
  // Raw query method
  query: (text: string, params?: any[]) => pool.query(text, params),
  
  // Structured methods
  movies: {
    async getAll(): Promise<Movie[]> {
      const result = await pool.query(
        'SELECT * FROM movies WHERE status = $1 ORDER BY created_at DESC',
        ['candidate']
      );
      return result.rows;
    },
    
    async create(title: string): Promise<Movie> {
      const result = await pool.query(
        'INSERT INTO movies (title) VALUES ($1) RETURNING *',
        [title]
      );
      return result.rows[0];
    },
    
    async delete(id: string): Promise<void> {
      await pool.query('DELETE FROM movies WHERE id = $1', [id]);
    },
  },
  
  votingSession: {
    async getCurrent(): Promise<VotingSession | null> {
      const result = await pool.query(
        'SELECT * FROM voting_sessions WHERE status = $1 LIMIT 1',
        ['open']
      );
      return result.rows[0] || null;
    },
    
    async create(): Promise<VotingSession> {
      const result = await pool.query(
        'INSERT INTO voting_sessions DEFAULT VALUES RETURNING *'
      );
      return result.rows[0];
    },
    
    async close(id: string, winnerMovieId: string | null): Promise<void> {
      await pool.query(
        'UPDATE voting_sessions SET status = $1, ended_at = NOW(), winner_movie_id = $2 WHERE id = $3',
        ['closed', winnerMovieId, id]
      );
    },
  },
  
  userSessions: {
    async upsert(id: string): Promise<UserSession> {
      const result = await pool.query(
        `INSERT INTO user_sessions (id) VALUES ($1) 
         ON CONFLICT (id) DO UPDATE SET last_seen = NOW() 
         RETURNING *`,
        [id]
      );
      return result.rows[0];
    },
  },
  
  votes: {
    async create(sessionId: string, userSessionId: string, rankings: string[]): Promise<any> {
      const result = await pool.query(
        'INSERT INTO votes (voting_session_id, user_session_id, rankings) VALUES ($1, $2, $3) RETURNING *',
        [sessionId, userSessionId, rankings]
      );
      return result.rows[0];
    },
    
    async getBySession(sessionId: string): Promise<any[]> {
      const result = await pool.query(
        'SELECT * FROM votes WHERE voting_session_id = $1',
        [sessionId]
      );
      return result.rows;
    },
    
    async hasVoted(sessionId: string, userSessionId: string): Promise<boolean> {
      const result = await pool.query(
        'SELECT COUNT(*) FROM votes WHERE voting_session_id = $1 AND user_session_id = $2',
        [sessionId, userSessionId]
      );
      return parseInt(result.rows[0].count) > 0;
    },
  },
};