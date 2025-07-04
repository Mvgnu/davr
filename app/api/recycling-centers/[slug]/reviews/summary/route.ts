import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET handler for fetching review summary (average rating, count)
export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    const slug = params.slug;

    if (!slug) {
        return NextResponse.json({ error: 'Recycling Center slug is required' }, { status: 400 });
    }

    try {
        // +++ Find Center by Slug +++
        const center = await prisma.recyclingCenter.findUnique({
            where: { slug: slug },
            select: { id: true } // Select only the ID
        });

        if (!center) {
            return NextResponse.json({ error: 'Recycling Center not found' }, { status: 404 });
        }
        const centerId = center.id; // Use the fetched ID

        // Use Prisma aggregation to calculate average rating and count
        const summary = await prisma.review.aggregate({
            _count: {
                _all: true, // Correct way to count all records
            },
            _avg: {
                rating: true, // Calculate average of the rating field
            },
            where: {
                centerId: centerId, // Keep camelCase field name (consistent with schema)
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                // Use optional chaining and correct count property
                totalReviews: summary?._count?._all ?? 0,
                averageRating: summary?._avg?.rating ?? null, 
            }
        });

    } catch (error: any) {
        console.error(`[GET Review Summary Error - Center Slug: ${slug}]`, error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch review summary', details: error.message },
            { status: 500 }
        );
    }
} 