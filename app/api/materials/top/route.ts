import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

// Define the structure for the popular material result including the count
interface TopMaterialResult {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    parent_id: string | null;
    created_at: Date;
    updated_at: Date;
    centers_count: number;
}

export async function GET() {
  try {
    // 1. Find the top 10 material IDs based on center count
    const topMaterialsGrouped = await prisma.recyclingCenterOffer.groupBy({
      by: ['material_id'],
      _count: {
        recycling_center_id: true
      },
      orderBy: {
        _count: {
          recycling_center_id: 'desc'
        }
      },
      take: 10,
    });

    const topMaterialIds = topMaterialsGrouped.map(m => m.material_id);
    const centerCountsMap = new Map(topMaterialsGrouped.map(m => [m.material_id, m._count.recycling_center_id]));

    // 2. Fetch full details for these top 10 materials
    const topMaterialsDetails = await prisma.material.findMany({
      where: {
        id: { in: topMaterialIds }
      }
    });

    // 3. Combine details with counts and sort according to original ranking
    const topMaterialsWithCounts: TopMaterialResult[] = topMaterialsDetails.map(material => ({
      ...material,
      centers_count: centerCountsMap.get(material.id) || 0
    })).sort((a, b) => {
      const countA = centerCountsMap.get(a.id) || 0;
      const countB = centerCountsMap.get(b.id) || 0;
      return countB - countA;
    });

    return NextResponse.json({ 
      success: true, 
      data: topMaterialsWithCounts 
    });
  } catch (error) {
    console.error('Error fetching top materials [Prisma]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch top materials' },
      { status: 500 }
    );
  }
} 