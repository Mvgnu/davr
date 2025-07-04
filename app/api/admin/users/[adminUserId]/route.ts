import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Get user details (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // 1. Check Authentication & Authorization
    const session = await getServerSession(authOptions);
    const userIsAdmin = session?.user ? (session.user as { isAdmin?: boolean }).isAdmin === true : false;

    if (!session?.user?.id || !userIsAdmin) {
      console.log("Admin API access denied for fetching user details", {
        userId: session?.user?.id,
        isAdmin: userIsAdmin
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = params.userId;
    if (!userId) {
      return NextResponse.json({ error: 'User ID parameter is required' }, { status: 400 });
    }

    // 2. Query for user details using Prisma
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        isAdmin: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Format user data (only format emailVerified)
    const userData = {
      ...user,
      emailVerified: user.emailVerified?.toISOString() ?? null,
    };
    
    // 4. Fetch user activity (Optional - keep if needed, use Prisma)
    // Example using Prisma if an activity model exists
    /*
    let userActivity = [];
    try {
      userActivity = await prisma.userActivity.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { action: true, createdAt: true, details: true },
      });
    } catch (activityError) {
      console.error(`Failed to fetch activity for user ${userId}:`, activityError);
    }
    */
    
    // 5. Return user details (without activity for now)
    return NextResponse.json({ user: userData }); // Add activity: userActivity if fetched

  } catch (error) {
    console.error(`[GET Admin User Details Error - ID: ${params.userId}]`, error);
    return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 });
  }
}

// Define the schema for the request body using Zod
const updateUserAdminStatusSchema = z.object({
  isAdmin: z.boolean(),
});

// PATCH handler to update a user's admin status (Admin Only)
export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  // 1. Check Authentication & Authorization
  const session = await getServerSession(authOptions);
  const userIsAdmin = session?.user ? (session.user as { isAdmin?: boolean }).isAdmin === true : false;

  if (!session?.user?.id || !userIsAdmin) {
    console.log("Admin API access denied for updating user status", { 
        userId: session?.user?.id, 
        isAdmin: userIsAdmin 
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Extract User ID from URL parameters
  const targetUserId = params.userId;

  // 3. Prevent admin from changing their own status via this endpoint
  if (targetUserId === session.user.id) {
    console.log("Admin attempted to change their own status via API", { adminId: session.user.id });
    return NextResponse.json({ error: 'Cannot change your own admin status' }, { status: 400 });
  }

  // 4. Validate Request Body
  let validatedData;
  try {
    const body = await request.json();
    validatedData = updateUserAdminStatusSchema.parse(body);
  } catch (error) {
    console.error("Invalid request body for updating user admin status:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // 5. Update User in Database
  try {
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        isAdmin: validatedData.isAdmin,
      },
      select: { // Select only necessary fields to return
        id: true,
        name: true,
        email: true,
        isAdmin: true,
      },
    });

    // 6. Return Success Response
    console.log(`Admin ${session.user.email} updated user ${targetUserId} admin status to ${validatedData.isAdmin}`);
    return NextResponse.json(updatedUser);

  } catch (error: any) {
    // Handle Prisma errors, e.g., user not found
    if (error.code === 'P2025') { // Prisma code for record not found
        console.error(`User with ID ${targetUserId} not found for update.`);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.error('[PATCH Admin User Error]', error);
    return NextResponse.json(
      { error: 'Failed to update user admin status' },
      { status: 500 }
    );
  }
} 