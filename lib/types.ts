export interface Movie {
  id: string
  title: string
  status: string
  created_at: string
  poster_path?: string
  backdrop_path?: string
  release_date?: string
  vote_average?: number
  rotten_tomatoes_url?: string
  rotten_tomatoes_score?: number
  tmdb_id?: number
  director?: string
  actors?: string[]
  plot?: string
}

export interface VotingSession {
  id: string
  status: string
  winner_movie_id: string | null
}

export interface UserSession {
  id: string
  created_at: string
}

export interface Vote {
  id: string
  voting_session_id: string
  user_session_id: string
  rankings: string[]
  created_at: string
}