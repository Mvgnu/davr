import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options'; // Ensure correct path to authOptions
import { prisma } from '@/lib/db/prisma';

// GET handler to retrieve listings for the currently authenticated user
export async function GET(request: NextRequest) {
    // 1. Check Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        // 2. Fetch Listings
        const listings = await prisma.marketplaceListing.findMany({
            where: { seller_id: userId },
            select: {
                id: true,
                title: true,
                description: true,
                quantity: true,
                unit: true,
                location: true,
                image_url: true,   // Select image_url
                status: true,      // Select status
                created_at: true,
                material: {         // Include material name
                    select: { 
                        name: true
                        // Determine category based on parent or material name if needed
                        // parent: { select: { name: true } } // Example if category comes from parent
                    }
                },
                seller: {         // Include seller info (already required by where clause)
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
            orderBy: { created_at: 'desc' },
        });

        // 4. Format and Return (Add category mapping if needed)
        const formattedListings = listings.map(listing => ({
            ...listing,
            // Map category here if needed, e.g., based on material.name or material.parent.name
            category: listing.material?.name, // Simple example: use material name as category
        }));

        return NextResponse.json(formattedListings);

    } catch (error: any) {
        console.error(`[GET User Listings Error - User ID: ${userId}]`, error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch user listings', details: error.message },
            { status: 500 }
        );
    }
} 