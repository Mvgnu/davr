import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { ListingStatus, Prisma } from '@prisma/client'; // Import enum and Prisma namespace
import { z } from 'zod';

export const dynamic = 'force-dynamic'; // Ensure dynamic processing

// Zod schema for validating the request body
const updateStatusSchema = z.object({
  status: z.nativeEnum(ListingStatus), // Validate against the enum
});

// PATCH endpoint for updating a marketplace listing's status (admin only)
export async function PATCH(
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

    // 2. Validate request body
    let validatedData;
    try {
      const body = await request.json();
      validatedData = updateStatusSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ success: false, error: 'Invalid request body', details: error.errors }, { status: 400 });
      } 
      // Handle non-JSON body or other parsing errors
      return NextResponse.json({ success: false, error: 'Invalid request format' }, { status: 400 });
    }

    const { status } = validatedData;

    // 3. Update the listing status
    const updatedListing = await prisma.marketplaceListing.update({
      where: { id: listingId },
      data: { status: status },
    });

    // 4. Return success response
    return NextResponse.json({ success: true, data: updatedListing }); // Optionally return updated data

  } catch (error: any) {
    console.error('Error updating marketplace listing status:', error);
    // Handle potential Prisma errors (e.g., listing not found)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') { // Record not found
        return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
      }
    }
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 