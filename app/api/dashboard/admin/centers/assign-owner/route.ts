import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const assignOwnerSchema = z.object({
  centerId: z.string().cuid(),
  userId: z.string().cuid(),
});

const removeOwnerSchema = z.object({
  centerId: z.string().cuid(),
});

/**
 * POST /api/dashboard/admin/centers/assign-owner
 * Assign an owner to a recycling center
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole('ADMIN');

    const body = await request.json();
    const { centerId, userId } = assignOwnerSchema.parse(body);

    // Verify the user exists and is a center owner
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify the center exists
    const center = await prisma.recyclingCenter.findUnique({
      where: { id: centerId },
    });

    if (!center) {
      return NextResponse.json(
        { error: 'Recycling center not found' },
        { status: 404 }
      );
    }

    // Check if the user is already assigned to another center
    const existingAssignment = await prisma.recyclingCenter.findFirst({
      where: { managedById: userId },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'This user is already assigned to another recycling center' },
        { status: 400 }
      );
    }

    // Assign the owner to the center
    const updatedCenter = await prisma.recyclingCenter.update({
      where: { id: centerId },
      data: {
        managedById: userId,
        updated_at: new Date(),
      },
      include: {
        managedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Owner assigned successfully',
      data: updatedCenter,
    });
  } catch (error) {
    console.error('[Assign Owner Error]', error);

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
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to assign owner' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dashboard/admin/centers/remove-owner
 * Remove an owner from a recycling center
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireRole('ADMIN');

    const { searchParams } = new URL(request.url);
    const centerId = searchParams.get('centerId');

    if (!centerId) {
      return NextResponse.json(
        { error: 'Center ID is required' },
        { status: 400 }
      );
    }

    // Verify the center exists
    const center = await prisma.recyclingCenter.findUnique({
      where: { id: centerId },
    });

    if (!center) {
      return NextResponse.json(
        { error: 'Recycling center not found' },
        { status: 404 }
      );
    }

    // Check if the center actually has an owner
    if (!center.managedById) {
      return NextResponse.json(
        { error: 'This center does not have an assigned owner' },
        { status: 400 }
      );
    }

    // Remove the owner from the center
    const updatedCenter = await prisma.recyclingCenter.update({
      where: { id: centerId },
      data: {
        managedById: null,
        updated_at: new Date(),
      },
      include: {
        managedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Owner removed successfully',
      data: updatedCenter,
    });
  } catch (error) {
    console.error('[Remove Owner Error]', error);

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
      { error: 'Failed to remove owner' },
      { status: 500 }
    );
  }
}