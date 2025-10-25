import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';

// GET handler to retrieve material hierarchy (Admin Only)
export async function GET(request: NextRequest) {
    // 1. Check Authentication & Authorization
    const session = await getServerSession(authOptions);
    const userIsAdmin = session?.user ? (session.user as { isAdmin?: boolean }).isAdmin === true : false;

    if (!session?.user?.id || !userIsAdmin) {
        console.log("Admin API access denied for getting material hierarchy", { 
            userId: session?.user?.id, 
            isAdmin: userIsAdmin 
        });
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        // Fetch all materials with their parent relationships
        const materials = await prisma.material.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: {
                        listings: true,
                        offers: true,
                        children: true,
                    }
                },
            }
        });

        // Build the hierarchy tree
        const materialMap = new Map(materials.map(material => [material.id, { ...material, children: [] as any[] }]));
        const rootMaterials: any[] = [];

        materials.forEach(material => {
            const materialWithChildren = materialMap.get(material.id);
            
            if (material.parent_id) {
                // This is a child material, add it to its parent
                const parent = materialMap.get(material.parent_id);
                if (parent) {
                    parent.children.push(materialWithChildren);
                }
            } else {
                // This is a root material
                rootMaterials.push(materialWithChildren);
            }
        });

        return NextResponse.json({ 
            success: true, 
            hierarchy: rootMaterials 
        });

    } catch (error: any) {
        console.error('[GET Material Hierarchy Error]', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch material hierarchy', details: error.message },
            { status: 500 }
        );
    }
}