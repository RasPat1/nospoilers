import { NextRequest, NextResponse } from 'next/server'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

// Fetch detailed movie info including credits
async function fetchMovieDetails(movieId: number) {
  if (!TMDB_API_KEY) return null

  try {
    // Fetch movie details and credits in parallel
    const [detailsRes, creditsRes] = await Promise.all([
      fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`),
      fetch(`${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`)
    ])

    if (!detailsRes.ok || !creditsRes.ok) return null

    const details = await detailsRes.json()
    const credits = await creditsRes.json()

    // Get director
    const director = credits.crew?.find((person: any) => person.job === 'Director')?.name || ''

    // Get top 5 actors
    const actors = credits.cast?.slice(0, 5).map((actor: any) => actor.name) || []

    // Get genres
    const genres = details.genres?.map((genre: any) => genre.name) || []

    return { ...details, director, actors, genres }
  } catch (error) {
    console.error('Error fetching movie details:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')
  const movieId = searchParams.get('movieId')

  // If movieId is provided, fetch full details for a single movie
  if (movieId) {
    const details = await fetchMovieDetails(parseInt(movieId))
    if (!details) {
      return NextResponse.json({ error: 'Failed to fetch movie details' }, { status: 500 })
    }

    const movieYear = details.release_date ? new Date(details.release_date).getFullYear() : ''
    const searchTitle = details.title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
    
    const rottenTomatoesUrl = movieYear 
      ? `https://www.rottentomatoes.com/m/${searchTitle}_${movieYear}`
      : `https://www.rottentomatoes.com/m/${searchTitle}`

    return NextResponse.json({
      tmdb_id: details.id,
      title: details.title,
      release_date: details.release_date,
      poster_path: details.poster_path,
      backdrop_path: details.backdrop_path,
      vote_average: details.vote_average,
      plot: details.overview,
      director: details.director,
      actors: details.actors,
      rotten_tomatoes_url: rottenTomatoesUrl
    })
  }

  // Otherwise, perform search
  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  if (!TMDB_API_KEY) {
    console.error('TMDB_API_KEY not configured')
    return NextResponse.json({ results: [] })
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    )

    if (!response.ok) {
      throw new Error('Failed to search movies')
    }

    const data = await response.json()
    
    // Transform results and fetch details for top results
    const topResults = data.results.slice(0, 5)
    const resultsWithDetails = await Promise.all(
      topResults.map(async (movie: any) => {
        const details = await fetchMovieDetails(movie.id)
        const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
        
        return {
          id: movie.id,
          title: movie.title,
          year,
          release_date: movie.release_date,
          poster_path: movie.poster_path,
          vote_average: movie.vote_average,
          overview: movie.overview,
          director: details?.director,
          actors: details?.actors,
          genres: details?.genres
        }
      })
    )

    return NextResponse.json({ results: resultsWithDetails })
  } catch (error) {
    console.error('Error searching movies:', error)
    return NextResponse.json({ error: 'Failed to search movies' }, { status: 500 })
  }
}