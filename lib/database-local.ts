import { Pool } from 'pg';
import { Movie, VotingSession, UserSession } from '@/lib/types';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nospoilers',
});

export const localDb = {
  movies: {
    async getAll(): Promise<Movie[]> {
      const result = await pool.query('SELECT * FROM movies ORDER BY created_at DESC');
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
    async create(sessionId: string, userSessionId: string, rankings: Record<string, number>): Promise<any> {
      const result = await pool.query(
        'INSERT INTO votes (voting_session_id, user_session_id, rankings) VALUES ($1, $2, $3) RETURNING *',
        [sessionId, userSessionId, JSON.stringify(rankings)]
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