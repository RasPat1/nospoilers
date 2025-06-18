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
  const { title, sessionId } = await request.json()

  if (!title || title.trim().length === 0) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const { data: movie, error } = await supabase
    .from('movies')
    .insert({
      title: title.trim(),
      added_by_session: sessionId
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ movie })
}