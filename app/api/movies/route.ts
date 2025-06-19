import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
      plot
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
    return NextResponse.json({ movie })
  } catch (error) {
    console.error('Unexpected error in POST /api/movies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}