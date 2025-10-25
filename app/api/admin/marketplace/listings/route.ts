import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { Prisma, ListingStatus, UserRole } from '@prisma/client';

/**
 * GET handler: Fetch all marketplace listings for admin moderation
 */
export async function GET(request: NextRequest) {
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

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const {
    page = '1',
    limit = '10',
    status,
    search,
    sellerId,
  } = searchParams;

  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 10;
  const skip = (pageNum - 1) * limitNum;

  try {
    // Build where clause dynamically
    const whereClause: Prisma.MarketplaceListingWhereInput = {};

    // Status filter
    if (status && Object.values(ListingStatus).includes(status as ListingStatus)) {
      whereClause.status = status as ListingStatus;
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Seller filter
    if (sellerId) {
      whereClause.seller_id = sellerId;
    }

    // Count total matching listings
    const totalListings = await prisma.marketplaceListing.count({
      where: whereClause,
    });

    // Fetch paginated listings with user details
    const listings = await prisma.marketplaceListing.findMany({
      where: whereClause,
      include: {
        material: { select: { name: true, slug: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
      orderBy: {
        created_at: 'desc',
      },
      skip,
      take: limitNum,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalListings / limitNum);

    return NextResponse.json({
      listings,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalListings,
        limit: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('[Admin Marketplace Listings GET Error]', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Fehler beim Abrufen der Marktplatz-Angebote',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT handler: Update a marketplace listing status (approve/reject)
 */
export async function PUT(request: NextRequest) {
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
    const { listingId, status, reason } = await request.json();

    if (!listingId || !status) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'listingId und status sind erforderlich',
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
 * DELETE handler: Delete a marketplace listing (this endpoint is for bulk operations)
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
    const { listingId, blockUser } = await request.json();

    if (!listingId) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'listingId ist erforderlich',
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

    // Delete the listing
    await prisma.marketplaceListing.delete({
      where: { id: listingId },
    });

    // Optional: Block the user if requested
    if (blockUser && listing.seller_id) {
      // In a real implementation, you might want to have a separate isBlocked field
      // For now, we'll update the user's role, but ideally you'd have a separate field
      await prisma.user.update({
        where: { id: listing.seller_id },
        data: { 
          role: UserRole.USER // In a real implementation, create a BLOCKED role or isBlocked field
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Angebot erfolgreich gelöscht' });
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