import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { z } from 'zod';
import { ListingType, ListingStatus } from '@prisma/client';
import { unlink } from 'fs/promises';
import path from 'path';

// --- GET Handler: Fetch a single listing by ID ---
export async function GET(
    request: NextRequest, 
    { params }: { params: { listingId: string } }
) {
    const listingId = params.listingId;

    if (!listingId || !z.string().cuid().safeParse(listingId).success) {
        return NextResponse.json({ error: 'Invalid Listing ID format' }, { status: 400 });
    }

    try {
        const listing = await prisma.marketplaceListing.findUnique({
            where: { id: listingId },
            include: {
                material: { select: { id: true, name: true, slug: true } }, // Include more material details if needed
                seller: { select: { id: true, name: true, email: true } } // Include seller email for potential contact later
            }
        });

        if (!listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        // Optionally: Check if listing status is ACTIVE if non-sellers shouldn't see inactive ones
        // const session = await getServerSession(authOptions);
        // if (listing.status !== 'ACTIVE' && listing.seller_id !== session?.user?.id && !session?.user?.isAdmin) {
        //     return NextResponse.json({ error: 'Listing not found or access denied' }, { status: 404 });
        // }

        return NextResponse.json(listing);

    } catch (error) {
        console.error('[GET Listing by ID Error]', error);
        return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
    }
}

// --- PATCH Handler: Update a listing ---

// Zod schema for validation (allow partial updates)
const listingUpdateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long').max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
  quantity: z.number().positive().optional().nullable(),
  unit: z.string().max(20).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  material_id: z.string().cuid().optional().nullable(),
  type: z.nativeEnum(ListingType).optional(),
  status: z.nativeEnum(ListingStatus).optional(), // Allow status updates, e.g., marking as SOLD/INACTIVE
  imageUrl: z.string().url().optional().nullable(), // URL can be updated or removed
});

// Helper function to safely delete an image file
async function safeDeleteImage(imageUrl: string | null | undefined) {
    if (!imageUrl) return; // No image to delete

    try {
        const filename = path.basename(imageUrl); // Extract filename from URL path
        const uploadDir = path.join(process.cwd(), 'public/uploads/listings');
        const filePath = path.join(uploadDir, filename);

        // **Security Check:** Ensure the resolved path is within the intended directory
        const resolvedUploadDir = path.resolve(uploadDir);
        const resolvedFilePath = path.resolve(filePath);
        if (!resolvedFilePath.startsWith(resolvedUploadDir + path.sep)) {
             console.warn(`Attempted to delete file outside designated directory: ${filePath}`);
             return; // Prevent deleting outside the directory
        }

        await unlink(resolvedFilePath);
        console.log(`Successfully deleted old image: ${filePath}`);
    } catch (error: any) {
        // Ignore ENOENT (File not found) errors, log others
        if (error.code !== 'ENOENT') {
            console.error(`Error deleting image file ${imageUrl}:`, error);
        }
    }
}

export async function PATCH(
    request: NextRequest, 
    { params }: { params: { listingId: string } }
) {
    const session = await getServerSession(authOptions);
    const listingId = params.listingId;

    // 1. Authentication & Input Validation
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!listingId || !z.string().cuid().safeParse(listingId).success) {
        return NextResponse.json({ error: 'Invalid Listing ID format' }, { status: 400 });
    }

    try {
        // 2. Fetch Existing Listing for Authorization Check
        const existingListing = await prisma.marketplaceListing.findUnique({
            where: { id: listingId },
            select: { seller_id: true, image_url: true } // Fetch existing image URL
        });

        if (!existingListing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        // 3. Authorization Check
        const isOwner = existingListing.seller_id === session.user.id;
        const isAdmin = session.user.isAdmin; // Assuming isAdmin is available in session

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden: You do not have permission to edit this listing' }, { status: 403 });
        }

        // 4. Validate Request Body
        const rawData = await request.json();
        const validationResult = listingUpdateSchema.safeParse(rawData);
        if (!validationResult.success) {
            return NextResponse.json({ error: 'Invalid input data', details: validationResult.error.flatten() }, { status: 400 });
        }
        const dataToUpdate = validationResult.data;

         // Don't allow updating seller_id
        if ('seller_id' in dataToUpdate) {
            delete (dataToUpdate as any).seller_id;
        }

        // 5. Handle Image Deletion (if URL changed)
        const newImageUrl = dataToUpdate.imageUrl;
        const oldImageUrl = existingListing.image_url;

        if (oldImageUrl && oldImageUrl !== newImageUrl) {
            // If there was an old image and the new URL is different (or null)
            await safeDeleteImage(oldImageUrl);
        }

        // 6. Update Listing
        const updatedListing = await prisma.marketplaceListing.update({
            where: { id: listingId },
            data: dataToUpdate,
            // Optionally include relations if needed in the response
            // include: { material: true, seller: { select: { id: true, name: true } } }
        });

        return NextResponse.json(updatedListing);

    } catch (error) {
        console.error('[PATCH Listing Error]', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data format.', details: error.errors }, { status: 400 });
        }
        // Handle specific Prisma errors if needed (e.g., P2025 record not found)
        return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
    }
}

// --- DELETE Handler: Delete a listing ---

export async function DELETE(
    request: NextRequest,
    { params }: { params: { listingId: string } }
) {
    const session = await getServerSession(authOptions);
    const listingId = params.listingId;

    // 1. Authentication & Input Validation
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!listingId || !z.string().cuid().safeParse(listingId).success) {
        return NextResponse.json({ error: 'Invalid Listing ID format' }, { status: 400 });
    }

    try {
        // 2. Fetch Existing Listing for Authorization Check & Image URL
        const existingListing = await prisma.marketplaceListing.findUnique({
            where: { id: listingId },
            select: { seller_id: true, image_url: true } // Need seller_id and image_url
        });

        if (!existingListing) {
            // If not found, it might have been already deleted, which is okay for a DELETE request
            // Return 200 OK or 204 No Content to indicate success/idempotency
            return NextResponse.json({ message: 'Listing already deleted or not found' }, { status: 200 }); 
        }

        // 3. Authorization Check
        const isOwner = existingListing.seller_id === session.user.id;
        const isAdmin = session.user.isAdmin; 

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden: You do not have permission to delete this listing' }, { status: 403 });
        }

        // 4. Delete Associated Image File (if exists)
        await safeDeleteImage(existingListing.image_url);

        // 5. Delete Listing from DB
        await prisma.marketplaceListing.delete({
            where: { id: listingId },
        });

        console.log(`Listing ${listingId} deleted successfully by user ${session.user.id}`);
        // Return 200 OK with a success message or 204 No Content
        return NextResponse.json({ message: 'Listing deleted successfully' }, { status: 200 });

    } catch (error) {
        console.error('[DELETE Listing Error]', error);
        // Handle specific Prisma errors if needed (e.g., P2025 record not found - already handled above)
        return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
    }
}

// Potential DELETE handler (add later)
// export async function DELETE(...) { ... } 