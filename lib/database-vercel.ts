import { sql } from '@vercel/postgres';
import { Movie, VotingSession, UserSession, Vote } from '@/lib/types';

export const vercelDb = {
  movies: {
    async getAll(): Promise<Movie[]> {
      const { rows } = await sql`
        SELECT * FROM movies 
        WHERE status = 'candidate' 
        ORDER BY created_at DESC
      `;
      return rows as Movie[];
    },
    
    async getByStatus(status: string): Promise<Movie[]> {
      const { rows } = await sql`
        SELECT * FROM movies 
        WHERE status = ${status} 
        ORDER BY created_at DESC
      `;
      return rows as Movie[];
    },
    
    async getById(id: string): Promise<Movie | null> {
      const { rows } = await sql`
        SELECT * FROM movies 
        WHERE id = ${id}
      `;
      return (rows[0] as Movie) || null;
    },
    
    async getByTmdbId(tmdbId: number, status: string = 'candidate'): Promise<Movie | null> {
      const { rows } = await sql`
        SELECT * FROM movies 
        WHERE tmdb_id = ${tmdbId} 
        AND status = ${status}
      `;
      return (rows[0] as Movie) || null;
    },
    
    async create(movieData: Partial<Movie>): Promise<Movie> {
      const fields = Object.keys(movieData);
      const values = Object.values(movieData);
      
      // Build dynamic insert query
      const columns = fields.join(', ');
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
      
      // Use parameterized query
      const query = `
        INSERT INTO movies (${columns})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const { rows } = await sql.query(query, values);
      return rows[0] as Movie;
    },
    
    async delete(id: string): Promise<void> {
      await sql`
        DELETE FROM movies 
        WHERE id = ${id}
      `;
    },
  },
  
  votingSession: {
    async getCurrent(environment?: string): Promise<VotingSession | null> {
      const env = environment || process.env.NODE_ENV || 'development';
      const { rows } = await sql`
        SELECT * FROM voting_sessions 
        WHERE status = 'open' 
        AND environment = ${env}
        LIMIT 1
      `;
      return (rows[0] as VotingSession) || null;
    },
    
    async getById(id: string): Promise<VotingSession | null> {
      const { rows } = await sql`
        SELECT * FROM voting_sessions 
        WHERE id = ${id}
      `;
      return (rows[0] as VotingSession) || null;
    },
    
    async create(environment?: string): Promise<VotingSession> {
      const env = environment || process.env.NODE_ENV || 'development';
      const { rows } = await sql`
        INSERT INTO voting_sessions (status, environment) 
        VALUES ('open', ${env}) 
        RETURNING *
      `;
      return rows[0] as VotingSession;
    },
    
    async close(id: string, winnerMovieId: string | null): Promise<void> {
      await sql`
        UPDATE voting_sessions 
        SET status = 'closed', 
            ended_at = NOW(),
            winner_movie_id = ${winnerMovieId}
        WHERE id = ${id}
      `;
    },
  },
  
  userSessions: {
    async get(id: string): Promise<UserSession | null> {
      const { rows } = await sql`
        SELECT * FROM user_sessions 
        WHERE id = ${id}
      `;
      return (rows[0] as UserSession) || null;
    },
    
    async upsert(id: string): Promise<UserSession> {
      const { rows } = await sql`
        INSERT INTO user_sessions (id) 
        VALUES (${id})
        ON CONFLICT (id) DO UPDATE 
        SET id = EXCLUDED.id
        RETURNING *
      `;
      return rows[0] as UserSession;
    },
  },
  
  votes: {
    async create(votingSessionId: string, userSessionId: string, rankings: string[]): Promise<Vote> {
      // Convert array to PostgreSQL array format
      const rankingsArray = `{${rankings.map(r => `"${r}"`).join(',')}}`;
      const { rows } = await sql.query(
        'INSERT INTO votes (voting_session_id, user_session_id, rankings) VALUES ($1, $2, $3) RETURNING *',
        [votingSessionId, userSessionId, rankingsArray]
      );
      return rows[0] as Vote;
    },
    
    async getBySession(sessionId: string): Promise<Vote[]> {
      const { rows } = await sql`
        SELECT * FROM votes 
        WHERE voting_session_id = ${sessionId}
      `;
      return rows as Vote[];
    },
    
    async getByUserAndSession(userSessionId: string, votingSessionId: string): Promise<Vote | null> {
      const { rows } = await sql`
        SELECT * FROM votes 
        WHERE voting_session_id = ${votingSessionId} 
        AND user_session_id = ${userSessionId}
      `;
      return (rows[0] as Vote) || null;
    },
    
    async hasVoted(sessionId: string, userSessionId: string): Promise<boolean> {
      const { rows } = await sql`
        SELECT COUNT(*) as count FROM votes 
        WHERE voting_session_id = ${sessionId} 
        AND user_session_id = ${userSessionId}
      `;
      return parseInt(rows[0].count) > 0;
    },
    
    async delete(userSessionId: string, votingSessionId: string): Promise<void> {
      await sql`
        DELETE FROM votes 
        WHERE voting_session_id = ${votingSessionId} 
        AND user_session_id = ${userSessionId}
      `;
    },
    
    async count(votingSessionId: string): Promise<number> {
      const { rows } = await sql`
        SELECT COUNT(*) as count FROM votes 
        WHERE voting_session_id = ${votingSessionId}
      `;
      return parseInt(rows[0].count);
    },
  },
  
  // Initialize database schema
  async init() {
    // Create tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS movies (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        tmdb_id INTEGER,
        title VARCHAR(255) NOT NULL,
        year INTEGER,
        poster_path TEXT,
        overview TEXT,
        vote_average FLOAT,
        vote_count INTEGER,
        runtime INTEGER,
        release_date DATE,
        genres TEXT,
        status VARCHAR(20) DEFAULT 'candidate',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS voting_sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        status VARCHAR(20) DEFAULT 'open',
        environment VARCHAR(20) DEFAULT 'development',
        winner_movie_id UUID REFERENCES movies(id),
        created_at TIMESTAMP DEFAULT NOW(),
        ended_at TIMESTAMP
      )
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(255) PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS votes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        voting_session_id UUID REFERENCES voting_sessions(id),
        user_session_id VARCHAR(255) REFERENCES user_sessions(id),
        rankings TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(voting_session_id, user_session_id)
      )
    `;
  }
};