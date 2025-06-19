import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { broadcastUpdate } from '@/lib/websocket-broadcast'

export async function GET() {
  const { data: movies, error } = await supabase
    .from('movies')
    .select('*')
    .eq('status', 'candidate')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ movies })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('POST /api/movies - Request body:', body)
    
    const { 
      title, 
      sessionId, 
      tmdb_id,
      poster_path,
      backdrop_path,
      release_date,
      vote_average,
      overview,
      rotten_tomatoes_url,
      rotten_tomatoes_score,
      director,
      actors,
      plot,
      genres
    } = body

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const movieData: any = {
      title: title.trim(),
      added_by_session: sessionId
    }

    // Add optional fields if provided
    if (tmdb_id) movieData.tmdb_id = tmdb_id
    if (poster_path) movieData.poster_path = poster_path
    if (backdrop_path) movieData.backdrop_path = backdrop_path
    if (release_date) movieData.release_date = release_date
    if (vote_average !== undefined) movieData.vote_average = vote_average
    if (overview) movieData.overview = overview
    if (rotten_tomatoes_url) movieData.rotten_tomatoes_url = rotten_tomatoes_url
    if (rotten_tomatoes_score !== undefined) movieData.rotten_tomatoes_score = rotten_tomatoes_score
    if (director) movieData.director = director
    if (actors && actors.length > 0) movieData.actors = actors
    if (plot) movieData.plot = plot
    if (genres && genres.length > 0) movieData.genres = genres

    // Check if movie with same TMDB ID already exists
    if (tmdb_id) {
      const { data: existingMovie, error: checkError } = await supabase
        .from('movies')
        .select('*')
        .eq('tmdb_id', tmdb_id)
        .eq('status', 'candidate')
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is what we want
        console.error('Error checking for existing movie:', checkError)
        return NextResponse.json({ error: 'Failed to check for existing movie' }, { status: 500 })
      }
      
      if (existingMovie) {
        console.log('Movie already exists:', existingMovie)
        return NextResponse.json({ 
          error: 'This movie has already been added', 
          movie: existingMovie 
        }, { status: 409 })
      }
    }

    console.log('Inserting movie data:', movieData)

    const { data: movie, error } = await supabase
      .from('movies')
      .insert(movieData)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Movie created successfully:', movie)
    
    // Broadcast the new movie to all connected clients
    broadcastUpdate({
      type: 'movie_added',
      movie: movie
    })
    
    return NextResponse.json({ movie })
  } catch (error) {
    console.error('Unexpected error in POST /api/movies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}