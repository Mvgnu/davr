import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/owner/centers
 * Get all centers owned by the current user
 */
export async function GET() {
  try {
    const user = await requireRole(['CENTER_OWNER', 'ADMIN']);

    const centers = await prisma.recyclingCenter.findMany({
      where: { managedById: user.id },
      include: {
        offers: {
          include: {
            material: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        working_hours: true,
        _count: {
          select: {
            offers: true,
            reviews: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Calculate average rating for each center
    const centersWithStats = centers.map((center) => {
      const avgRating =
        center.reviews.length > 0
          ? center.reviews.reduce((sum, r) => sum + r.rating, 0) /
            center.reviews.length
          : 0;

      return {
        ...center,
        averageRating: Number(avgRating.toFixed(1)),
        reviewCount: center.reviews.length,
      };
    });

    return NextResponse.json({
      success: true,
      centers: centersWithStats,
    });
  } catch (error) {
    console.error('[Get Owner Centers Error]', error);

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
      { error: 'Failed to fetch centers' },
      { status: 500 }
    );
  }
}
