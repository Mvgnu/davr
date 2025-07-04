import React from 'react';
import { AlertCircle, Check, X } from 'lucide-react';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options'; 
import { prisma } from '@/lib/db/prisma'; 
import { Prisma } from '@prisma/client'; 
import AdminClaimsClientContent from '@/components/admin/AdminClaimsClientContent'; // Import the new client component

export const metadata: Metadata = {
  title: 'Recycling Center Claims | Admin Dashboard | DAVR',
  description: 'Review and manage recycling center ownership claims.',
};

// Type for the claim data fetched
type ClaimData = Prisma.RecyclingCenterClaimGetPayload<{
  include: {
    recyclingCenter: { select: { name: true, slug: true, city: true } };
    user: { select: { email: true } };
  };
}>;

interface FormattedClaim {
  id: string;
  recyclingCenterId: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  businessRole: string | null;
  message: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  recyclingCenterName: string | null | undefined;
  recyclingCenterSlug: string | null | undefined;
  recyclingCenterCity: string | null | undefined;
  userEmail: string | null | undefined;
}

// Fetch function using Prisma directly
async function getClaims(page: number = 1, limit: number = 10, status: string = 'all'): Promise<{ claims?: FormattedClaim[]; pagination?: any; error?: string }> {
  try {
    // 1. Check Authentication & Authorization
    const session = await getServerSession(authOptions);
    const userIsAdmin = session?.user?.isAdmin === true;

    if (!session?.user?.id || !userIsAdmin) {
      return { error: 'Unauthorized access' };
    }

    // 2. Build Prisma WHERE clause
    let where: Prisma.RecyclingCenterClaimWhereInput = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    
    const skip = (page - 1) * limit;

    // 3. Execute Prisma queries
    const [claims, totalClaims] = await prisma.$transaction([
      prisma.recyclingCenterClaim.findMany({
        where,
        include: {
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

    // 4. Format claims (adjusting structure slightly)
    const formattedClaims: FormattedClaim[] = claims.map((claim: ClaimData) => ({
      id: claim.id,
      recyclingCenterId: claim.recycling_center_id,
      userId: claim.user_id,
      name: claim.name,
      email: claim.email,
      phone: claim.phone,
      companyName: claim.companyName,
      businessRole: claim.businessRole,
      message: claim.message,
      status: claim.status,
      createdAt: claim.created_at,
      updatedAt: claim.updated_at,
      recyclingCenterName: claim.recyclingCenter?.name,
      recyclingCenterSlug: claim.recyclingCenter?.slug,
      recyclingCenterCity: claim.recyclingCenter?.city,
      userEmail: claim.user?.email,
    }));

    // 5. Prepare pagination data
    const totalPages = Math.ceil(totalClaims / limit);
    const pagination = {
      total: totalClaims,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return { claims: formattedClaims, pagination };

  } catch (error) {
    console.error("Error fetching admin claims directly [Prisma]:", error);
    return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}

// Admin Claims Page Component - Now acts as a wrapper providing initial data
export default async function AdminClaimsPage({ searchParams }: { searchParams?: { page?: string, status?: string }}) {
  const currentPage = parseInt(searchParams?.page || '1', 10);
  const currentStatus = searchParams?.status || 'all';

  const result = await getClaims(currentPage, 10, currentStatus);

  // Handle Error State
  if (result.error) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-4">Claims Management</h1>
        <div className="flex items-center p-4 bg-red-100 border border-red-300 rounded-md text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          <p>Error loading claims: {result.error}</p>
        </div>
      </div>
    );
  }

  const claims = result.claims ?? [];
  const pagination = result.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPrevPage: false };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Claims Management</h1>

      {/* Render the client component, passing initial data */}
      <AdminClaimsClientContent 
         initialClaims={claims}
         initialPagination={pagination}
         initialStatus={currentStatus}
      />

    </div>
  );
} 