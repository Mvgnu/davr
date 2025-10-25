import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/admin/stats
 * Get platform-wide statistics
 */
export async function GET() {
  try {
    await requireRole('ADMIN');

    const [
      totalUsers,
      totalCenters,
      totalMaterials,
      totalListings,
      pendingVerifications,
      verifiedCenters,
      totalReviews,
      pendingClaims,
      totalClaims,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.recyclingCenter.count(),
      prisma.material.count(),
      prisma.marketplaceListing.count(),
      prisma.recyclingCenter.count({
        where: { verification_status: 'PENDING' },
      }),
      prisma.recyclingCenter.count({
        where: { verification_status: 'VERIFIED' },
      }),
      prisma.review.count(),
      prisma.recyclingCenterClaim.count({
        where: { status: 'pending' },
      }),
      prisma.recyclingCenterClaim.count(),
    ]);

    // Get user role distribution
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true,
      },
    });

    const roleDistribution = usersByRole.reduce((acc, item) => {
      acc[item.role] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentUsers, recentListings, recentCenters, recentReviews] = await Promise.all([
      prisma.user.count({
        where: { created_at: { gte: sevenDaysAgo } },
      }),
      prisma.marketplaceListing.count({
        where: { created_at: { gte: sevenDaysAgo } },
      }),
      prisma.recyclingCenter.count({
        where: { created_at: { gte: sevenDaysAgo } },
      }),
      prisma.review.count({
        where: { created_at: { gte: sevenDaysAgo } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalCenters,
        totalMaterials,
        totalListings,
        pendingVerifications,
        verifiedCenters,
        totalReviews,
        pendingClaims,
        totalClaims,
        roleDistribution,
        recentActivity: {
          users: recentUsers,
          listings: recentListings,
          centers: recentCenters,
          reviews: recentReviews,
        },
      },
    });
  } catch (error) {
    console.error('[Admin Stats Error]', error);

    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
