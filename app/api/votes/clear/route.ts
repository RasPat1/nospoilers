import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    
    console.log('Clear vote request for session:', sessionId)
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Get current open voting session for this environment
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
    
    const votingSession = await db.votingSession.getCurrent(environment)

    if (!votingSession) {
      return NextResponse.json({ error: 'No active voting session' }, { status: 404 })
    }

    // First, check if vote exists
    const existingVote = await db.votes.getByUserAndSession(sessionId, votingSession.id)
    
    console.log('Existing vote before delete:', existingVote)
    
    if (!existingVote) {
      return NextResponse.json({ 
        success: true, 
        message: 'No vote to clear', 
        deletedCount: 0 
      })
    }

    // Delete the user's vote
    await db.votes.delete(sessionId, votingSession.id)
    
    console.log('Vote deleted successfully')
    
    // Verify deletion
    const remainingVote = await db.votes.getByUserAndSession(sessionId, votingSession.id)
    console.log('Remaining vote after delete:', remainingVote)
    
    return NextResponse.json({ success: true, message: 'Vote cleared successfully', deletedCount: 1 })
  } catch (error) {
    console.error('Unexpected error clearing vote:', error)
    return NextResponse.json({ error: 'Failed to clear vote' }, { status: 500 })
  }
}