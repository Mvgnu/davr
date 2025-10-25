import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { ListingStatus, ListingType } from '@prisma/client';

export const dynamic = 'force-dynamic';

const createListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').optional().nullable(),
  material_id: z.string().optional().nullable(),
  quantity: z.number().positive('Quantity must be positive').optional().nullable(),
  unit: z.string().max(20).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  image_url: z.string().url('Invalid image URL').optional().nullable(),
  type: z.enum(['BUY', 'SELL']).default('SELL'),
});

const updateListingSchema = createListingSchema.partial();

/**
 * GET /api/dashboard/user/listings
 * Get current user's marketplace listings
 */
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireAuth();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') as ListingStatus | null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const whereCondition = {
      seller_id: sessionUser.id,
      ...(status && { status }),
    };

    const [listings, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where: whereCondition,
        include: {
          material: {
            select: {
              id: true,
              name: true,
              slug: true,
              image_url: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.marketplaceListing.count({ where: whereCondition }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      listings,
      pagination: {
        currentPage: page,
        totalPages,
        pageSize: limit,
        totalItems: total,
      },
    });
  } catch (error) {
    console.error('[Get User Listings Error]', error);

    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/user/listings
 * Create a new marketplace listing
 */
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireAuth();
    const body = await request.json();

    const validatedData = createListingSchema.parse(body);

    // Verify material exists if provided
    if (validatedData.material_id) {
      const material = await prisma.material.findUnique({
        where: { id: validatedData.material_id },
      });

      if (!material) {
        return NextResponse.json(
          { error: 'Material not found' },
          { status: 404 }
        );
      }
    }

    const listing = await prisma.marketplaceListing.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        material_id: validatedData.material_id,
        quantity: validatedData.quantity,
        unit: validatedData.unit,
        location: validatedData.location,
        image_url: validatedData.image_url,
        type: validatedData.type,
        seller_id: sessionUser.id,
        status: 'PENDING',
      },
      include: {
        material: {
          select: {
            id: true,
            name: true,
            slug: true,
            image_url: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Listing created successfully',
      listing,
    }, { status: 201 });
  } catch (error) {
    console.error('[Create Listing Error]', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
