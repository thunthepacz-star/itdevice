import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Ping DB connection
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      timezone: 'Asia/Bangkok',
      database: 'connected',
      version: '1.0.0',
    });
  } catch (err: unknown) {
    console.error('Database health check failed:', err);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: 'Database connection unavailable',
      },
      { status: 503 }
    );
  }
}
