import { NextRequest, NextResponse } from 'next/server';
import { requireOwnership } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateCenterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200).optional(),
  description: z.string().optional().nullable(),
  address_street: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  postal_code: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional(),
  phone_number: z.string().max(50).optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable(),
  website: z.string().url('Invalid website URL').optional().nullable(),
  image_url: z.string().url('Invalid image URL').optional().nullable(),
});

/**
 * GET /api/dashboard/owner/centers/[id]
 * Get a specific center with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const center = await prisma.recyclingCenter.findUnique({
      where: { id: params.id },
      include: {
        offers: {
          include: {
            material: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
        working_hours: {
          orderBy: { day_of_week: 'asc' },
        },
        managedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 });
    }

    // Verify ownership
    if (center.managedById) {
      await requireOwnership(center.managedById, { allowRoles: ['ADMIN'] });
    }

    // Calculate average rating
    const avgRating =
      center.reviews.length > 0
        ? center.reviews.reduce((sum, r) => sum + r.rating, 0) /
          center.reviews.length
        : 0;

    return NextResponse.json({
      success: true,
      center: {
        ...center,
        averageRating: Number(avgRating.toFixed(1)),
        reviewCount: center.reviews.length,
      },
    });
  } catch (error) {
    console.error('[Get Center Error]', error);

    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { error: 'You do not have permission to view this center' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch center' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/dashboard/owner/centers/[id]
 * Update center details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateCenterSchema.parse(body);

    // Get center and verify ownership
    const existingCenter = await prisma.recyclingCenter.findUnique({
      where: { id: params.id },
    });

    if (!existingCenter) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 });
    }

    if (existingCenter.managedById) {
      await requireOwnership(existingCenter.managedById, {
        allowRoles: ['ADMIN'],
      });
    }

    // Check if email is being changed and if it's already taken
    if (validatedData.email && validatedData.email !== existingCenter.email) {
      const emailExists = await prisma.recyclingCenter.findFirst({
        where: {
          email: validatedData.email,
          NOT: { id: params.id },
        },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email is already in use by another center' },
          { status: 400 }
        );
      }
    }

    const updatedCenter = await prisma.recyclingCenter.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updated_at: new Date(),
      },
      include: {
        offers: {
          include: {
            material: true,
          },
        },
        working_hours: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Center updated successfully',
      center: updatedCenter,
    });
  } catch (error) {
    console.error('[Update Center Error]', error);

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
          { error: 'You do not have permission to update this center' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update center' },
      { status: 500 }
    );
  }
}
