import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// GET handler to fetch all users (Admin Only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        created_at: true,
      },
    });

    // Transform the data to match the frontend interface
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.created_at,
    }));

    return NextResponse.json({ success: true, users: transformedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch users' }), { status: 500 });
  }
}

// PUT handler to update a user (Admin Only)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    
    // Validate the input
    const updateUserSchema = z.object({
      id: z.string().cuid(),
      name: z.string().nullable().optional(),
      email: z.string().email().optional(),
      role: z.enum(['USER', 'CENTER_OWNER', 'ADMIN']).optional(),
    });
    
    const validationResult = updateUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { id, ...updateData } = validationResult.data;
    
    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        created_at: true,
      },
    });

    // Transform the data to match the frontend interface
    const transformedUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      emailVerified: updatedUser.emailVerified,
      createdAt: updatedUser.created_at,
    };

    return NextResponse.json({ success: true, user: transformedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return new NextResponse(JSON.stringify({ error: 'User not found' }), { status: 404 });
      }
    }
    
    return new NextResponse(JSON.stringify({ error: 'Failed to update user' }), { status: 500 });
  }
}

// DELETE handler to delete a user (Admin Only)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    // Prevent deletion of the current admin user
    if (user.id === session.user.id) {
      return new NextResponse(JSON.stringify({ error: 'Cannot delete yourself' }), { status: 400 });
    }

    // Delete the user
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to delete user' }), { status: 500 });
  }
}
