import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma, VerificationStatus } from '@prisma/client'; // Import Prisma types

/**
 * GET handler to fetch recycling centers
 */
export async function GET(request: NextRequest) {
  // Get search parameters from the URL
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get('city');
  const material = searchParams.get('material');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '100');
  const verified = searchParams.get('verified') === 'true';
  const sort = searchParams.get('sort') || 'name'; // Default sort by name
  
  try {
    // Build the where clause dynamically
    let where: Prisma.RecyclingCenterWhereInput = {};

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { postal_code: { contains: search, mode: 'insensitive' } },
        // Add other searchable fields if needed (e.g., address_street)
      ];
    }

    if (material) {
      // Filter by checking if the center has at least one offer 
      // for a material with a matching name.
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

    // Define orderBy based on sort parameter
    let orderBy: Prisma.RecyclingCenterOrderByWithRelationInput | Prisma.RecyclingCenterOrderByWithRelationInput[] = {};
    
    // For rating, we'll use reviews
    if (sort === 'rating') {
      // We'll get all centers and then sort them manually by average review rating
      orderBy = { name: 'asc' }; // Default sort for now
    } else {
      orderBy = { name: 'asc' };
    }

    const centers = await prisma.recyclingCenter.findMany({
      where, // Apply the dynamically built where clause
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
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy,
      take: limit,
    });

    // Process centers to calculate average rating if needed
    const processedCenters = centers.map(center => {
      // Calculate average rating if we have reviews
      const ratings = center.reviews.map(review => review.rating);
      const averageRating = ratings.length 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : null;
      
      // Return the center with the calculated rating and without the reviews array
      const { reviews, ...centerWithoutReviews } = center;
      return {
        ...centerWithoutReviews,
        rating: averageRating,
      };
    });

    // Custom sort by rating if requested
    if (sort === 'rating') {
      processedCenters.sort((a, b) => {
        // Null ratings go to the end
        if (a.rating === null) return 1;
        if (b.rating === null) return -1;
        // Higher ratings first
        return b.rating - a.rating;
      });
      
      // Limit after sorting for accurate top rated centers
      return NextResponse.json(processedCenters.slice(0, limit));
    }

    return NextResponse.json(processedCenters);

  } catch (error) {
    console.error('[GET Recycling Centers Error with Filters]', error);
    return NextResponse.json(
      { error: 'Failed to fetch recycling centers' },
      { status: 500 }
    );
  }
} 