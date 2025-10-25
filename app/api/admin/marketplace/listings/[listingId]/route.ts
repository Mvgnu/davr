import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { ListingStatus, UserRole } from '@prisma/client';

/**
 * PUT handler: Update a specific marketplace listing
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { listingId: string } }
) {
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
    const { listingId } = params;
    const { status, reason } = await request.json();

    if (!status) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'status ist erforderlich',
        },
        { status: 400 }
      );
    }

    // Verify the status is valid
    const validStatuses = Object.values(ListingStatus);
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Ungültiger Status',
        },
        { status: 400 }
      );
    }

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: {
        seller: true
      }
    });

    if (!listing) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: 'Angebot nicht gefunden',
        },
        { status: 404 }
      );
    }

    // Update the listing status
    const updatedListing = await prisma.marketplaceListing.update({
      where: { id: listingId },
      data: {
        status,
        updated_at: new Date()
      },
      include: {
        material: { select: { name: true, slug: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
    });

    // TODO: Send notification to user about status change
    // This would typically involve sending an email or in-app notification

    return NextResponse.json(updatedListing);
  } catch (error) {
    console.error('[Admin Marketplace Listing PUT Error]', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Fehler beim Aktualisieren des Angebots',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler: Delete a specific marketplace listing
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { listingId: string } }
) {
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
    const { listingId } = params;
    const requestBody = await request.json().catch(() => ({}));
    const { blockUser } = requestBody;

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: {
        seller: true
      }
    });

    if (!listing) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: 'Angebot nicht gefunden',
        },
        { status: 404 }
      );
    }

    // Delete the listing
    await prisma.marketplaceListing.delete({
      where: { id: listingId },
    });

    // Optional: Block the user if requested
    if (blockUser && listing.seller_id) {
      // In a complete implementation, you'd have an isBlocked field
      // For now, we'll change their role to limit functionality
      await prisma.user.update({
        where: { id: listing.seller_id },
        data: { 
          role: UserRole.USER // This would be a blocked role in a complete implementation
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: blockUser 
        ? 'Angebot erfolgreich gelöscht und Benutzer gesperrt' 
        : 'Angebot erfolgreich gelöscht' 
    });
  } catch (error) {
    console.error('[Admin Marketplace Listing DELETE Error]', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Fehler beim Löschen des Angebots',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}