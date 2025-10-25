import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { Prisma, ListingType, ListingStatus } from '@prisma/client';
import {
  marketplaceQuerySchema,
  createListingSchema,
  validateRequest,
  formatValidationErrors,
} from '@/lib/api/validation';

/**
 * GET handler: Fetch marketplace listings with comprehensive filtering & pagination
 */
export async function GET(request: NextRequest) {
  // Parse and validate query parameters
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const validation = validateRequest(marketplaceQuerySchema, searchParams);

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

  const {
    page,
    limit,
    search,
    materialId,
    location,
    type,
    status,
    sellerId,
    minPrice,
    maxPrice,
  } = validation.data;

  try {
    // Build where clause dynamically with proper typing
    const whereClause: Prisma.MarketplaceListingWhereInput = {};

    // Search filter
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Material filter
    if (materialId) {
      whereClause.material_id = materialId;
    }

    // Location filter
    if (location) {
      whereClause.location = { contains: location, mode: 'insensitive' };
    }
    
    // Distance filter would go here - requires location data for listings
    // For now, we'll just log that distance filter was requested
    // if (maxDistance) {
    //   console.log(`Distance filter requested: ${maxDistance}km, but no location data available for listings`);
    //   // In a full implementation, this would filter based on listing location vs user location
    // }

    // Type filter (BUY/SELL)
    if (type) {
      whereClause.type = type;
    }

    // Status filter
    if (status) {
      whereClause.status = status;
    } else {
      // Default to ACTIVE listings for public view
      // Admins will be able to see all statuses through their special endpoint
      whereClause.status = ListingStatus.ACTIVE;
    }

    // Seller filter
    if (sellerId) {
      whereClause.seller_id = sellerId;
    }

    // Price range filter (note: requires price field in schema)
    // This is a placeholder for when price fields are added
    // if (minPrice || maxPrice) {
    //   whereClause.price = {};
    //   if (minPrice) whereClause.price.gte = minPrice;
    //   if (maxPrice) whereClause.price.lte = maxPrice;
    // }

    // Count total matching listings
    const totalListings = await prisma.marketplaceListing.count({
      where: whereClause,
    });

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch paginated and filtered listings with seller info
    const listings = await prisma.marketplaceListing.findMany({
      where: whereClause,
      include: {
        material: { select: { name: true, slug: true } },
        seller: { 
          select: { 
            id: true, 
            name: true,
            created_at: true // To calculate how long they've been a member
          } 
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      skip,
      take: limit,
    });

    // Get all unique seller IDs to fetch their stats efficiently
    const uniqueSellerIds = new Set(listings.map(l => l.seller_id));
    const sellerIds = Array.from(uniqueSellerIds);
    
    // Fetch active listing counts for all sellers in one query
    const activeListingCounts = await prisma.$queryRaw<Array<{ 
      seller_id: string; 
      active_count: number 
    }>>`
      SELECT 
        seller_id,
        COUNT(*) as active_count
      FROM "MarketplaceListing" 
      WHERE seller_id IN (${Prisma.join(sellerIds)}) 
        AND status = 'ACTIVE'
      GROUP BY seller_id
    `;

    // Create a map from sellerId to active count
    const activeCountMap = new Map(activeListingCounts.map(count => [count.seller_id, Number(count.active_count)]));
    
    // Enhance listings with seller metrics (in development, we'll add basic metrics)
    const enhancedListings = listings.map(listing => {
      return {
        ...listing,
        seller: {
          ...listing.seller,
          // For now, we'll use a basic rating calculation
          // In production, this would come from actual user reviews
          rating: 0, // Placeholder - would come from calculateUserRating function
          reviewCount: 0, // Placeholder - would come from actual reviews
          // Calculate how long they've been a member
          memberSince: listing.seller?.created_at ? 
            new Date(listing.seller.created_at).getFullYear() : null,
          // Get count of their active listings from the pre-fetched data
          totalActiveListings: activeCountMap.get(listing.seller_id) || 0
        }
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalListings / limit);

    return NextResponse.json({
      listings,
      pagination: {
        currentPage: page,
        totalPages,
        totalListings,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('[GET Marketplace Listings Error]', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Fehler beim Abrufen der Marktplatz-Angebote',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler: Create a new marketplace listing
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        error: 'UNAUTHORIZED',
        message: 'Anmeldung erforderlich',
      },
      { status: 401 }
    );
  }

  try {
    const rawData = await request.json();

    // Validate the incoming data
    const validation = validateRequest(createListingSchema, rawData);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Ungültige Eingabedaten',
          details: formatValidationErrors(validation.error),
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if user has previously published listings
    const hasPreviousPublishedListings = await prisma.marketplaceListing.count({
      where: {
        seller_id: session.user.id,
        status: { in: [ListingStatus.ACTIVE, ListingStatus.INACTIVE] }
      }
    });

    // Set status based on previous activity - new users get PENDING, returning users get ACTIVE
    const listingStatus = hasPreviousPublishedListings > 0 
      ? ListingStatus.ACTIVE 
      : ListingStatus.PENDING;

    // Create the listing in the database
    const newListing = await prisma.marketplaceListing.create({
      data: {
        title: data.title,
        description: data.description,
        quantity: data.quantity,
        unit: data.unit,
        location: data.location,
        seller_id: session.user.id,
        material_id: data.material_id,
        type: data.type,
        status: listingStatus,
        image_url: data.imageUrl,
      },
      include: {
        material: { select: { name: true, slug: true } },
        seller: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(newListing, { status: 201 });
  } catch (error) {
    console.error('[Marketplace Listing POST Error]', error);

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          {
            error: 'DUPLICATE_ERROR',
            message: 'Ein Angebot mit diesen Daten existiert bereits',
          },
          { status: 409 }
        );
      }
      if (error.code === 'P2003') {
        return NextResponse.json(
          {
            error: 'REFERENCE_ERROR',
            message: 'Ungültige Material-ID oder Benutzer-ID',
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Fehler beim Erstellen des Angebots',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
