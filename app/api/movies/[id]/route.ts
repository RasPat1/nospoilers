import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const movieId = params.id

    // Check if movie exists and is still a candidate
    const { data: movie, error: fetchError } = await supabase
      .from('movies')
      .select('*')
      .eq('id', movieId)
      .eq('status', 'candidate')
      .single()

    if (fetchError || !movie) {
      return NextResponse.json(
        { error: 'Movie not found or already in use' },
        { status: 404 }
      )
    }

    // Delete the movie
    const { error: deleteError } = await supabase
      .from('movies')
      .delete()
      .eq('id', movieId)

    if (deleteError) {
      console.error('Error deleting movie:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete movie' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error deleting movie:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}