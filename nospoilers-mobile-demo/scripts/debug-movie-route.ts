// Enhanced version of /app/api/movies/route.ts with better error handling for production debugging
// Copy this to replace the existing route temporarily to debug the issue

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { broadcastUpdate } from '@/lib/websocket-broadcast'

export async function GET() {
  try {
    const movies = await db.movies.getByStatus('candidate')
    return NextResponse.json({ movies })
  } catch (error: any) {
    console.error('GET /api/movies error:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('POST /api/movies - Request body:', JSON.stringify(body, null, 2))
    
    // Log environment info
    console.log('Environment info:', {
      DATABASE_TYPE: process.env.DATABASE_TYPE,
      NODE_ENV: process.env.NODE_ENV,
      HAS_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      HAS_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      HAS_SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
      HAS_TMDB_KEY: !!process.env.TMDB_API_KEY
    })
    
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
      try {
        console.log('Checking for existing movie with TMDB ID:', tmdb_id)
        const existingMovie = await db.movies.getByTmdbId(tmdb_id, 'candidate')
        
        if (existingMovie) {
          console.log('Movie already exists:', existingMovie)
          return NextResponse.json({ 
            error: 'This movie has already been added', 
            movie: existingMovie 
          }, { status: 409 })
        }
      } catch (checkError: any) {
        console.error('Error checking for existing movie:', {
          message: checkError.message,
          code: checkError.code,
          detail: checkError.detail,
          hint: checkError.hint
        })
        return NextResponse.json({ 
          error: 'Failed to check for existing movie',
          details: process.env.NODE_ENV === 'development' ? checkError.message : undefined
        }, { status: 500 })
      }
    }

    console.log('Inserting movie data:', JSON.stringify(movieData, null, 2))

    try {
      const movie = await db.movies.create(movieData)
      console.log('Movie created successfully:', movie)
      
      // Broadcast the new movie to all connected clients
      try {
        await broadcastUpdate({
          type: 'movie_added',
          movie: movie
        })
      } catch (broadcastError) {
        // Don't fail the request if broadcast fails
        console.error('Broadcast error (non-fatal):', broadcastError)
      }
      
      return NextResponse.json({ movie })
    } catch (dbError: any) {
      console.error('Database error adding movie:', {
        message: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
        hint: dbError.hint,
        table: dbError.table,
        constraint: dbError.constraint,
        schema: dbError.schema,
        severity: dbError.severity,
        // Log the full error object in production for debugging
        fullError: JSON.stringify(dbError, null, 2)
      })
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to add movie'
      let statusCode = 500
      
      if (dbError.code === '42501') {
        errorMessage = 'Permission denied. This might be due to Row Level Security policies.'
        console.error('RLS Issue: Make sure SUPABASE_SERVICE_KEY is set in production')
      } else if (dbError.code === '23505') {
        errorMessage = 'A movie with this information already exists'
        statusCode = 409
      } else if (dbError.code === '42P01') {
        errorMessage = 'Database table not found. Migration may be needed.'
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        code: dbError.code,
        // Include details in development
        ...(process.env.NODE_ENV === 'development' && {
          details: dbError.message,
          hint: dbError.hint
        })
      }, { status: statusCode })
    }
  } catch (error: any) {
    console.error('Unexpected error in POST /api/movies:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json({ 
      error: 'Internal server error',
      // Include message in development
      ...(process.env.NODE_ENV === 'development' && {
        message: error.message
      })
    }, { status: 500 })
  }
}