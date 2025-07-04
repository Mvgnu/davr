import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { ListingStatus } from '@prisma/client';

// GET handler to fetch platform statistics (Admin Only)
export async function GET(request: Request) {
  // 1. Check Authentication & Authorization
  const session = await getServerSession(authOptions);
  const userIsAdmin = session?.user ? (session.user as { isAdmin?: boolean }).isAdmin === true : false;

  if (!session?.user?.id || !userIsAdmin) {
    console.log("Admin API access denied for fetching stats", { 
        userId: session?.user?.id, 
        isAdmin: userIsAdmin 
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Fetch statistics using Prisma transaction
  try {
    const [totalUsers, activeListings, totalListings, totalRecyclingCenters, totalMaterials] = await prisma.$transaction([
      prisma.user.count(),
      prisma.marketplaceListing.count({ where: { status: ListingStatus.ACTIVE } }),
      prisma.marketplaceListing.count(),
      prisma.recyclingCenter.count(),
      prisma.material.count(),
    ]);

    // 3. Return the statistics
    return NextResponse.json({
      totalUsers,
      activeListings,
      totalListings,
      totalRecyclingCenters,
      totalMaterials,
    });

  } catch (error) {
    console.error('[GET Admin Stats Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform statistics' },
      { status: 500 }
    );
  }
} 