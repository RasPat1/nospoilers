import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    // Debug: Check what environment variables we have
    const hasPostgresUrl = !!process.env.POSTGRES_URL;
    const databaseType = process.env.DATABASE_TYPE;
    
    console.log('Database init check:', {
      hasPostgresUrl,
      databaseType,
      nodeEnv: process.env.NODE_ENV
    });
    
    // Check if we're using Postgres (Vercel or Neon)
    if (hasPostgresUrl || databaseType === 'vercel') {
      await db.init();
      return NextResponse.json({ 
        message: 'Database initialized successfully',
        database: databaseType || 'postgres',
        provider: hasPostgresUrl ? 'Neon/Vercel' : 'configured'
      });
    }
    
    // Force initialization if we're in production (temporary fix)
    if (process.env.NODE_ENV === 'production') {
      await db.init();
      return NextResponse.json({ 
        message: 'Database initialized successfully (production override)',
        database: 'postgres'
      });
    }
    
    return NextResponse.json({ 
      message: 'Database initialization only needed for Postgres databases',
      debug: {
        hasPostgresUrl,
        databaseType,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error: any) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}