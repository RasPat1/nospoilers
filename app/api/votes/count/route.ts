import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const votingSessionId = searchParams.get('votingSessionId')
    
    if (!votingSessionId) {
      return NextResponse.json({ error: 'Voting session ID is required' }, { status: 400 })
    }

    const count = await db.votes.count(votingSessionId)

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Unexpected error in vote count:', error)
    return NextResponse.json({ error: 'Failed to get vote count' }, { status: 500 })
  }
}