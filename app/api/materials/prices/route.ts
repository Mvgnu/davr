import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma'; // Use Prisma client
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic'; // Mark route as dynamic

interface PriceStats {
    materialId: string;
    materialName: string;
    // category: string | null; // Category doesn't seem to exist on Material
    offerCount: number;
    minPrice: number | null;
    maxPrice: number | null;
    avgPrice: number | null;
    priceTrend: null; // Placeholder
}

/**
 * GET handler for fetching material price statistics using Prisma
 * Revised approach: Query offers and aggregate in code.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get('materialId');
    // const category = searchParams.get('category'); // Category filter removed
    
    // Build Prisma WHERE clause for filtering offers
    let offerWhere: Prisma.RecyclingCenterOfferWhereInput = {
        price_per_unit: { not: null }, // Only include offers with a price
        // Removed active filter
    };
    
    if (materialId) {
      offerWhere.material_id = materialId;
    }
    
    // --- Removed category filter as Material model lacks category ---
    // if (category) { 
    //   // This would require including the Material relation and filtering on it
    //   offerWhere.material = { 
    //       category: { contains: category, mode: 'insensitive' } 
    //   }; 
    // }

    // Fetch relevant offers including material details
    const offers = await prisma.recyclingCenterOffer.findMany({
        where: offerWhere,
        select: {
            material_id: true,
            price_per_unit: true,
            material: { // Include material to get the name
                select: { id: true, name: true }
            }
        }
    });

    // Group offers by material and calculate statistics
    const statsMap = new Map<string, { name: string; prices: number[] }>();

    offers.forEach(offer => {
        if (offer.price_per_unit !== null && offer.material) { // Ensure price and material exist
            const materialKey = offer.material.id;
            if (!statsMap.has(materialKey)) {
                statsMap.set(materialKey, { name: offer.material.name, prices: [] });
            }
            statsMap.get(materialKey)?.prices.push(offer.price_per_unit);
        }
    });

    // Format the statistics
    const priceStats: PriceStats[] = Array.from(statsMap.entries()).map(([id, data]) => {
        const offerCount = data.prices.length;
        let minPrice: number | null = null;
        let maxPrice: number | null = null;
        let avgPrice: number | null = null;

        if (offerCount > 0) {
            minPrice = Math.min(...data.prices);
            maxPrice = Math.max(...data.prices);
            avgPrice = data.prices.reduce((sum, price) => sum + price, 0) / offerCount;
        }

        return {
            materialId: id,
            materialName: data.name,
            offerCount: offerCount,
            minPrice: minPrice,
            maxPrice: maxPrice,
            avgPrice: avgPrice,
            priceTrend: null // Placeholder
        };
    });
    
    // Sort results (optional, e.g., by name)
    priceStats.sort((a, b) => a.materialName.localeCompare(b.materialName));

    return NextResponse.json({
      success: true,
      data: priceStats
    });

  } catch (error) {
    console.error('Error fetching material price statistics [Prisma]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material price statistics', success: false },
      { status: 500 }
    );
  }
} 