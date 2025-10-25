import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { calculateDistance } from '@/lib/utils/distance';

/**
 * GET /api/materials/[slug]/nearby-centers
 * Returns recycling centers that accept a specific material, optionally sorted by distance
 * Query params:
 * - lat: number - User latitude
 * - lng: number - User longitude
 * - limit: number - Max results (default: 10)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);

    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // First, get the material
    const material = await prisma.material.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    // Get centers that accept this material
    const centers = await prisma.recyclingCenter.findMany({
      where: {
        verification_status: 'VERIFIED',
        offers: {
          some: {
            material_id: material.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        address_street: true,
        city: true,
        postal_code: true,
        latitude: true,
        longitude: true,
        phone_number: true,
        website: true,
        email: true,
        image_url: true,
        verification_status: true,
        offers: {
          where: {
            material_id: material.id,
          },
          select: {
            price_per_unit: true,
            unit: true,
            notes: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      take: limit * 2, // Get more initially for distance filtering
    });

    // If location provided, calculate distances and sort
    let processedCenters = centers.map((center) => {
      let distance: number | null = null;

      if (lat && lng && center.latitude && center.longitude) {
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);

        if (!isNaN(userLat) && !isNaN(userLng)) {
          distance = calculateDistance(userLat, userLng, center.latitude, center.longitude);
        }
      }

      return {
        ...center,
        distance,
        material_offer: center.offers[0] || null,
      };
    });

    // Sort by distance if available, otherwise by name
    if (lat && lng) {
      processedCenters.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    } else {
      processedCenters.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Limit results
    processedCenters = processedCenters.slice(0, limit);

    return NextResponse.json({
      material: {
        id: material.id,
        name: material.name,
      },
      centers: processedCenters.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        address_street: c.address_street,
        city: c.city,
        postal_code: c.postal_code,
        latitude: c.latitude,
        longitude: c.longitude,
        distance: c.distance,
        phone_number: c.phone_number,
        website: c.website,
        email: c.email,
        image_url: c.image_url,
        verification_status: c.verification_status,
        review_count: c._count.reviews,
        material_offer: c.material_offer,
      })),
      total_count: centers.length,
      returned_count: processedCenters.length,
    });
  } catch (error) {
    console.error('[Nearby Centers Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch nearby centers' },
      { status: 500 }
    );
  }
}
