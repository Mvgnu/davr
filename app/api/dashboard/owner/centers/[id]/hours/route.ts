import { NextRequest, NextResponse } from 'next/server';
import { requireOwnership } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { DayOfWeek } from '@prisma/client';

export const dynamic = 'force-dynamic';

const hoursSchema = z.object({
  hours: z.array(
    z.object({
      day_of_week: z.enum([
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY',
      ]),
      open_time: z.string(),
      close_time: z.string(),
      is_closed: z.boolean(),
    })
  ),
});

/**
 * GET /api/dashboard/owner/centers/[id]/hours
 * Get working hours for a center
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const center = await prisma.recyclingCenter.findUnique({
      where: { id: params.id },
      select: { managedById: true },
    });

    if (!center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 });
    }

    if (center.managedById) {
      await requireOwnership(center.managedById, { allowRoles: ['ADMIN'] });
    }

    const hours = await prisma.workingHours.findMany({
      where: { recycling_center_id: params.id },
      orderBy: { day_of_week: 'asc' },
    });

    return NextResponse.json({
      success: true,
      hours,
    });
  } catch (error) {
    console.error('[Get Hours Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch working hours' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/dashboard/owner/centers/[id]/hours
 * Update working hours for a center
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = hoursSchema.parse(body);

    const center = await prisma.recyclingCenter.findUnique({
      where: { id: params.id },
      select: { managedById: true },
    });

    if (!center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 });
    }

    if (center.managedById) {
      await requireOwnership(center.managedById, { allowRoles: ['ADMIN'] });
    }

    // Delete existing hours and create new ones
    await prisma.$transaction([
      prisma.workingHours.deleteMany({
        where: { recycling_center_id: params.id },
      }),
      prisma.workingHours.createMany({
        data: validatedData.hours.map((h) => ({
          recycling_center_id: params.id,
          day_of_week: h.day_of_week as DayOfWeek,
          open_time: h.open_time,
          close_time: h.close_time,
          is_closed: h.is_closed,
        })),
      }),
    ]);

    const updatedHours = await prisma.workingHours.findMany({
      where: { recycling_center_id: params.id },
      orderBy: { day_of_week: 'asc' },
    });

    return NextResponse.json({
      success: true,
      message: 'Working hours updated successfully',
      hours: updatedHours,
    });
  } catch (error) {
    console.error('[Update Hours Error]', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update working hours' },
      { status: 500 }
    );
  }
}
