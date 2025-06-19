import { supabase } from './supabase';
import { localDb } from './database-local';

// Use local database if configured, otherwise use Supabase
export const db = process.env.USE_LOCAL_DB === 'true' ? localDb : {
  movies: {
    async getAll() {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    
    async create(title: string) {
      const { data, error } = await supabase
        .from('movies')
        .insert([{ title }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    
    async delete(id: string) {
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },
  
  votingSession: {
    async getCurrent() {
      const { data, error } = await supabase
        .from('voting_sessions')
        .select('*')
        .eq('status', 'open')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    
    async create() {
      const { data, error } = await supabase
        .from('voting_sessions')
        .insert([{}])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    
    async close(id: string, winnerMovieId: string | null) {
      const { error } = await supabase
        .from('voting_sessions')
        .update({ 
          status: 'closed', 
          ended_at: new Date().toISOString(),
          winner_movie_id: winnerMovieId
        })
        .eq('id', id);
      if (error) throw error;
    },
  },
  
  userSessions: {
    async upsert(id: string) {
      const { data, error } = await supabase
        .from('user_sessions')
        .upsert({ id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },
  
  votes: {
    async create(sessionId: string, userSessionId: string, rankings: Record<string, number>) {
      const { data, error } = await supabase
        .from('votes')
        .insert([{
          voting_session_id: sessionId,
          user_session_id: userSessionId,
          rankings
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    
    async getBySession(sessionId: string) {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('voting_session_id', sessionId);
      if (error) throw error;
      return data || [];
    },
    
    async hasVoted(sessionId: string, userSessionId: string) {
      const { count, error } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('voting_session_id', sessionId)
        .eq('user_session_id', userSessionId);
      if (error) throw error;
      return (count || 0) > 0;
    },
  },
};