import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma'; // Use Prisma client
import { Prisma } from '@prisma/client'; // Import Prisma types

export interface RecyclingStats {
  totalCenters: number;
  totalMaterials: number;
  recyclingRate: number; // Keep placeholder value
  totalCities?: number;
  acceptanceRatio?: {
    recycling: number;
    purchase: number;
  };
  popularMaterials?: Array<{
    id: string; // Changed to string as Prisma uses CUIDs
    name: string;
    // category: string; // Removed category as it's not on Material model
    centerCount: number;
  }>;
}

/**
 * GET handler to fetch recycling center statistics using Prisma
 */
export async function GET() {
  try {
    // Get total centers count
    const totalCenters = await prisma.recyclingCenter.count();

    // Get total materials count
    const totalMaterials = await prisma.material.count();

    // Get total distinct cities count
    const distinctCitiesResult = await prisma.recyclingCenter.findMany({
      select: { city: true },
      distinct: ['city'],
      where: { city: { not: null } } // Ensure city is not null
    });
    const totalCities = distinctCitiesResult.length;

    // Get count of distinct centers that purchase materials (price_per_unit > 0)
    const purchaseCentersResult = await prisma.recyclingCenterOffer.groupBy({
      by: ['recycling_center_id'],
      where: {
        price_per_unit: { gt: 0 }
      },
      _count: {
        recycling_center_id: true
      }
    });
    const purchaseCenters = purchaseCentersResult.length; // Count of groups is the count of distinct centers

    // Calculate acceptance ratio
    const acceptanceRatio = {
      recycling: 1, // Assuming all centers accept recycling
      purchase: totalCenters > 0 ? purchaseCenters / totalCenters : 0
    };

    // Get popular materials (top 5 by number of centers offering them)
    const popularMaterialsGrouped = await prisma.recyclingCenterOffer.groupBy({
      by: ['material_id'],
      _count: {
        recycling_center_id: true // Count distinct centers per material
      },
      orderBy: {
        _count: {
          recycling_center_id: 'desc'
        }
      },
      take: 5,
    });
    
    // Fetch material details for the top 5 IDs
    const topMaterialIds = popularMaterialsGrouped.map(p => p.material_id);
    const topMaterialDetails = await prisma.material.findMany({
        where: { id: { in: topMaterialIds } },
        select: { id: true, name: true }
    });
    const materialDetailsMap = new Map(topMaterialDetails.map(m => [m.id, m]));

    // Map results to desired format
    const popularMaterials = popularMaterialsGrouped.map(group => ({
        id: group.material_id,
        name: materialDetailsMap.get(group.material_id)?.name ?? 'Unknown Material',
        centerCount: group._count.recycling_center_id
    }));

    // Placeholder recycling rate
    const recyclingRate = 0.65; 

    const stats: RecyclingStats = {
      totalCenters,
      totalMaterials,
      recyclingRate,
      totalCities,
      acceptanceRatio,
      popularMaterials
    };

    return NextResponse.json({
      success: true, // Added success flag for consistency
      data: stats
    });
  } catch (error) {
    console.error('Error fetching recycling statistics [Prisma]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recycling statistics' }, 
      { status: 500 }
    );
  }
} 