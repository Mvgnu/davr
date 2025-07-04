import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Zod schema for validating offer update input
const offerUpdateSchema = z.object({
    pricePerUnit: z.number().positive('Price must be positive').optional().nullable(),
    unit: z.string().max(20, 'Unit cannot exceed 20 characters').optional().nullable(),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
});

// Helper function to check manager authorization for a specific offer
async function checkOfferAuthorization(offerId: string, userId: string): Promise<boolean> {
    const offer = await prisma.recyclingCenterOffer.findUnique({
        where: { id: offerId },
        select: {
            recyclingCenter: { // Check the related center
                select: { managedById: true }
            }
        }
    });
    // Authorized if offer exists and the related center is managed by the user
    return !!offer && offer.recyclingCenter?.managedById === userId;
}

// PUT handler - Update an existing offer (requires manager auth)
export async function PUT(request: NextRequest, { params }: { params: { offerId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { offerId } = params;
    const authorized = await checkOfferAuthorization(offerId, session.user.id);

    if (!authorized) {
        return NextResponse.json({ error: 'Forbidden or Offer Not Found' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const validation = offerUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ success: false, error: 'Invalid input', details: validation.error.errors }, { status: 400 });
        }
        // Only update the fields provided
        const { pricePerUnit, unit, notes } = validation.data;

        const updatedOffer = await prisma.recyclingCenterOffer.update({
            where: { id: offerId },
            data: {
                price_per_unit: pricePerUnit, // Update fields
                unit: unit,
                notes: notes,
            },
            include: { material: { select: { id: true, name: true, slug: true } } } // Return updated offer
        });

        return NextResponse.json({ success: true, data: updatedOffer });

    } catch (error: any) {
        console.error(`[PUT Offer Error - Offer ID: ${offerId}]`, error);
        return NextResponse.json({ success: false, error: 'Failed to update offer', details: error.message }, { status: 500 });
    }
}

// DELETE handler - Delete an offer (requires manager auth)
export async function DELETE(request: NextRequest, { params }: { params: { offerId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { offerId } = params;
    const authorized = await checkOfferAuthorization(offerId, session.user.id);

    if (!authorized) {
        return NextResponse.json({ error: 'Forbidden or Offer Not Found' }, { status: 403 });
    }

    try {
        await prisma.recyclingCenterOffer.delete({
            where: { id: offerId },
        });

        return NextResponse.json({ success: true }, { status: 200 }); // Or 204 No Content

    } catch (error: any) {
        console.error(`[DELETE Offer Error - Offer ID: ${offerId}]`, error);
        // Handle potential errors like record not found (P2025)
        if (error.code === 'P2025') {
             return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
        }
        return NextResponse.json({ success: false, error: 'Failed to delete offer', details: error.message }, { status: 500 });
    }
} 