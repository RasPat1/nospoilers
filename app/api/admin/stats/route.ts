import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
    
    // Get counts for current environment
    const [moviesResult, votesResult, sessionsResult] = await Promise.all([
      supabase.from('movies').select('id', { count: 'exact' }),
      supabase.from('votes').select('id', { count: 'exact' }),
      supabase.from('voting_sessions').select('id', { count: 'exact' }).eq('environment', environment)
    ])

    return NextResponse.json({
      totalMovies: moviesResult.count || 0,
      totalVotes: votesResult.count || 0,
      totalSessions: sessionsResult.count || 0
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}