import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { ListingStatus, ListingType } from '@prisma/client';

// GET handler to fetch listing statistics (Admin Only)
export async function GET(request: Request) {
  // 1. Check Authentication & Authorization
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    console.log("Admin API access denied for fetching listing stats", { 
        userId: session?.user?.id, 
        role: session?.user?.role 
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Fetch listing statistics using Prisma transaction
  try {
    // Get counts for different listing statuses
    const [
      totalListings,
      activeListings,
      pendingListings,
      rejectedListings,
      flaggedListings,
      totalSellers,
      listingsByType,
      listingsByStatus
    ] = await prisma.$transaction([
      // Total listings
      prisma.marketplaceListing.count(),
      
      // Active listings
      prisma.marketplaceListing.count({ 
        where: { status: ListingStatus.ACTIVE } 
      }),
      
      // Pending listings
      prisma.marketplaceListing.count({ 
        where: { status: ListingStatus.PENDING } 
      }),
      
      // Rejected listings
      prisma.marketplaceListing.count({ 
        where: { status: ListingStatus.REJECTED } 
      }),
      
      // Flagged listings
      prisma.marketplaceListing.count({ 
        where: { status: ListingStatus.FLAGGED } 
      }),
      
      // Total unique sellers
      prisma.user.count({
        where: {
          listings: {
            some: {}
          }
        }
      }),
      
      // Listings by type (BUY/SELL)
      prisma.marketplaceListing.groupBy({
        by: ['type'],
        _count: {
          type: true
        },
        where: {
          status: ListingStatus.ACTIVE
        },
        orderBy: {
          type: 'asc'
        }
      }),
      
      // Listings by status
      prisma.marketplaceListing.groupBy({
        by: ['status'],
        _count: {
          status: true
        },
        orderBy: {
          status: 'asc'
        }
      })
    ]);

    // Format the listingsByType to match the expected response format
    const formattedListingsByType = listingsByType.map(item => ({
      type: item.type,
      count: (item._count as any)?.type || 0
    }));

    // Format the listingsByStatus to match the expected response format
    const formattedListingsByStatus = listingsByStatus.map(item => ({
      status: item.status,
      count: (item._count as any)?.status || 0
    }));

    // 3. Return the statistics
    return NextResponse.json({
      totalListings,
      activeListings,
      pendingListings,
      rejectedListings,
      flaggedListings,
      totalSellers,
      listingsByType: formattedListingsByType,
      listingsByStatus: formattedListingsByStatus
    });

  } catch (error) {
    console.error('[GET Admin Listing Stats Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing statistics' },
      { status: 500 }
    );
  }
}