import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const verifySchema = z.object({
  centerId: z.string(),
  action: z.enum(['VERIFIED', 'REJECTED']),
  reason: z.string().optional(),
});

/**
 * POST /api/dashboard/admin/centers/verify
 * Verify or reject a recycling center
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole('ADMIN');

    const body = await request.json();
    const { centerId, action, reason } = verifySchema.parse(body);

    const center = await prisma.recyclingCenter.findUnique({
      where: { id: centerId },
    });

    if (!center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 });
    }

    const updatedCenter = await prisma.recyclingCenter.update({
      where: { id: centerId },
      data: {
        verification_status: action,
        updated_at: new Date(),
      },
      include: {
        managedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // In a real app, you'd send an email notification here
    console.log(
      `Center ${updatedCenter.name} ${action.toLowerCase()} - Notification would be sent to ${updatedCenter.managedBy?.email}`
    );

    return NextResponse.json({
      success: true,
      message: `Center ${action.toLowerCase()} successfully`,
      center: updatedCenter,
    });
  } catch (error) {
    console.error('[Verify Center Error]', error);

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
      { error: 'Failed to verify center' },
      { status: 500 }
    );
  }
}
