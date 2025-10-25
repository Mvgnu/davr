import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';
import { ListingStatus } from '@prisma/client';

// GET handler to fetch platform analytics (Admin Only)
export async function GET(request: Request) {
  try {
    await requireRole('ADMIN');

    // Handle date range filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : null;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : null;

    // Build where clauses for date filtering
    const dateFilter = startDate && endDate ? {
      created_at: {
        gte: startDate,
        lte: endDate,
      }
    } : startDate ? {
      created_at: {
        gte: startDate,
      }
    } : endDate ? {
      created_at: {
        lte: endDate,
      }
    } : {};

    // Fetch analytics data
    const [
      totalUsers,
      totalCenters,
      totalMaterials,
      totalListings,
      activeListings,
      pendingVerifications,
      verifiedCenters,
      totalReviews,
      totalMessages,
      totalClaims,
      dailyStats,
      monthlyStats,
      userGrowth,
      centerGrowth,
      listingGrowth
    ] = await Promise.all([
      prisma.user.count(),
      prisma.recyclingCenter.count(),
      prisma.material.count(),
      prisma.marketplaceListing.count(),
      prisma.marketplaceListing.count({
        where: {
          ...dateFilter,
          status: ListingStatus.ACTIVE,
        }
      }),
      prisma.recyclingCenter.count({
        where: {
          ...dateFilter,
          verification_status: 'PENDING',
        },
      }),
      prisma.recyclingCenter.count({
        where: {
          ...dateFilter,
          verification_status: 'VERIFIED',
        },
      }),
      prisma.review.count(),
      prisma.message.count(),
      prisma.recyclingCenterClaim.count(),
      // Daily stats for the last 30 days
      prisma.$queryRaw<Array<{ date: Date; count: number }>>`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date
      `,
      // Monthly stats for the last 12 months
      prisma.$queryRaw<Array<{ month: Date; count: number }>>`
        SELECT DATE_FORMAT(created_at, '%Y-%m-01') as month, COUNT(*) as count
        FROM users
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month
      `,
      // User growth data
      prisma.user.count({
        where: {
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          }
        }
      }),
      // Center growth data
      prisma.recyclingCenter.count({
        where: {
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          }
        }
      }),
      // Listing growth data
      prisma.marketplaceListing.count({
        where: {
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totals: {
          totalUsers,
          totalCenters,
          totalMaterials,
          totalListings,
          activeListings,
          pendingVerifications,
          verifiedCenters,
          totalReviews,
          totalMessages,
          totalClaims,
        },
        growth: {
          newUserCount30Days: userGrowth,
          newCenterCount30Days: centerGrowth,
          newListingsCount30Days: listingGrowth,
        },
        dailyStats: dailyStats.map(d => ({ date: d.date, count: Number(d.count) })),
        monthlyStats: monthlyStats.map(m => ({ month: m.month, count: Number(m.count) })),
      },
    });

  } catch (error) {
    console.error('[GET Dashboard Admin Analytics Error]', error);

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
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}