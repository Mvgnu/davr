import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { Prisma, RecyclingCenterClaim } from '@prisma/client';

export const dynamic = 'force-dynamic'; // Mark route as dynamic

// Define the expected shape of the claim after including relations
// This leverages Prisma utility types for better safety
type ClaimWithRelations = Prisma.RecyclingCenterClaimGetPayload<{
  include: {
    recyclingCenter: { select: { name: true, slug: true, city: true } };
    user: { select: { email: true } };
  }
}>;

// GET endpoint for fetching all recycling center claim requests (admin only) - using Prisma
export async function GET(request: NextRequest) {
  try {
    // 1. Check Authentication & Authorization
    const session = await getServerSession(authOptions);
    const userIsAdmin = session?.user?.isAdmin === true;

    if (!session?.user?.id || !userIsAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status') || '';
    const skip = (page - 1) * limit;

    // 3. Build Prisma WHERE clause
    let where: Prisma.RecyclingCenterClaimWhereInput = {};
    if (status && status !== 'all') { // Assuming 'all' means no status filter
      // Ensure status is a valid RecyclingCenterClaimStatus enum value if defined
      // For now, assuming status is a string field based on schema
      where.status = status;
    }

    // 4. Execute Prisma queries
    const [claims, totalClaims] = await prisma.$transaction([
      prisma.recyclingCenterClaim.findMany({
        where,
        include: { // Include related data
          recyclingCenter: {
            select: { name: true, slug: true, city: true }
          },
          user: {
            select: { email: true }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        skip: skip,
        take: limit,
      }),
      prisma.recyclingCenterClaim.count({ where }),
    ]);

    // 5. Format claims for response (adjust field names if needed)
    // Add explicit type to 'claim' parameter
    const formattedClaims = claims.map((claim: ClaimWithRelations) => ({
      id: claim.id,
      recycling_center_id: claim.recycling_center_id,
      user_id: claim.user_id,
      name: claim.name,
      email: claim.email,
      phone: claim.phone,
      company_name: claim.companyName,
      business_role: claim.businessRole,
      message: claim.message,
      status: claim.status,
      rejection_reason: claim.rejection_reason,
      created_at: claim.created_at,
      updated_at: claim.updated_at,
      // Access included relations safely
      recycling_center_name: claim.recyclingCenter?.name,
      recycling_center_slug: claim.recyclingCenter?.slug,
      recycling_center_city: claim.recyclingCenter?.city,
      user_email: claim.user?.email,
    }));

    // 6. Calculate pagination metadata
    const totalPages = Math.ceil(totalClaims / limit);

    return NextResponse.json({
      success: true,
      data: formattedClaims,
      pagination: {
        page,
        limit,
        totalCount: totalClaims,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching recycling center claims [Prisma]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 