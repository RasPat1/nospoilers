import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const votingSessionId = searchParams.get('votingSessionId')
    
    if (!votingSessionId) {
      return NextResponse.json({ error: 'Voting session ID is required' }, { status: 400 })
    }

    const { data, error, count } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('voting_session_id', votingSessionId)

    if (error) {
      console.error('Error getting vote count:', error)
      return NextResponse.json({ error: 'Failed to get vote count' }, { status: 500 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error('Unexpected error in vote count:', error)
    return NextResponse.json({ error: 'Failed to get vote count' }, { status: 500 })
  }
}