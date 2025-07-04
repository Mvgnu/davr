import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';

const DEFAULT_PAGE_SIZE = 10;

// GET handler to fetch all marketplace listings (Admin Only)
export async function GET(request: Request) {
  // 1. Check Authentication & Authorization
  const session = await getServerSession(authOptions);
  const userIsAdmin = session?.user ? (session.user as { isAdmin?: boolean }).isAdmin === true : false;

  if (!session?.user?.id || !userIsAdmin) {
    console.log("Admin API access denied for fetching all listings", { 
        userId: session?.user?.id, 
        isAdmin: userIsAdmin 
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Handle Pagination
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || `${DEFAULT_PAGE_SIZE}`, 10);
  const skip = (page - 1) * limit;

  try {
    // 3. Fetch listings from the database with relations and pagination
    const [listings, totalListings] = await prisma.$transaction([
      prisma.marketplaceListing.findMany({
        skip: skip,
        take: limit,
        orderBy: {
          created_at: 'desc', // Order by newest first
        },
        include: { // Include related seller and material data
          seller: {
            select: { id: true, email: true, name: true }, // Select only necessary seller fields
          },
          material: {
            select: { id: true, name: true }, // Select only necessary material fields
          },
        },
      }),
      prisma.marketplaceListing.count(), // Get the total count for pagination
    ]);

    // 4. Calculate pagination metadata
    const totalPages = Math.ceil(totalListings / limit);

    // 5. Return the paginated list
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
    console.error('[GET Admin Listings Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketplace listings' },
      { status: 500 }
    );
  }
} 