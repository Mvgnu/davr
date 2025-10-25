import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Zod schema for validating claim input
const claimSchema = z.object({
    recyclingCenterId: z.string().cuid('Invalid Recycling Center ID'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional().nullable(),
    companyName: z.string().optional().nullable(),
    businessRole: z.string().optional().nullable(),
    message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message cannot exceed 1000 characters'),
    documents: z.array(z.object({
        url: z.string(),
        filename: z.string(),
        size: z.number(),
        type: z.string(),
    })).optional().nullable(),
});

export async function POST(request: NextRequest) {
    // 1. Check Authentication (optional - allows non-authenticated claims)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    try {
        // 2. Validate Request Body
        const body = await request.json();
        const validation = claimSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: 'Invalid input data', details: validation.error.errors },
                { status: 400 }
            );
        }
        const claimData = validation.data;

        // 3. Check if Center exists and is not already managed
        const center = await prisma.recyclingCenter.findUnique({
            where: { id: claimData.recyclingCenterId },
            select: { id: true, managedById: true }
        });
        if (!center) {
            return NextResponse.json({ error: 'Recycling Center not found' }, { status: 404 });
        }
        if (center.managedById) {
            return NextResponse.json({ error: 'This center is already managed.' }, { status: 409 }); // Conflict
        }
        
        // 4. Check if user/email already has a pending claim for this center
        const existingClaimQuery: any = {
            recycling_center_id: claimData.recyclingCenterId,
            status: 'pending'
        };

        if (userId) {
            existingClaimQuery.user_id = userId;
        } else {
            existingClaimQuery.email = claimData.email;
        }

        const existingClaim = await prisma.recyclingCenterClaim.findFirst({
            where: existingClaimQuery
        });

        if (existingClaim) {
            return NextResponse.json({ error: 'A pending claim already exists for this center with your credentials.' }, { status: 409 });
        }

        // 5. Create the Claim
        const claimDataForDb: any = {
            recycling_center_id: claimData.recyclingCenterId,
            user_id: userId,
            name: claimData.name,
            email: claimData.email,
            phone: claimData.phone,
            companyName: claimData.companyName,
            businessRole: claimData.businessRole,
            message: claimData.message,
            status: 'pending',
            account_created: false,
        };

        if (claimData.documents) {
            claimDataForDb.documents_json = claimData.documents;
        }

        const newClaim = await prisma.recyclingCenterClaim.create({
            data: claimDataForDb,
        });

        // TODO: Send email notification to admin about new claim

        // 6. Return Success Response
        return NextResponse.json({ success: true, data: newClaim }, { status: 201 });

    } catch (error: any) {
        console.error(`[POST Claim Error]`, error);
        return NextResponse.json(
            { success: false, error: 'Failed to submit claim', details: error.message },
            { status: 500 }
        );
    }
} 