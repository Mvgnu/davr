import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { Prisma, ListingStatus } from '@prisma/client';

const DEFAULT_PAGE_SIZE = 10;

// GET handler to fetch all marketplace listings (Admin Only)
export async function GET(request: NextRequest) {
  // 1. Check Authentication & Authorization (Admin Only)
  const session = await getServerSession(authOptions);
  const userIsAdmin = session?.user?.isAdmin === true;

  if (!session?.user?.id || !userIsAdmin) {
    console.log("Admin API access denied for fetching marketplace listings", {
      userId: session?.user?.id,
      isAdmin: userIsAdmin
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Handle Pagination & Filtering
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || `${DEFAULT_PAGE_SIZE}`, 10);
  const skip = (page - 1) * limit;
  const statusFilter = searchParams.get('status'); // e.g., ACTIVE, PENDING, etc.
  const searchTerm = searchParams.get('search'); // Search by title, description, seller name/email
  const materialId = searchParams.get('materialId'); // Filter by material
  const sellerId = searchParams.get('sellerId'); // Filter by seller

  // 3. Build Prisma Query Conditions
  let where: Prisma.MarketplaceListingWhereInput = {};

  if (statusFilter && statusFilter !== 'all' && Object.values(ListingStatus).includes(statusFilter as ListingStatus)) {
    where.status = statusFilter as ListingStatus;
  }

  if (materialId) {
    where.material_id = materialId;
  }
  
  if (sellerId) {
    where.seller_id = sellerId;
  }

  if (searchTerm) {
    where.OR = [
      { title: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
      { seller: { name: { contains: searchTerm, mode: 'insensitive' } } },
      { seller: { email: { contains: searchTerm, mode: 'insensitive' } } },
      { material: { name: { contains: searchTerm, mode: 'insensitive' } } }
    ];
  }

  try {
    // 4. Fetch listings from the database with relations, filtering, and pagination
    const [listings, totalListings] = await prisma.$transaction([
      prisma.marketplaceListing.findMany({
        where,
        skip: skip,
        take: limit,
        orderBy: {
          created_at: 'desc', // Order by newest first by default
        },
        include: { // Include related seller and material data
          seller: {
            select: { id: true, email: true, name: true }, // Select necessary seller fields
          },
          material: {
            select: { id: true, name: true }, // Select necessary material fields
          },
        },
      }),
      prisma.marketplaceListing.count({ where }), // Get the total count matching filters
    ]);

    // 5. Calculate pagination metadata
    const totalPages = Math.ceil(totalListings / limit);

    // 6. Return the paginated list
    return NextResponse.json({
      listings,
      pagination: {
        currentPage: page,
        totalPages,
        pageSize: limit,
        totalItems: totalListings,
      },
    });

  } catch (error) {
    console.error('[GET Admin Marketplace Listings Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketplace listings' },
      { status: 500 }
    );
  }
} 