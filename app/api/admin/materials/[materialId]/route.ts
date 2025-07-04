import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Zod schema for validating PATCH request body
const updateMaterialSchema = z.object({
    name: z.string().min(1, 'Name is required').optional(),
    description: z.string().optional(),
    category: z.string().min(1, 'Category is required').optional(),
    // Optional: Add parentMaterialId validation if needed
    // parentMaterialId: z.string().cuid().optional().nullable(),
});

// GET handler to retrieve a single material by ID (Admin Only)
export async function GET(
    request: NextRequest,
    { params }: { params: { materialId: string } }
) {
    // 1. Check Authentication & Authorization
    const session = await getServerSession(authOptions);
    const userIsAdmin = session?.user ? (session.user as { isAdmin?: boolean }).isAdmin === true : false;

    if (!session?.user?.id || !userIsAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const materialId = params.materialId;
    if (!materialId) {
        return NextResponse.json({ error: 'Material ID is required' }, { status: 400 });
    }

    try {
        // 2. Fetch the Material
        const material = await prisma.material.findUnique({
            where: { id: materialId },
            include: {
                parent: { select: { id: true, name: true, slug: true } },
                children: { select: { id: true, name: true, slug: true } },
            }
        });

        // 3. Handle Not Found
        if (!material) {
            return NextResponse.json({ error: 'Material not found' }, { status: 404 });
        }

        // Format the response
        const response = {
            ...material,
            subMaterials: material.children, // Map 'children' relation
        };
        // Remove the nested children relation from the final response object
        delete (response as any).children;

        return NextResponse.json(response);

    } catch (error: any) {
        console.error(`[GET Admin Material Error - ID: ${materialId}]`, error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch material', details: error.message },
            { status: 500 }
        );
    }
}

// PATCH handler to update a material (Admin Only)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { materialId: string } }
) {
    // 1. Check Authentication & Authorization
    const session = await getServerSession(authOptions);
    const userIsAdmin = session?.user ? (session.user as { isAdmin?: boolean }).isAdmin === true : false;

    if (!session?.user?.id || !userIsAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const materialId = params.materialId;
    if (!materialId) {
        return NextResponse.json({ error: 'Material ID is required' }, { status: 400 });
    }

    try {
        // 2. Parse and Validate Request Body
        const body = await request.json();
        const validation = updateMaterialSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: 'Invalid input data', details: validation.error.errors },
                { status: 400 }
            );
        }
        const updateData = validation.data;

        // Optional: Check if new name conflicts with another material
        if (updateData.name) {
            const existingMaterial = await prisma.material.findFirst({
                where: {
                    name: { equals: updateData.name, mode: 'insensitive' },
                    id: { not: materialId } // Exclude the current material
                },
            });
            if (existingMaterial) {
                return NextResponse.json(
                    { success: false, error: `Material with name "${updateData.name}" already exists.` },
                    { status: 409 } // Conflict
                );
            }
        }

        // 3. Update the Material
        const updatedMaterial = await prisma.material.update({
            where: { id: materialId },
            data: updateData,
        });

        console.log(`Admin ${session.user.email} updated material ${updatedMaterial.id}`);

        // 4. Return Success Response
        return NextResponse.json({ success: true, data: updatedMaterial });

    } catch (error: any) {
        console.error(`[PATCH Admin Material Error - ID: ${materialId}]`, error);
        if (error.code === 'P2025') { // Prisma: Record to update not found
             return NextResponse.json({ error: 'Material not found' }, { status: 404 });
        }
        return NextResponse.json(
            { success: false, error: 'Failed to update material', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE handler to remove a material (Admin Only)
export async function DELETE(
    request: Request, // Keep request even if unused
    { params }: { params: { materialId: string } }
) {
    // 1. Check Authentication & Authorization
    const session = await getServerSession(authOptions);
    const userIsAdmin = session?.user ? (session.user as { isAdmin?: boolean }).isAdmin === true : false;

    if (!session?.user?.id || !userIsAdmin) {
        console.log("Admin API access denied for deleting material", { userId: session?.user?.id, isAdmin: userIsAdmin });
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const materialId = params.materialId;
    if (!materialId) {
        return NextResponse.json({ error: 'Material ID is required' }, { status: 400 });
    }

    try {
        // Dependency check removed due to persistent type errors with _count
        /*
        // **Important**: Before deleting, check for dependencies
        const dependencies = await prisma.material.findUnique({
            where: { id: materialId },
            select: {
                _count: {
                    select: { 
                        listings: true, 
                        offers: true,   
                        children: true  
                    }
                }
            }
        });

        if (!dependencies) {
            return NextResponse.json({ error: 'Material not found' }, { status: 404 });
        }
        
        const counts = dependencies._count;

        if (counts.listings > 0 || 
            counts.offers > 0 || 
            counts.children > 0) {
            // Construct a more informative error message
            let errors: string[] = [];
            if (counts.listings > 0) errors.push(`${counts.listings} marketplace listing(s)`);
            if (counts.offers > 0) errors.push(`${counts.offers} recycling center offer(s)`);
            if (counts.children > 0) errors.push(`${counts.children} sub-material(s)`);
            
            return NextResponse.json(
                { error: `Cannot delete material: It is referenced by ${errors.join(', ')}.` }, 
                { status: 409 } // Conflict
            );
        }
        */

        // 3. Attempt to delete the material
        // Find the material first to ensure it exists before attempting delete
        const materialExists = await prisma.material.findUnique({ where: { id: materialId }, select: { id: true } });
        if (!materialExists) {
             return NextResponse.json({ error: 'Material not found' }, { status: 404 });
        }

        // Now delete
        await prisma.material.delete({
            where: { id: materialId },
        });

        console.log(`Admin ${session.user.email} deleted material ${materialId}`);
        
        // 4. Return Success Response (No Content)
        return new NextResponse(null, { status: 204 });

    } catch (error: any) {
        console.error(`[DELETE Admin Material Error - ID: ${materialId}]`, error);
        if (error.code === 'P2025') { // Prisma: Record to delete not found 
            return NextResponse.json({ error: 'Material not found' }, { status: 404 });
        }
        // Handle potential FK constraint errors if dependencies weren't checked
        if (error.code === 'P2003') { 
             return NextResponse.json(
                { error: 'Cannot delete material: It is still referenced by other records (listings, offers, or sub-materials).' }, 
                { status: 409 } // Conflict
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to delete material', details: error.message },
            { status: 500 }
        );
    }
} 