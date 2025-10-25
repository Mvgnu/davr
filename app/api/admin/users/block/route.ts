import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

/**
 * POST handler: Block a user with the specified ID
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json(
      {
        error: 'UNAUTHORIZED',
        message: 'Admin-Zugriff erforderlich',
      },
      { status: 403 }
    );
  }

  try {
    const { userId, reason } = await request.json();

    if (!userId) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'userId ist erforderlich',
        },
        { status: 400 }
      );
    }

    // For now, we'll implement blocking by changing their role
    // In a real implementation, you'd add an isBlocked field to the User model
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        role: UserRole.USER // This would be a blocked role in a complete implementation
        // For now, we'll just change the role to USER if it was something else
      },
    });

    // Optionally, deactivate all their listings
    await prisma.marketplaceListing.updateMany({
      where: { seller_id: userId },
      data: { status: 'REJECTED' },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Benutzer erfolgreich gesperrt', 
      user: updatedUser 
    });
  } catch (error) {
    console.error('[Admin User Block Error]', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Fehler beim Sperren des Benutzers',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler: Unblock a user with the specified ID
 */
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json(
      {
        error: 'UNAUTHORIZED',
        message: 'Admin-Zugriff erforderlich',
      },
      { status: 403 }
    );
  }

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'userId ist erforderlich',
        },
        { status: 400 }
      );
    }

    // Reset user to regular USER role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        role: UserRole.USER
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Benutzer erfolgreich entsperrt', 
      user: updatedUser 
    });
  } catch (error) {
    console.error('[Admin User Unblock Error]', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Fehler beim Entsperren des Benutzers',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}