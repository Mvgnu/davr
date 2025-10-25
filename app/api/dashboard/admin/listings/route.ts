import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';

const DEFAULT_PAGE_SIZE = 10;

// GET handler to fetch all marketplace listings (Admin Only)
export async function GET(request: Request) {
  try {
    await requireRole('ADMIN');

    // Handle Pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || `${DEFAULT_PAGE_SIZE}`, 10);
    const skip = (page - 1) * limit;

    // Fetch listings from the database with relations and pagination
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

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalListings / limit);

    // Return the paginated list
    return NextResponse.json({
      success: true,
      data: {
        listings,
        pagination: {
          currentPage: page,
          totalPages,
          pageSize: limit,
          totalItems: totalListings,
        },
      },
    });

  } catch (error) {
    console.error('[GET Dashboard Admin Listings Error]', error);

    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch marketplace listings' },
      { status: 500 }
    );
  }
}

// POST handler to create a new marketplace listing (Admin Only)
export async function POST(request: Request) {
  try {
    await requireRole('ADMIN');

    const body = await request.json();
    
    const newListing = await prisma.marketplaceListing.create({
      data: {
        title: body.title,
        description: body.description,
        quantity: body.quantity,
        unit: body.unit,
        location: body.location,
        status: body.status || 'PENDING',
        type: body.type || 'SELL',
        seller_id: body.seller_id,
        material_id: body.material_id,
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: newListing 
    });
  } catch (error) {
    console.error('[POST Dashboard Admin Listings Error]', error);

    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create marketplace listing' },
      { status: 500 }
    );
  }
}