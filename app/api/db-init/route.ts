import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    if (process.env.DATABASE_TYPE === 'vercel') {
      await db.init();
      return NextResponse.json({ message: 'Database initialized successfully' });
    }
    return NextResponse.json({ message: 'Database initialization only needed for Vercel Postgres' });
  } catch (error: any) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}