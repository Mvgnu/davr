import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options'; 
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Zod schema for validating PATCH request body
// Allow updating name, image, and potentially other non-critical fields
const updateUserProfileSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  image: z.string().url("Invalid URL format").optional().nullable(),
  // Add other fields users should be allowed to update themselves
  // e.g., bio: z.string().optional().nullable(),
}).partial().refine( // Ensure at least one field is being updated
    (data) => Object.keys(data).length > 0,
    { message: "At least one field must be provided for update." }
);

// PATCH handler for users to update their own profile
export async function PATCH(request: NextRequest, { params }: { params: { userId: string } }) {
  // 1. Check Authentication & Authorization (User must match target ID)
  const session = await getServerSession(authOptions);
  const requestingUserId = session?.user?.id;
  const targetUserId = params.userId;

  if (!requestingUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (requestingUserId !== targetUserId) {
    console.warn(`User ${requestingUserId} attempted to update profile of user ${targetUserId}`);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Validate Request Body
  let validatedData;
  try {
    const body = await request.json();
    validatedData = updateUserProfileSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // 3. Update User in Database
  try {
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId }, // Use targetUserId which is verified = requestingUserId
      data: validatedData, // Pass validated data
      select: { // Return updated user data (excluding sensitive fields)
        id: true,
        name: true,
        email: true,
        image: true,
        isAdmin: true,
        emailVerified: true,
      },
    });

    // 4. Return Success Response
    return NextResponse.json(updatedUser);

  } catch (error) {
    // Handle potential Prisma errors (e.g., user somehow deleted between check and update)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.error('[PATCH User Profile Error]', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// DELETE handler for users to delete their own account
export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
  // 1. Check Authentication & Authorization (User must match target ID)
  const session = await getServerSession(authOptions);
  const requestingUserId = session?.user?.id;
  const targetUserId = params.userId;

  if (!requestingUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (requestingUserId !== targetUserId) {
    console.warn(`User ${requestingUserId} attempted to delete account of user ${targetUserId}`);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Delete User in Database
  try {
    await prisma.user.delete({
      where: { id: targetUserId }, // Use targetUserId which is verified = requestingUserId
    });

    // 3. Return Success Response
    // Consider invalidating the session here if possible/necessary
    console.log(`User ${requestingUserId} deleted their account.`);
    return new NextResponse(null, { status: 204 }); // 204 No Content is standard for successful DELETE

  } catch (error) {
    // Handle potential Prisma errors (e.g., user not found)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.error('[DELETE User Account Error]', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
} 