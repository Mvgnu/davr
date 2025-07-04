import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';

/**
 * GET handler to fetch marketplace listings created by the currently authenticated user.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  // 1. Check Authentication
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // 2. Fetch listings where seller_id matches the authenticated user's ID
    const userListings = await prisma.marketplaceListing.findMany({
      where: { seller_id: userId },
      // Select fields needed for the ListingCard component + ID
      select: {
        id: true,
        title: true,
        description: true,
        quantity: true,
        unit: true,
        location: true,
        created_at: true,
        material: { 
            select: { name: true }
        },
        seller: { // Include seller info matching ListingCard's expectation
            select: { id: true, name: true }
        }
        // Add is_active if you want to show status on dashboard
        // is_active: true,
      },
      orderBy: {
        created_at: 'desc', // Show newest listings first
      },
    });

    // 3. Return the listings
    return NextResponse.json(userListings);

  } catch (error) {
    console.error('[GET User Listings Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch user listings' },
      { status: 500 }
    );
  }
} 