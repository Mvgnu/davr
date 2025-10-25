import { NextRequest, NextResponse } from 'next/server';
import { runMigrations, seedDatabase } from '@/lib/db/migrations';
import { getServerSession } from 'next-auth';

/**
 * POST handler to initialize the database with migrations and seed data
 * This endpoint is only available in development mode or for admin users
 */
export async function POST(request: NextRequest) {
  try {
    // Check if in development environment
    const isDev = process.env.NODE_ENV === 'development';
    
    // Or check if user is admin in production
    let isAdmin = false;
    if (!isDev) {
      const session = await getServerSession();
      isAdmin = session?.user?.role === 'ADMIN';
    }
    
    // Only allow in development or for admin users
    if (!isDev && !isAdmin) {
      return NextResponse.json({
        error: 'Unauthorized: This endpoint is only available in development or for admin users',
        success: false
      }, { status: 403 });
    }
    
    // Run migrations
    await runMigrations();
    
    // Seed database if requested
    const { searchParams } = new URL(request.url);
    const shouldSeed = searchParams.get('seed') === 'true';
    
    if (shouldSeed) {
      await seedDatabase();
    }
    
    return NextResponse.json({
      message: `Database initialization complete. ${shouldSeed ? 'Database was seeded with sample data.' : ''}`,
      success: true
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json({
      error: 'Failed to initialize database',
      details: error instanceof Error ? error.message : String(error),
      success: false
    }, { status: 500 });
  }
} 