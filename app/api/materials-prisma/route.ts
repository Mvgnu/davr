import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[GET Materials Prisma] Starting...');
    
    // Use require instead of import to avoid compilation issues
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    console.log('[GET Materials Prisma] Prisma client created');
    
    const materials = await prisma.material.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: 5, // Limit for testing
    });
    
    console.log('[GET Materials Prisma] Found materials:', materials.length);
    
    await prisma.$disconnect();
    
    return NextResponse.json(materials);
  } catch (error: unknown) {
    console.error('[GET Materials Prisma Error]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch materials', details: message },
      { status: 500 }
    );
  }
}
