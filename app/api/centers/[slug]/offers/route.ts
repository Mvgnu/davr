import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Zod schema for validating new offer input
const offerSchema = z.object({
    materialId: z.string().cuid('Invalid Material ID'),
    pricePerUnit: z.number().positive('Price must be positive').optional().nullable(),
    unit: z.string().max(20, 'Unit cannot exceed 20 characters').optional().nullable(),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
});

// Helper function to check manager authorization
async function checkAuthorization(slug: string, userId: string): Promise<{ centerId: string | null; authorized: boolean }> {
    const center = await prisma.recyclingCenter.findUnique({
        where: { slug: slug, managedById: userId },
        select: { id: true }
    });
    return { centerId: center?.id ?? null, authorized: !!center };
}

// GET handler - Fetch offers for a specific center (requires manager auth)
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = params;
    const { centerId, authorized } = await checkAuthorization(slug, session.user.id);

    if (!authorized || !centerId) {
        return NextResponse.json({ error: 'Forbidden or Center Not Found' }, { status: 403 });
    }

    try {
        const offers = await prisma.recyclingCenterOffer.findMany({
            where: { recycling_center_id: centerId },
            include: { material: { select: { id: true, name: true, slug: true } } },
            orderBy: { material: { name: 'asc' } }
        });
        return NextResponse.json({ success: true, data: offers });
    } catch (error: any) {
        console.error(`[GET Center Offers Error - Slug: ${slug}]`, error);
        return NextResponse.json({ success: false, error: 'Failed to fetch offers', details: error.message }, { status: 500 });
    }
}

// POST handler - Add a new offer to a center (requires manager auth)
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = params;
    const { centerId, authorized } = await checkAuthorization(slug, session.user.id);

    if (!authorized || !centerId) {
        return NextResponse.json({ error: 'Forbidden or Center Not Found' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const validation = offerSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ success: false, error: 'Invalid input', details: validation.error.errors }, { status: 400 });
        }
        const { materialId, pricePerUnit, unit, notes } = validation.data;
        
        // Check if material exists (optional but good practice)
        const materialExists = await prisma.material.findUnique({ where: { id: materialId }});
        if (!materialExists) {
             return NextResponse.json({ error: 'Material not found' }, { status: 404 });
        }

        // Create the new offer (Prisma handles unique constraint errors)
        const newOffer = await prisma.recyclingCenterOffer.create({
            data: {
                recycling_center_id: centerId,
                material_id: materialId,
                price_per_unit: pricePerUnit,
                unit: unit,
                notes: notes,
            },
             include: { material: { select: { id: true, name: true, slug: true } } } // Return created offer with material
        });

        return NextResponse.json({ success: true, data: newOffer }, { status: 201 });

    } catch (error: any) {
         // Handle potential unique constraint violation (center already offers this material)
        if (error.code === 'P2002') { 
            return NextResponse.json({ error: 'This center already offers this material.' }, { status: 409 }); // Conflict
        }
        console.error(`[POST Center Offer Error - Slug: ${slug}]`, error);
        return NextResponse.json({ success: false, error: 'Failed to add offer', details: error.message }, { status: 500 });
    }
} 