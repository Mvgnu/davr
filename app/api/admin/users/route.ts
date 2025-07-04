import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

const DEFAULT_PAGE_SIZE = 15; // Adjust page size for users if needed

// GET handler to fetch all users (Admin Only)
export async function GET(request: NextRequest) {
  // 1. Check Authentication & Authorization
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated and is an admin
  // Note: Relies on the `isAdmin` flag being populated in the session callback
  // Need to cast session.user to include potentially custom fields like isAdmin
  const userIsAdmin = session?.user ? (session.user as { isAdmin?: boolean }).isAdmin === true : false;

  if (!session?.user?.id || !userIsAdmin) { 
    console.log("Admin API access denied for fetching users", { 
        userId: session?.user?.id, 
        isAdmin: userIsAdmin 
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Handle Pagination & Search
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || `${DEFAULT_PAGE_SIZE}`, 10);
  const skip = (page - 1) * limit;

  try {
    // 3. Construct filter condition based on search query
    const whereCondition: Prisma.UserWhereInput = searchQuery
      ? {
          OR: [
            {
              name: {
                contains: searchQuery,
                mode: 'insensitive', // Case-insensitive search
              },
            },
            {
              email: {
                contains: searchQuery,
                mode: 'insensitive',
              },
            },
          ],
        }
      : {}; // Empty object if no search query

    // 4. Fetch users and total count using Prisma transaction
    const [users, totalUsers] = await prisma.$transaction([
      prisma.user.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          isAdmin: true,
        },
        orderBy: {
          email: 'asc',
        },
        skip: skip,
        take: limit,
      }),
      prisma.user.count({ where: whereCondition }),
    ]);

    // 5. Calculate pagination metadata
    const totalPages = Math.ceil(totalUsers / limit);

    // 6. Return the paginated user list
    return NextResponse.json({
      users,
      pagination: {
        currentPage: page,
        totalPages,
        pageSize: limit,
        totalItems: totalUsers,
      },
    });

  } catch (error) {
    console.error('[GET Admin Users Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// Note: POST, PUT, DELETE handlers for user management can be added here later.