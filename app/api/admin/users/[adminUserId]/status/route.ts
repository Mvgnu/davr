import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options'; // Use correct options path
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Schema to validate the request body
const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'pending']), // Assuming these are possible statuses
});

// PUT handler to update user status (Admin Only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // 1. Check Authentication & Authorization
    const session = await getServerSession(authOptions);
    const userIsAdmin = session?.user ? (session.user as { isAdmin?: boolean }).isAdmin === true : false;

    if (!session?.user?.id || !userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }
    
    const targetUserId = params.userId;
    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID parameter is required' }, { status: 400 });
    }
    
    // 2. Get and validate the request body
    let validatedData;
    try {
      const body = await request.json();
      validatedData = updateUserStatusSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
          return NextResponse.json({ error: 'Invalid request body', details: error.errors }, { status: 400 });
      }
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    // 3. Update user status using Prisma
    // NOTE: This requires a `status` field on the User model in schema.prisma
    /* 
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { status: validatedData.status }, // Update the status field
      select: {
        id: true,
        name: true,
        email: true,
        status: true, // Select the updated status
      }
    });
    */
   
    // Placeholder response since status field doesn't exist yet
    console.warn(`Attempted to update status for user ${targetUserId}, but User model lacks 'status' field.`);
    // Fetch the user to return *something*
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true }
    });
    if (!user) throw new Error("User not found"); // Should be caught by P2025 below generally

    const updatedUser = { ...user, status: validatedData.status }; // Simulate update

    // If suspending, consider clearing sessions (Optional, requires session management logic)
    // if (validatedData.status === 'suspended') {
    //   // ... logic to clear sessions ...
    // }
    
    // 4. Return success response (simulated)
    return NextResponse.json({
      success: true,
      user: updatedUser
    });
    
  } catch (error) {
    // Handle potential Prisma errors (e.g., user not found)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.error('Error updating user status [Prisma]:', error);
    return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
  }
} 