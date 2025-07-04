import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma'; // Use Prisma client
import { getMaterialByValue } from '@/lib/constants/materials'; // Keep for validation/info
import { Prisma } from '@prisma/client'; // Import Prisma namespace

export const dynamic = 'force-dynamic'; // Mark route as dynamic

/**
 * Handler for GET request to find recycling centers buying a specific material
 * Query parameters:
 * - material: Required. Material identifier (e.g., 'aluminum-cans')
 * - page: Optional. Page number for pagination (default: 1)
 * - limit: Optional. Items per page (default: 10)
 * - city: Optional. City filter
 * - postalCode: Optional. Postal code filter
 * - TODO: Add city/postalCode filtering if needed instead of geo
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const materialValue = searchParams.get('material'); // e.g., 'aluminum-cans'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const city = searchParams.get('city'); // Add city filter
    const postalCode = searchParams.get('postalCode'); // Add postal code filter
    const skip = (page - 1) * limit;

    if (!materialValue) {
      return NextResponse.json({ success: false, error: 'Material identifier is required' }, { status: 400 });
    }

    // 1. Find Material ID from DB based on value/slug (using Prisma)
    let materialDbId: string | null = null;
    const materialInfo = getMaterialByValue(materialValue); // Get info from constants
    
    try {
      const materialResult = await prisma.material.findUnique({
        where: { slug: materialValue }, // Corrected: Use slug instead of value
        select: { id: true }
      });

      if (materialResult) {
        materialDbId = materialResult.id;
      } else {
        console.warn(`Material with slug '${materialValue}' not found in DB.`); // Updated warning
        return NextResponse.json({
          success: true,
          centers: [],
          pagination: { total: 0, page, limit, totalPages: 0 },
          material: materialInfo
        });
      }
    } catch (dbError) {
      console.error('Error fetching material ID [Prisma]:', dbError);
      return NextResponse.json({ success: false, error: 'Database error checking material' }, { status: 500 });
    }
    
    // 2. Fetch Centers buying this material with Pagination (using Prisma)
    try {
      const whereClause: Prisma.RecyclingCenterWhereInput = {
        AND: [
          {
            offers: {
              some: {
                material_id: materialDbId,
                price_per_unit: { not: null }
              }
            }
          },
          ...(city ? [{ city: { contains: city, mode: Prisma.QueryMode.insensitive } }] : []),
          ...(postalCode ? [{ postal_code: { startsWith: postalCode } }] : []),
        ]
      };

      // Query for total count
      const total = await prisma.recyclingCenter.count({ where: whereClause });

      // Query for centers with offers for the specific material
      const centersResult = await prisma.recyclingCenter.findMany({
        where: whereClause,
        include: {
          offers: {
            where: {
              material_id: materialDbId,
              price_per_unit: { not: null }
            },
            include: {
              material: { select: { name: true } }
            },
            orderBy: {
              price_per_unit: 'desc'
            }
          }
        },
        orderBy: {
          name: 'asc'
        },
        skip: skip,
        take: limit,
      });

      // Format the response: group offers by center
      const formattedCenters = centersResult.map(center => ({
        id: center.id,
        name: center.name,
        slug: center.slug,
        address: center.address_street,
        city: center.city,
        postalCode: center.postal_code,
        description: null,
        images: null,
        buyMaterials: center.offers.map(offer => ({
          materialId: offer.material_id,
          materialName: offer.material.name,
          price: offer.price_per_unit, 
          minQuantity: null,
          maxQuantity: null,
          notes: offer.notes,
          active: null
        }))
      }));

      return NextResponse.json({
        success: true,
        centers: formattedCenters,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        material: materialInfo
      });

    } catch (dbError) {
      console.error('Error fetching recycling centers by material [Prisma]:', dbError);
      return NextResponse.json({ success: false, error: 'Failed to fetch recycling centers' }, { status: 500 });
    }

  } catch (error) {
    // Catch errors from parsing query params, etc.
    console.error('Error processing request in /api/marketplace/materials:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: 'Failed to process request', details: errorMessage }, { status: 500 });
  }
} 