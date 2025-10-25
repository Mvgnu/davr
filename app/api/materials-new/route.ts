import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[GET Materials New] Starting...');
    
    // Import Prisma dynamically
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
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
    
    console.log('[GET Materials New] Found materials:', materials.length);
    
    await prisma.$disconnect();
    
    return NextResponse.json(materials);
  } catch (error) {
    console.error('[GET Materials New Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}
