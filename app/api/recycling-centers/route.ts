import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma, VerificationStatus } from '@prisma/client';
import {
  recyclingCenterQuerySchema,
  validateRequest,
  formatValidationErrors,
} from '@/lib/api/validation';
import { sortByDistance, filterByDistance } from '@/lib/utils/distance';

/**
 * GET handler to fetch recycling centers with validation
 */
export async function GET(request: NextRequest) {
  // Parse and validate query parameters
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const validation = validateRequest(recyclingCenterQuerySchema, searchParams);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: 'Ungültige Anfrageparameter',
        details: formatValidationErrors(validation.error),
      },
      { status: 400 }
    );
  }

  const { city, material, materials, search, limit, page = 1, verified, minRating, sortBy, sortOrder, lat, lng, maxDistance } = validation.data;
  
  try {
    // Build the where clause dynamically
    const where: Prisma.RecyclingCenterWhereInput = {};

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { postal_code: { contains: search, mode: 'insensitive' } },
        { address_street: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Handle multiple materials filter
    if (materials) {
      const materialIds = materials.split(',').filter(Boolean);
      if (materialIds.length > 0) {
        where.offers = {
          some: {
            material_id: { in: materialIds },
          },
        };
      }
    } else if (material) {
      // Single material by name (legacy support)
      where.offers = {
        some: {
          material: {
            name: { contains: material, mode: 'insensitive' },
          },
        },
      };
    }

    if (verified) {
      where.verification_status = VerificationStatus.VERIFIED;
    }

    // Count total matching centers for pagination
    const totalCenters = await prisma.recyclingCenter.count({ where });

    // Define orderBy
    const orderBy: Prisma.RecyclingCenterOrderByWithRelationInput =
      sortBy === 'created_at'
        ? { created_at: sortOrder }
        : { name: sortOrder };

    // Calculate pagination
    const skip = (page - 1) * limit;

    const centers = await prisma.recyclingCenter.findMany({
      where,
      select: {
        id: true,
        name: true,
        address_street: true,
        city: true,
        postal_code: true,
        slug: true,
        website: true,
        verification_status: true,
        image_url: true,
        latitude: true,
        longitude: true,
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // Process centers to calculate average rating and filter by minRating
    let processedCenters = centers.map((center) => {
      const ratings = center.reviews.map((review) => review.rating);
      const averageRating =
        ratings.length > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          : null;

      const { reviews, ...centerWithoutReviews } = center;
      return {
        ...centerWithoutReviews,
        rating: {
          average: averageRating,
          count: ratings.length,
        },
        location: {
          city: center.city,
          zipCode: center.postal_code,
          street: center.address_street,
          coordinates: center.latitude && center.longitude
            ? { lat: center.latitude, lng: center.longitude }
            : null,
        },
      };
    });

    // Filter by minimum rating if specified
    if (minRating) {
      processedCenters = processedCenters.filter(
        (center) => center.rating.average !== null && center.rating.average >= minRating
      );
    }

    // Custom sort by rating if requested
    if (sortBy === 'rating') {
      processedCenters.sort((a, b) => {
        const ratingA = a.rating.average ?? 0;
        const ratingB = b.rating.average ?? 0;
        return sortOrder === 'asc' ? ratingA - ratingB : ratingB - ratingA;
      });
    }

    // Distance-based sorting and filtering if location is provided
    if (sortBy === 'distance' && lat !== undefined && lng !== undefined) {
      // Sort centers by computed distance
      processedCenters = sortByDistance(processedCenters, lat, lng) as typeof processedCenters;

      // Filter by maxDistance if specified (recalculate to avoid relying on extra property)
      if (maxDistance) {
        processedCenters = filterByDistance(processedCenters, lat, lng, maxDistance) as typeof processedCenters;
      }
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCenters / limit);

    return NextResponse.json({
      centers: processedCenters,
      pagination: {
        page,
        totalPages,
        totalItems: totalCenters,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error('[GET Recycling Centers Error]', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Fehler beim Abrufen der Recyclingcenter',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
} 