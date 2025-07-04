import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options'; 
import AdminUsersClientContent from '@/components/admin/AdminUsersClientContent'; 
import { prisma } from '@/lib/db/prisma'; // Import Prisma client
import { Prisma } from '@prisma/client'; // Import Prisma types

export const metadata: Metadata = {
  title: 'User Management | Admin Dashboard | DAVR',
  description: 'Manage user accounts, roles, and permissions on the DAVR platform.',
};

// Type expected by the AdminUsersClientContent component
export type ClientAdminUser = {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  role: string;
  registeredAt: string;
  lastLogin: string | null;
  status: string;
};

// Fetch function using Prisma directly, matching API logic
async function getUsers(searchQuery: string, page: number = 1, limit: number = 10): Promise<{ users?: ClientAdminUser[]; pagination?: any; error?: string }> {
  try {
    // 1. Check Authentication & Authorization (Using session from the page component)
    const session = await getServerSession(authOptions);
    const userIsAdmin = session?.user?.isAdmin === true;

    if (!session?.user?.id || !userIsAdmin) {
      return { error: 'Unauthorized access' };
    }

    // 2. Build Prisma WHERE clause based on search query
    let where: Prisma.UserWhereInput = {};
    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }
    
    const skip = (page - 1) * limit;

    // 3. Execute Prisma queries
    const [users, totalUsers] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          isAdmin: true,
          // createdAt: true, // Assuming createdAt exists for registeredAt
        },
        orderBy: {
          // createdAt: 'desc', // Or appropriate field
          email: 'asc' 
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // 4. Format users for the client component
    const formattedUsers: ClientAdminUser[] = users.map(user => ({
      id: user.id,
      name: user.name ?? 'N/A',
      email: user.email ?? 'N/A',
      verified: !!user.emailVerified,
      role: user.isAdmin ? 'admin' : 'user',
      // registeredAt: user.createdAt?.toISOString().split('T')[0] || 'N/A',
      // lastLogin: null, // Placeholder
      // status: 'active', // Placeholder, assumes no status field
      registeredAt: 'N/A', // Placeholder
      lastLogin: null, // Placeholder
      status: 'active' // Placeholder
    }));

    // 5. Prepare pagination data
    const totalPages = Math.ceil(totalUsers / limit);
    const pagination = {
      total: totalUsers,
      page,
      limit,
      totalPages,
    };

    return { users: formattedUsers, pagination };

  } catch (error) {
    console.error("Error fetching admin users directly [Prisma]:", error);
    return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}

// Admin User Management Page Component - Uses direct Prisma fetch
export default async function AdminUsersPage({ searchParams }: { searchParams?: { search?: string, page?: string }}) {
  const currentSearch = searchParams?.search || '';
  const currentPage = parseInt(searchParams?.page || '1', 10);

  const session = await getServerSession(authOptions);
  const currentAdminId = session?.user?.id;

  // Fetch users directly using Prisma
  const result = await getUsers(currentSearch, currentPage);

  // Handle Error State
  if (result.error || !currentAdminId) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">User Management</h1>
        <div className="flex items-center p-4 bg-red-100 border border-red-300 rounded-md text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          <p>Error loading users: {result.error || 'Could not identify current admin user.'}</p>
        </div>
      </div>
    );
  }

  const users = result.users ?? [];
  const pagination = result.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 0 };

  // Render the client component with initial data fetched via Prisma
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      {/* Pass initial data and pagination to the client component */}
      {/* AdminUsersClientContent might need updates to accept these props */}
      <AdminUsersClientContent 
        initialUsers={users}
        initialPagination={pagination}
        initialSearch={currentSearch}
        currentAdminId={currentAdminId}
      />
    </div>
  );
} 