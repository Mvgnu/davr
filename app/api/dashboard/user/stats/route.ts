import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/user/stats
 * Get user dashboard statistics
 */
export async function GET() {
  try {
    const user = await requireRole('USER');

    const [
      totalListings,
      activeListings,
      totalReviews,
      averageRating,
    ] = await Promise.all([
      // Total listings
      prisma.marketplaceListing.count({
        where: { seller_id: user.id },
      }),

      // Active listings
      prisma.marketplaceListing.count({
        where: {
          seller_id: user.id,
          status: 'ACTIVE',
        },
      }),

      // Total reviews written
      prisma.review.count({
        where: { userId: user.id },
      }),

      // Average rating given by user
      prisma.review.aggregate({
        where: { userId: user.id },
        _avg: { rating: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalListings,
        activeListings,
        inactiveListings: totalListings - activeListings,
        totalReviews,
        averageRating: averageRating._avg.rating
          ? Number(averageRating._avg.rating.toFixed(1))
          : 0,
      },
    });
  } catch (error) {
    console.error('[User Stats Error]', error);

    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
}
