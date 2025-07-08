import { supabase } from './supabase';
import { localDb } from './database-local';
import { Movie, VotingSession, UserSession } from '@/lib/types';

// Determine which database to use based on environment
const isSupabase = process.env.DATABASE_TYPE === 'supabase' || 
                   (!process.env.USE_LOCAL_DB && process.env.NODE_ENV === 'production');

// Create a unified database interface
export const db = {
  movies: {
    async getAll(): Promise<Movie[]> {
      if (isSupabase) {
        const { data, error } = await supabase
          .from('movies')
          .select('*')
          .eq('status', 'candidate')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      }
      return localDb.movies.getAll();
    },
    
    async getByStatus(status: string): Promise<Movie[]> {
      try {
        if (isSupabase) {
          const { data, error } = await supabase
            .from('movies')
            .select('*')
            .eq('status', status)
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data || [];
        }
        const result = await localDb.query(
          'SELECT * FROM movies WHERE status = $1 ORDER BY created_at DESC',
          [status]
        );
        return result.rows;
      } catch (error) {
        console.error('Error in getByStatus:', error);
        return [];
      }
    },
    
    async getById(id: string): Promise<Movie | null> {
      if (isSupabase) {
        const { data, error } = await supabase
          .from('movies')
          .select('*')
          .eq('id', id)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      }
      const result = await localDb.query(
        'SELECT * FROM movies WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    },
    
    async getByTmdbId(tmdbId: number, status: string = 'candidate'): Promise<Movie | null> {
      if (isSupabase) {
        const { data, error } = await supabase
          .from('movies')
          .select('*')
          .eq('tmdb_id', tmdbId)
          .eq('status', status)
          .single();
        
        // PGRST116 means no rows found, which is expected behavior
        if (error) {
          if (error.code === 'PGRST116') {
            return null;
          }
          // For other errors, throw to ensure they're properly handled
          console.error('Error in getByTmdbId:', {
            tmdbId,
            status,
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }
        return data;
      }
      const result = await localDb.query(
        'SELECT * FROM movies WHERE tmdb_id = $1 AND status = $2',
        [tmdbId, status]
      );
      return result.rows[0] || null;
    },
    
    async create(movieData: Partial<Movie>): Promise<Movie> {
      if (isSupabase) {
        const { data, error } = await supabase
          .from('movies')
          .insert(movieData)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      
      // Build dynamic insert query for local DB
      const fields = Object.keys(movieData);
      const values = Object.values(movieData);
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        INSERT INTO movies (${fields.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await localDb.query(query, values);
      return result.rows[0];
    },
    
    async delete(id: string): Promise<void> {
      if (isSupabase) {
        const { error } = await supabase
          .from('movies')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } else {
        await localDb.movies.delete(id);
      }
    },
  },
  
  votingSession: {
    async getCurrent(environment?: string): Promise<VotingSession | null> {
      const env = environment || process.env.NODE_ENV || 'development';
      
      if (isSupabase) {
        const { data, error } = await supabase
          .from('voting_sessions')
          .select('*')
          .eq('status', 'open')
          .eq('environment', env)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      }
      
      const result = await localDb.query(
        'SELECT * FROM voting_sessions WHERE status = $1 AND environment = $2 LIMIT 1',
        ['open', env]
      );
      return result.rows[0] || null;
    },
    
    async getById(id: string): Promise<VotingSession | null> {
      if (isSupabase) {
        const { data, error } = await supabase
          .from('voting_sessions')
          .select('*')
          .eq('id', id)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      }
      
      const result = await localDb.query(
        'SELECT * FROM voting_sessions WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    },
    
    async create(environment?: string): Promise<VotingSession> {
      const env = environment || process.env.NODE_ENV || 'development';
      
      if (isSupabase) {
        const { data, error } = await supabase
          .from('voting_sessions')
          .insert({ 
            status: 'open',
            environment: env,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      
      const result = await localDb.query(
        'INSERT INTO voting_sessions (status, environment) VALUES ($1, $2) RETURNING *',
        ['open', env]
      );
      return result.rows[0];
    },
    
    async close(id: string, winnerMovieId: string | null): Promise<void> {
      if (isSupabase) {
        const { error } = await supabase
          .from('voting_sessions')
          .update({ 
            status: 'closed', 
            ended_at: new Date().toISOString(),
            winner_movie_id: winnerMovieId
          })
          .eq('id', id);
        if (error) throw error;
      } else {
        await localDb.votingSession.close(id, winnerMovieId);
      }
    },
  },
  
  userSessions: {
    async get(id: string): Promise<UserSession | null> {
      if (isSupabase) {
        const { data, error } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('id', id)
          .single();
        if (error && error.code !== 'PGRST116') return null;
        return data;
      }
      
      const result = await localDb.query(
        'SELECT * FROM user_sessions WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    },
    
    async upsert(id: string): Promise<UserSession> {
      if (isSupabase) {
        // For Supabase, try to insert directly and handle conflicts
        // This avoids the SELECT permission issue
        const { data, error } = await supabase
          .from('user_sessions')
          .upsert({ 
            id,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })
          .select()
          .single();
        
        if (error) {
          console.error('User session upsert error:', error);
          
          // If it's a unique constraint violation, try to fetch the existing session
          if (error.code === '23505') {
            console.log('Session already exists, attempting to fetch...');
            const { data: existingSession, error: fetchError } = await supabase
              .from('user_sessions')
              .select('*')
              .eq('id', id)
              .single();
              
            if (existingSession && !fetchError) {
              return existingSession;
            }
            
            if (fetchError) {
              console.error('Failed to fetch existing session:', fetchError);
            }
          }
          
          throw error;
        }
        
        return data || { id, created_at: new Date().toISOString() };
      }
      return localDb.userSessions.upsert(id);
    },
  },
  
  votes: {
    async create(votingSessionId: string, userSessionId: string, rankings: string[]): Promise<any> {
      if (isSupabase) {
        const { data, error } = await supabase
          .from('votes')
          .insert({
            voting_session_id: votingSessionId,
            user_session_id: userSessionId,
            rankings
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      return localDb.votes.create(votingSessionId, userSessionId, rankings);
    },
    
    async getBySession(sessionId: string): Promise<any[]> {
      if (isSupabase) {
        const { data, error } = await supabase
          .from('votes')
          .select('*')
          .eq('voting_session_id', sessionId);
        if (error) throw error;
        return data || [];
      }
      return localDb.votes.getBySession(sessionId);
    },
    
    async getByUserAndSession(userSessionId: string, votingSessionId: string): Promise<any | null> {
      if (isSupabase) {
        const { data, error } = await supabase
          .from('votes')
          .select('*')
          .eq('voting_session_id', votingSessionId)
          .eq('user_session_id', userSessionId)
          .single();
        if (error && error.code !== 'PGRST116') return null;
        return data;
      }
      
      const result = await localDb.query(
        'SELECT * FROM votes WHERE voting_session_id = $1 AND user_session_id = $2',
        [votingSessionId, userSessionId]
      );
      return result.rows[0] || null;
    },
    
    async hasVoted(sessionId: string, userSessionId: string): Promise<boolean> {
      if (isSupabase) {
        const { count, error } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('voting_session_id', sessionId)
          .eq('user_session_id', userSessionId);
        if (error) throw error;
        return (count || 0) > 0;
      }
      return localDb.votes.hasVoted(sessionId, userSessionId);
    },
    
    async delete(userSessionId: string, votingSessionId: string): Promise<void> {
      if (isSupabase) {
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('voting_session_id', votingSessionId)
          .eq('user_session_id', userSessionId);
        if (error) throw error;
      } else {
        await localDb.query(
          'DELETE FROM votes WHERE voting_session_id = $1 AND user_session_id = $2',
          [votingSessionId, userSessionId]
        );
      }
    },
    
    async count(votingSessionId: string): Promise<number> {
      if (isSupabase) {
        const { count, error } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('voting_session_id', votingSessionId);
        if (error) throw error;
        return count || 0;
      }
      
      const result = await localDb.query(
        'SELECT COUNT(*) FROM votes WHERE voting_session_id = $1',
        [votingSessionId]
      );
      return parseInt(result.rows[0].count);
    },
  },
  
  // Add raw query capability for complex operations
  query: async (text: string, params?: any[]): Promise<any> => {
    if (isSupabase) {
      throw new Error('Raw queries not supported with Supabase. Use the Supabase client methods.');
    }
    return localDb.query(text, params);
  }
};

// Export localDb for direct access when needed
export { localDb };