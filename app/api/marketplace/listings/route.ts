import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
// Keep general Prisma import for other potentially used types/client
import { Prisma } from '@prisma/client'; 
import { z } from 'zod';
import { ListingType, ListingStatus } from '@prisma/client';

// --- GET Handler: Fetch listings with Filtering & Pagination ---
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '12', 10);
  const validatedPage = Math.max(1, isNaN(page) ? 1 : page);
  const validatedLimit = Math.max(1, Math.min(50, isNaN(limit) ? 12 : limit));
  const skip = (validatedPage - 1) * validatedLimit;

  const searchQuery = searchParams.get('search');
  const materialId = searchParams.get('materialId');
  const locationQuery = searchParams.get('location');

  try {
    // +++ START DEBUGGING BLOCK +++
    console.log('[DEBUG] Attempting to fetch ANY single listing...');
    const anyListing = await prisma.marketplaceListing.findFirst({
      include: { seller: true, material: true } // Include relations for context
    });
    console.log('[DEBUG] Result of findFirst:', anyListing);
    // +++ END DEBUGGING BLOCK +++

    // Reverting to 'any' due to persistent Prisma type generation issues
    const whereClause: any = {
      // status: 'ACTIVE', // Keep commented out for now
    };

    if (searchQuery) {
      whereClause.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    if (materialId && z.string().cuid().safeParse(materialId).success) {
      whereClause.material_id = materialId;
    }

    if (locationQuery) {
      whereClause.location = { contains: locationQuery, mode: 'insensitive' };
    }

    // Fetch total count matching the where clause
    const totalListings = await prisma.marketplaceListing.count({
      where: whereClause, 
    });

    // Fetch paginated & filtered listings
    const listings = await prisma.marketplaceListing.findMany({
      where: whereClause, 
      include: {
        material: { select: { name: true } },
        seller: { select: { id: true, name: true } } 
      },
      orderBy: {
        created_at: 'desc'
      },
      skip: skip,
      take: validatedLimit,
    });

    const totalPages = Math.ceil(totalListings / validatedLimit);

    // Return the ACTUAL data, not the debug data
    return NextResponse.json({
      listings, // Return the potentially empty array as before
      pagination: {
        currentPage: validatedPage,
        totalPages,
        totalListings,
        limit: validatedLimit,
      }
    });

  } catch (error) {
    // Simplified error handling for GET
    console.error('[GET Marketplace Listings Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketplace listings' },
      { status: 500 }
    );
  }
}

// --- POST Handler: Create a new listing --- 

const listingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long').max(100),
  description: z.string().max(1000).optional(),
  quantity: z.number().positive().optional().nullable(),
  unit: z.string().max(20).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  material_id: z.string().cuid().optional().nullable(),
  type: z.nativeEnum(ListingType),
  imageUrl: z.string().url().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rawData = await request.json();
    
    // Validate the incoming data
    const validationResult = listingSchema.safeParse(rawData);
    if (!validationResult.success) {
        return NextResponse.json({ error: 'Invalid input data', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const data = validationResult.data;

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
        status: ListingStatus.ACTIVE,
        image_url: data.imageUrl,
      },
    });

    return NextResponse.json(newListing, { status: 201 });

  } catch (error) {
    console.error('[Marketplace Listing POST Error]', error);
    if (error instanceof z.ZodError) {
        // This should be caught by safeParse, but as a fallback
        return NextResponse.json({ error: 'Invalid data format.', details: error.errors }, { status: 400 });
    }
    // Handle potential Prisma errors, like unique constraint violations if needed
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
} 