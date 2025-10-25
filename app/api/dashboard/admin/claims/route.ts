import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/permissions';

const DEFAULT_PAGE_SIZE = 10;

export async function GET(request: NextRequest) {
  try {
    // Require ADMIN role
    await requireRole('ADMIN');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || `${DEFAULT_PAGE_SIZE}`, 10);
    const skip = (page - 1) * limit;

    // Build where clause based on status filter
    const whereClause: any = {};
    if (status !== 'all') {
      whereClause.status = status;
    }

    // Fetch claims with related data and pagination
    const [claims, totalClaims] = await prisma.$transaction([
      prisma.recyclingCenterClaim.findMany({
        skip: skip,
        take: limit,
        where: whereClause,
        include: {
          recyclingCenter: {
            select: {
              id: true,
              name: true,
              city: true,
              address_street: true,
              slug: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviewed_by: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
      prisma.recyclingCenterClaim.count({
        where: whereClause,
      }),
    ]);

    // Get counts for different statuses
    const counts = await prisma.recyclingCenterClaim.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const statusCounts = counts.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalClaims / limit);

    return NextResponse.json({
      success: true,
      data: {
        claims,
        counts: statusCounts,
        pagination: {
          currentPage: page,
          totalPages,
          pageSize: limit,
          totalItems: totalClaims,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('[Dashboard Admin Claims GET Error]', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch claims' },
      { status: 500 }
    );
  }
}