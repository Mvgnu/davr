import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[GET Materials Simple] Starting...');
    
    // Import Prisma dynamically to avoid compilation issues
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
      take: 5, // Limit to 5 for testing
    });
    
    console.log('[GET Materials Simple] Found materials:', materials.length);
    
    await prisma.$disconnect();
    
    return NextResponse.json(materials);
  } catch (error) {
    console.error('[GET Materials Simple Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}
