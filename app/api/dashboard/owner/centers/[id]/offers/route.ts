import { NextRequest, NextResponse } from 'next/server';
import { requireOwnership } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createOfferSchema = z.object({
  material_id: z.string(),
  price_per_unit: z.number().positive().optional().nullable(),
  unit: z.string().max(20).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

/**
 * GET /api/dashboard/owner/centers/[id]/offers
 * Get all offers for a center
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

    const offers = await prisma.recyclingCenterOffer.findMany({
      where: { recycling_center_id: params.id },
      include: {
        material: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({
      success: true,
      offers,
    });
  } catch (error) {
    console.error('[Get Offers Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/owner/centers/[id]/offers
 * Create a new offer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = createOfferSchema.parse(body);

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

    // Check if offer already exists for this material
    const existingOffer = await prisma.recyclingCenterOffer.findUnique({
      where: {
        recycling_center_id_material_id: {
          recycling_center_id: params.id,
          material_id: validatedData.material_id,
        },
      },
    });

    if (existingOffer) {
      return NextResponse.json(
        { error: 'An offer for this material already exists' },
        { status: 400 }
      );
    }

    const offer = await prisma.recyclingCenterOffer.create({
      data: {
        recycling_center_id: params.id,
        ...validatedData,
      },
      include: {
        material: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Offer created successfully',
      offer,
    }, { status: 201 });
  } catch (error) {
    console.error('[Create Offer Error]', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    );
  }
}
