import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Zod schema for validating PATCH request body (Admin Edit)
const adminUpdateListingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100).optional(),
  description: z.string().optional(),
  materialId: z.string().cuid('Invalid Material ID').optional(),
  quantity: z.number().positive('Quantity must be positive').optional(),
  unit: z.string().min(1, 'Unit is required').max(20).optional(),
  location: z.string().min(1, 'Location is required').max(100).optional(),
  is_active: z.boolean().optional(),
  // Admins likely shouldn't change the seller_id directly via this form
  // image_url might be handled separately if image editing is added
});

// DELETE handler to remove a marketplace listing (Admin Only)
export async function DELETE(
  request: Request, // Keep request even if unused for potential future middleware/logging
  { params }: { params: { listingId: string } }
) {
  // 1. Check Authentication & Authorization
  const session = await getServerSession(authOptions);
  const userIsAdmin = session?.user ? (session.user as { isAdmin?: boolean }).isAdmin === true : false;

  if (!session?.user?.id || !userIsAdmin) {
    console.log("Admin API access denied for deleting listing", { 
        userId: session?.user?.id, 
        isAdmin: userIsAdmin,
        listingId: params.listingId
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Extract Listing ID
  const listingId = params.listingId;
  if (!listingId) {
    return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
  }

  // 3. Attempt to delete the listing
  try {
    // Prisma automatically throws an error if the record to delete is not found (P2025)
    await prisma.marketplaceListing.delete({
      where: { id: listingId },
    });

    // 4. Return Success Response
    console.log(`Admin ${session.user.email} deleted listing ${listingId}`);
    // Return 204 No Content for successful deletions as there's no body
    return new NextResponse(null, { status: 204 }); 

  } catch (error: any) {
    // Handle Prisma errors, specifically record not found
    if (error.code === 'P2025') { // Prisma code for record to delete not found
        console.warn(`Listing with ID ${listingId} not found for deletion by admin ${session.user.email}.`);
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    
    // Handle other potential errors
    console.error(`[DELETE Admin Listing Error - ID: ${listingId}]`, error);
    return NextResponse.json(
      { error: 'Failed to delete marketplace listing' },
      { status: 500 }
    );
  }
}

// GET handler to retrieve a single listing by ID (Admin Only)
export async function GET(
    request: NextRequest, 
    { params }: { params: { listingId: string } }
) {
    // 1. Check Authentication & Authorization
    const session = await getServerSession(authOptions);
    const userIsAdmin = session?.user ? (session.user as { isAdmin?: boolean }).isAdmin === true : false;

    if (!session?.user?.id || !userIsAdmin) {
        console.log("Admin API access denied for getting listing", { userId: session?.user?.id, isAdmin: userIsAdmin, listingId: params.listingId });
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const listingId = params.listingId;
    if (!listingId) {
        return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    try {
        // 2. Fetch the Listing including related data needed for editing/display
        const listing = await prisma.marketplaceListing.findUnique({
            where: { id: listingId },
            include: {
                seller: { select: { id: true, name: true, email: true } },
                material: { select: { id: true, name: true } },
            }
        });

        // 3. Handle Not Found
        if (!listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        // 4. Return Success Response
        return NextResponse.json({ success: true, data: listing });

    } catch (error: any) {
        console.error(`[GET Admin Listing Error - ID: ${listingId}]`, error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch listing', details: error.message },
            { status: 500 }
        );
    }
}

// PATCH handler to update a listing (Admin Only)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { listingId: string } }
) {
    // 1. Check Authentication & Authorization
    const session = await getServerSession(authOptions);
    const userIsAdmin = session?.user ? (session.user as { isAdmin?: boolean }).isAdmin === true : false;

    if (!session?.user?.id || !userIsAdmin) {
         console.log("Admin API access denied for updating listing", { userId: session?.user?.id, isAdmin: userIsAdmin, listingId: params.listingId });
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const listingId = params.listingId;
    if (!listingId) {
        return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    try {
        // 2. Parse and Validate Request Body
        const body = await request.json();
        const validation = adminUpdateListingSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: 'Invalid input data', details: validation.error.errors },
                { status: 400 }
            );
        }
        const updateData = validation.data;

        // Check if materialId is valid if provided
        if (updateData.materialId) {
            const materialExists = await prisma.material.findUnique({
                where: { id: updateData.materialId },
            });
            if (!materialExists) {
                return NextResponse.json({ error: 'Invalid Material ID provided' }, { status: 400 });
            }
        }

        // 3. Update the Listing (No ownership check needed for admin)
        const updatedListing = await prisma.marketplaceListing.update({
            where: { id: listingId },
            data: updateData,
             include: { // Return updated listing with relations if needed by frontend
                seller: { select: { id: true, name: true, email: true } },
                material: { select: { id: true, name: true } },
            }
        });

        console.log(`Admin ${session.user.email} updated listing ${updatedListing.id}`);

        // 4. Return Success Response
        return NextResponse.json({ success: true, data: updatedListing });

    } catch (error: any) {
        console.error(`[PATCH Admin Listing Error - ID: ${listingId}]`, error);
        if (error.code === 'P2025') { // Prisma: Record to update not found
             return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }
        // Handle other potential errors 
        return NextResponse.json(
            { success: false, error: 'Failed to update listing', details: error.message },
            { status: 500 }
        );
    }
} 