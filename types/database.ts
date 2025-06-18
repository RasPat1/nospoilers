export interface Database {
  public: {
    Tables: {
      movies: {
        Row: {
          id: string
          title: string
          added_by_session: string | null
          status: 'candidate' | 'watched' | 'archived'
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          added_by_session?: string | null
          status?: 'candidate' | 'watched' | 'archived'
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          added_by_session?: string | null
          status?: 'candidate' | 'watched' | 'archived'
          created_at?: string
        }
      }
      voting_sessions: {
        Row: {
          id: string
          status: 'open' | 'closed'
          winner_movie_id: string | null
          created_at: string
          closed_at: string | null
        }
        Insert: {
          id?: string
          status?: 'open' | 'closed'
          winner_movie_id?: string | null
          created_at?: string
          closed_at?: string | null
        }
        Update: {
          id?: string
          status?: 'open' | 'closed'
          winner_movie_id?: string | null
          created_at?: string
          closed_at?: string | null
        }
      }
      user_sessions: {
        Row: {
          id: string
          created_at: string
        }
        Insert: {
          id?: string
          created_at?: string
        }
        Update: {
          id?: string
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          voting_session_id: string
          user_session_id: string
          rankings: string[]
          created_at: string
        }
        Insert: {
          id?: string
          voting_session_id: string
          user_session_id: string
          rankings: string[]
          created_at?: string
        }
        Update: {
          id?: string
          voting_session_id?: string
          user_session_id?: string
          rankings?: string[]
          created_at?: string
        }
      }
    }
  }
}