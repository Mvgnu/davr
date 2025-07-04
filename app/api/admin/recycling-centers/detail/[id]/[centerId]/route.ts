import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// DELETE handler to remove a recycling center (Admin Only)
export async function DELETE(
  request: Request, // Keep request even if unused for potential future middleware/logging
  { params }: { params: { centerId: string } }
) {
  // 1. Check Authentication & Authorization
  const session = await getServerSession(authOptions);
  const userIsAdmin = session?.user ? (session.user as { isAdmin?: boolean }).isAdmin === true : false;

  if (!session?.user?.id || !userIsAdmin) {
    console.log("Admin API access denied for deleting recycling center", { 
        userId: session?.user?.id, 
        isAdmin: userIsAdmin,
        centerId: params.centerId
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Extract Center ID
  const centerId = params.centerId;
  if (!centerId) {
    return NextResponse.json({ error: 'Recycling Center ID is required' }, { status: 400 });
  }

  // 3. Attempt to delete the recycling center
  try {
    // Prisma automatically throws an error if the record to delete is not found (P2025)
    // Related RecyclingCenterOffer records should be deleted automatically due to `onDelete: Cascade` in schema
    await prisma.recyclingCenter.delete({
      where: { id: centerId },
    });

    // 4. Return Success Response
    console.log(`Admin ${session.user.email} deleted recycling center ${centerId}`);
    // Return 204 No Content for successful deletions as there's no body
    return new NextResponse(null, { status: 204 }); 

  } catch (error: any) {
    // Handle Prisma errors, specifically record not found
    if (error.code === 'P2025') { // Prisma code for record to delete not found
        console.warn(`Recycling Center with ID ${centerId} not found for deletion by admin ${session.user.email}.`);
        return NextResponse.json({ error: 'Recycling Center not found' }, { status: 404 });
    }
    
    // Handle other potential errors
    console.error(`[DELETE Admin Recycling Center Error - ID: ${centerId}]`, error);
    return NextResponse.json(
      { error: 'Failed to delete recycling center' },
      { status: 500 }
    );
  }
}

// Zod schema for validating PATCH request body
// Define allowed fields and their types. All fields are optional for PATCH.
const updateCenterSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255).optional(),
    address: z.string().min(1, 'Address is required').max(255).optional(),
    city: z.string().min(1, 'City is required').max(100).optional(),
    state: z.string().max(100).optional(),
    postal_code: z.string().max(20).optional(),
    phone_number: z.string().max(50).optional().nullable(),
    website: z.string().url({ message: "Invalid URL format" }).max(255).optional().nullable(), // Allow empty string or null to clear website
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    opening_hours: z.string().optional(), // Consider JSON validation if structured
    description: z.string().optional().nullable(),
    verification_status: z.enum(['PENDING', 'VERIFIED', 'REJECTED'])
                         .transform(val => val.toUpperCase() as 'PENDING' | 'VERIFIED' | 'REJECTED') 
                         .optional(),
    // We probably don't want admins changing slug or owner_id via PATCH directly
    // slug: z.string().min(1).optional(),
    // owner_id: z.string().cuid().optional().nullable(),
});

// PATCH handler to update a recycling center (Admin Only)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { centerId: string } }
) {
    // 1. Check Authentication & Authorization
    const session = await getServerSession(authOptions);
    const userIsAdmin = session?.user ? (session.user as { isAdmin?: boolean }).isAdmin === true : false;

    if (!session?.user?.id || !userIsAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const centerId = params.centerId;
    if (!centerId) {
        return NextResponse.json({ error: 'Recycling Center ID is required' }, { status: 400 });
    }

    try {
        // 2. Parse and Validate Request Body
        const body = await request.json();
        const validation = updateCenterSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: 'Invalid input data', details: validation.error.errors },
                { status: 400 }
            );
        }
        const updateData = validation.data;

        // Prevent updating with empty name/address/city if they are provided
        if (updateData.name === "" || updateData.address === "" || updateData.city === "") {
            return NextResponse.json({ error: 'Name, Address, and City cannot be empty'}, { status: 400 });
        }
        
        // If website is provided as an empty string, convert it to null for the database
        if (updateData.website === '') {
            updateData.website = null;
        }

        // 3. Update the Recycling Center
        const updatedCenter = await prisma.recyclingCenter.update({
            where: { id: centerId },
            data: updateData, 
        });

        console.log(`Admin ${session.user.email} updated recycling center ${updatedCenter.id}`);

        // 4. Return Success Response
        return NextResponse.json({ success: true, data: updatedCenter });

    } catch (error: any) {
        console.error(`[PATCH Admin Recycling Center Error - ID: ${centerId}]`, error);
        if (error.code === 'P2025') { // Prisma: Record to update not found
             return NextResponse.json({ error: 'Recycling Center not found' }, { status: 404 });
        }
        // Handle other potential errors (e.g., unique constraint if slug were updatable)
        return NextResponse.json(
            { success: false, error: 'Failed to update recycling center', details: error.message },
            { status: 500 }
        );
    }
}

// GET handler to retrieve a single recycling center by ID (Admin Only)
export async function GET(
    request: NextRequest, // Keep request even if unused
    { params }: { params: { centerId: string } }
) {
    // 1. Check Authentication & Authorization
    const session = await getServerSession(authOptions);
    const userIsAdmin = session?.user ? (session.user as { isAdmin?: boolean }).isAdmin === true : false;

    if (!session?.user?.id || !userIsAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const centerId = params.centerId;
    if (!centerId) {
        return NextResponse.json({ error: 'Recycling Center ID is required' }, { status: 400 });
    }

    try {
        // 2. Fetch the Recycling Center
        const center = await prisma.recyclingCenter.findUnique({
            where: { id: centerId },
            // Use select instead of include to explicitly define fields
            select: {
                id: true,
                name: true,
                description: true,
                address_street: true,
                address_details: true,
                city: true,
                postal_code: true,
                country: true,
                latitude: true,
                longitude: true,
                phone_number: true,
                email: true,
                website: true,
                slug: true,
                created_at: true,
                updated_at: true,
                verification_status: true,
                managedById: true, // Include the foreign key if needed
                // Select details from the related managedBy (User) relation
                managedBy: {
                    select: { 
                        id: true, 
                        name: true, 
                        email: true 
                    }
                }
                // Add other relations like offers if needed here
                // offers: { select: { ... } }
            }
        });

        // 3. Handle Not Found
        if (!center) {
            return NextResponse.json({ error: 'Recycling Center not found' }, { status: 404 });
        }

        // 4. Return Success Response
        return NextResponse.json({ success: true, data: center });

    } catch (error: any) {
        console.error(`[GET Admin Recycling Center Error - ID: ${centerId}]`, error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch recycling center', details: error.message },
            { status: 500 }
        );
    }
} 