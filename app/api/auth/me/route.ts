import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options'; // Correct path based on file search
import { prisma } from '@/lib/db/prisma'; // Use Prisma consistently

export const dynamic = 'force-dynamic'; // Mark route as dynamic

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) { 
      return NextResponse.json({ 
        success: false, 
        message: 'Not authenticated' 
      }, { status: 401 });
    }
    
    // Fetch user data from database using Prisma
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      // Select specific fields to return (exclude password)
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        isAdmin: true, // Assuming isAdmin is a field on the User model now
        // Removed fields causing type errors
        // createdAt: true, 
        // updatedAt: true, 
        // Add other necessary fields like role if it exists on User model
        // profile_image and bio seem non-standard, adjust based on actual schema
      }
    });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 });
    }
    
    // Format user data for client (adjust based on Prisma select)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin, // Use the field from Prisma
      // Map profileImage and bio if they are added to the Prisma select above
      profileImage: user.image, // Map Prisma 'image' to 'profileImage' if needed
      // bio: user.bio || '', // If bio is selected
      // Removed formatting for fields not selected
      // createdAt: user.createdAt ? user.createdAt.toISOString() : null,
      // updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
    };
    
    return NextResponse.json({ 
      success: true, 
      user: userData 
    });
    
  } catch (error) {
    console.error('Error fetching user profile [Prisma]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      success: false, 
      message: 'An error occurred while fetching your profile',
      details: errorMessage
    }, { status: 500 });
  }
} 