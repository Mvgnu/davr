import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic'; // Ensure dynamic processing

// DELETE endpoint for removing a marketplace listing (admin only)
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { listingId: string } }
) {
  try {
    // 1. Check Authentication & Authorization
    const session = await getServerSession(authOptions);
    const userIsAdmin = session?.user?.isAdmin === true;

    if (!session?.user?.id || !userIsAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { listingId } = params;

    if (!listingId) {
        return NextResponse.json({ success: false, error: 'Listing ID is required' }, { status: 400 });
    }

    // 2. Check if listing exists (optional, delete is idempotent)
    const listing = await prisma.marketplaceListing.findUnique({
        where: { id: listingId },
        select: { id: true } // Select minimal data
    });

    if (!listing) {
        return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    // 3. Delete the listing
    await prisma.marketplaceListing.delete({
      where: { id: listingId },
    });

    // 4. Return success response
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting marketplace listing:', error);
    // Handle potential Prisma errors, e.g., foreign key constraints if applicable
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 