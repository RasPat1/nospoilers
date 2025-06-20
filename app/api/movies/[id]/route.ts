import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { broadcastUpdate } from '@/lib/websocket-broadcast'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const movieId = params.id

    // Check if movie exists and is still a candidate
    const movie = await db.movies.getById(movieId)

    if (!movie || movie.status !== 'candidate') {
      return NextResponse.json(
        { error: 'Movie not found or already in use' },
        { status: 404 }
      )
    }

    // Delete the movie
    await db.movies.delete(movieId)

    // Broadcast the movie deletion to all connected clients
    broadcastUpdate({
      type: 'movie_deleted',
      movieId: movieId
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error deleting movie:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}