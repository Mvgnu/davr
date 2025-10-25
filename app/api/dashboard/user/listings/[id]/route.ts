import { NextRequest, NextResponse } from 'next/server';
import { requireOwnership } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200).optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional().nullable(),
  material_id: z.string().optional().nullable(),
  quantity: z.number().positive('Quantity must be positive').optional().nullable(),
  unit: z.string().max(20).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  image_url: z.string().url('Invalid image URL').optional().nullable(),
  type: z.enum(['BUY', 'SELL']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
});

/**
 * GET /api/dashboard/user/listings/[id]
 * Get a specific listing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: params.id },
      include: {
        material: {
          select: {
            id: true,
            name: true,
            slug: true,
            image_url: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Verify ownership
    await requireOwnership(listing.seller_id, { allowRoles: ['ADMIN'] });

    return NextResponse.json({
      success: true,
      listing,
    });
  } catch (error) {
    console.error('[Get Listing Error]', error);

    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { error: 'You do not have permission to view this listing' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/dashboard/user/listings/[id]
 * Update a listing
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateListingSchema.parse(body);

    // Get listing and verify ownership
    const existingListing = await prisma.marketplaceListing.findUnique({
      where: { id: params.id },
    });

    if (!existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    await requireOwnership(existingListing.seller_id, { allowRoles: ['ADMIN'] });

    // Verify material exists if being updated
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

    const updatedListing = await prisma.marketplaceListing.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updated_at: new Date(),
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
      message: 'Listing updated successfully',
      listing: updatedListing,
    });
  } catch (error) {
    console.error('[Update Listing Error]', error);

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

      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { error: 'You do not have permission to update this listing' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dashboard/user/listings/[id]
 * Delete a listing
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get listing and verify ownership
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: params.id },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    await requireOwnership(listing.seller_id, { allowRoles: ['ADMIN'] });

    await prisma.marketplaceListing.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully',
    });
  } catch (error) {
    console.error('[Delete Listing Error]', error);

    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { error: 'You do not have permission to delete this listing' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}
