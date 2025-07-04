import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { Prisma, ListingType, ListingStatus } from '@prisma/client';

export const dynamic = 'force-dynamic'; // Mark route as dynamic

// GET endpoint for fetching marketplace listings (admin view) - using Prisma
export async function GET(request: NextRequest) {
  try {
    // 1. Check Authentication & Authorization
    const session = await getServerSession(authOptions);
    const userIsAdmin = session?.user?.isAdmin === true;

    if (!session?.user?.id || !userIsAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // 2. Parse query parameters for filtering, sorting, and pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const statusFilter = searchParams.get('status'); // e.g., 'ACTIVE', 'PENDING' etc.
    const typeFilter = searchParams.get('type'); // e.g., 'BUY', 'SELL'
    const searchTerm = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
    const skip = (page - 1) * limit;

    // 3. Build Prisma WHERE clause
    let where: Prisma.MarketplaceListingWhereInput = {};

    // Filter by Status
    if (statusFilter && statusFilter !== 'all' && Object.values(ListingStatus).includes(statusFilter as ListingStatus)) {
      where.status = statusFilter as ListingStatus;
    }

    // Filter by Type
    if (typeFilter && typeFilter !== 'all' && Object.values(ListingType).includes(typeFilter as ListingType)) {
      where.type = typeFilter as ListingType;
    }

    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { seller: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { material: { name: { contains: searchTerm, mode: 'insensitive' } } }
      ];
    }

    // 4. Build Prisma ORDER BY clause
    let orderBy: Prisma.MarketplaceListingOrderByWithRelationInput = {};
    if (sortBy === 'createdAt') orderBy.created_at = sortOrder;
    if (sortBy === 'updatedAt') orderBy.updated_at = sortOrder;
    if (sortBy === 'title') orderBy.title = sortOrder;
    if (sortBy === 'sellerName') orderBy.seller = { name: sortOrder };
    // Add other sort options as needed (e.g., quantity, location)

    // 5. Execute Prisma queries (fetch listings and total count)
    const [listings, totalListings] = await prisma.$transaction([
      prisma.marketplaceListing.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          quantity: true,
          unit: true,
          location: true,
          created_at: true,
          updated_at: true,
          image_url: true,
          type: true,
          status: true,
          seller: { select: { id: true, name: true } }, 
          material: { select: { name: true } } 
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.marketplaceListing.count({ where }),
    ]);

    // 6. Calculate pagination metadata
    const totalPages = Math.ceil(totalListings / limit);

    return NextResponse.json({
      success: true,
      data: listings,
      pagination: {
        page,
        limit,
        totalCount: totalListings,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching marketplace listings [Prisma]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 