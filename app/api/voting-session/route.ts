import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('sessionId')
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'

  console.log('Getting voting session for environment:', environment)

  // Get current voting session for this environment
  let session = null
  try {
    session = await db.votingSession.getCurrent(environment)
  } catch (error) {
    console.error('Error fetching voting session:', error)
  }

  let hasVoted = false
  
  if (session && sessionId) {
    try {
      hasVoted = await db.votes.hasVoted(session.id, sessionId)
      console.log('Vote check:', { sessionId, votingSessionId: session.id, hasVoted })
    } catch (error) {
      console.error('Error checking for existing vote:', error)
    }
  }

  return NextResponse.json({ session, hasVoted })
}