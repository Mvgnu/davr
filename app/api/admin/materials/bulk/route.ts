import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Zod schema for validating bulk operations
const bulkOperationSchema = z.object({
    operation: z.enum(['delete', 'update']),
    materialIds: z.array(z.string()),
    updateData: z.record(z.unknown()).optional(), // For future update operations
});

// POST handler for bulk operations on materials
export async function POST(request: NextRequest) {
    // 1. Check Authentication & Authorization
    const session = await getServerSession(authOptions);
    const userIsAdmin = session?.user ? (session.user as { isAdmin?: boolean }).isAdmin === true : false;

    if (!session?.user?.id || !userIsAdmin) {
        console.log("Admin API access denied for bulk operations", { 
            userId: session?.user?.id, 
            isAdmin: userIsAdmin 
        });
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const validation = bulkOperationSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: 'Invalid input data', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { operation, materialIds } = validation.data;

        if (operation === 'delete') {
            // Check for dependencies before deletion
            const materialsWithDependencies = await prisma.material.findMany({
                where: {
                    id: { in: materialIds },
                    OR: [
                        { listings: { some: {} } },
                        { offers: { some: {} } },
                        { children: { some: {} } }
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    _count: {
                        select: {
                            listings: true,
                            offers: true,
                            children: true,
                        }
                    }
                }
            });

            if (materialsWithDependencies.length > 0) {
                const errorDetails = materialsWithDependencies.map(mat => ({
                    id: mat.id,
                    name: mat.name,
                    dependencies: {
                        listings: mat._count.listings,
                        offers: mat._count.offers,
                        children: mat._count.children
                    }
                }));
                
                return NextResponse.json({
                    success: false, 
                    error: `Cannot delete materials with dependencies`,
                    details: errorDetails
                }, { status: 409 });
            }

            // Perform the deletion
            await prisma.material.deleteMany({
                where: {
                    id: { in: materialIds }
                }
            });

            return NextResponse.json({ 
                success: true, 
                message: `Successfully deleted ${materialIds.length} materials` 
            });
        }

        return NextResponse.json({ 
            success: false, 
            error: 'Unsupported operation' 
        }, { status: 400 });

    } catch (error: any) {
        console.error('[POST Bulk Materials Operation Error]', error);
        return NextResponse.json(
            { success: false, error: 'Failed to perform bulk operation', details: error.message },
            { status: 500 }
        );
    }
}