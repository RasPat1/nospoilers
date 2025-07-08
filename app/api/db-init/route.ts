import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    // Check if we're using Postgres (Vercel or Neon)
    if (process.env.POSTGRES_URL || process.env.DATABASE_TYPE === 'vercel') {
      await db.init();
      return NextResponse.json({ 
        message: 'Database initialized successfully',
        database: process.env.DATABASE_TYPE || 'postgres'
      });
    }
    return NextResponse.json({ message: 'Database initialization only needed for Postgres databases' });
  } catch (error: any) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}