import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options'; // Use correct options path
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Schema to validate the request body
const updateUserRoleSchema = z.object({
  // Assuming role maps to isAdmin boolean for simplicity now
  // If a dedicated role field exists, validate against its possible values
  role: z.enum(['admin', 'user']), 
});

// PUT handler to update user role (Admin Only)
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
      validatedData = updateUserRoleSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
          return NextResponse.json({ error: 'Invalid request body', details: error.errors }, { status: 400 });
      }
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    // Map role string to isAdmin boolean
    const newIsAdmin = validatedData.role === 'admin';
    
    // 3. Update user role (isAdmin flag) using Prisma
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { isAdmin: newIsAdmin },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
      }
    });
    
    // 4. Return success response
    return NextResponse.json({
      success: true,
      user: {
          ...updatedUser,
          role: updatedUser.isAdmin ? 'admin' : 'user' // Map back for consistency if needed
      }
    });
    
  } catch (error) {
    // Handle potential Prisma errors (e.g., user not found)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.error('Error updating user role [Prisma]:', error);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
} 