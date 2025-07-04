import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options'; // Adjust path if needed
import { prisma } from '@/lib/db/prisma';

// GET handler to retrieve reviews written by the currently authenticated user
export async function GET(request: NextRequest) {
    // 1. Check Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        // 2. Fetch reviews where userId matches, include related center details
        const reviews = await prisma.review.findMany({
            where: {
                userId: userId, // Use camelCase field name (consistent with schema)
            },
            include: {
                center: { // Include RecyclingCenter data
                    select: {
                        id: true,
                        name: true,
                        slug: true, // Include slug for linking
                    }
                }
            },
            orderBy: {
                created_at: 'desc', // Show newest reviews first
            },
        });

        // 3. Return Success Response
        return NextResponse.json({ success: true, data: reviews });

    } catch (error: any) {
        console.error(`[GET User Reviews Error - User ID: ${userId}]`, error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch user reviews', details: error.message },
            { status: 500 }
        );
    }
} 