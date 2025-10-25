import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[GET Materials Working] Starting...');
    
    // Use dynamic import to avoid compilation issues
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    
    console.log('[GET Materials Working] Prisma client created');
    
    // Test connection first
    await prisma.$connect();
    console.log('[GET Materials Working] Connected to database');
    
    const materials = await prisma.material.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: 10, // Limit for testing
    });
    
    console.log('[GET Materials Working] Found materials:', materials.length);
    console.log('[GET Materials Working] First material:', materials[0]);
    
    await prisma.$disconnect();
    console.log('[GET Materials Working] Disconnected from database');
    
    return NextResponse.json(materials);
  } catch (error) {
    console.error('[GET Materials Working Error]', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch materials', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
