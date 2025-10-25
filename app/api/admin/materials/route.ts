import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { slugify } from '@/lib/utils';

const DEFAULT_PAGE_SIZE = 10;

// Zod schema for validating POST request body
const createMaterialSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    recyclability_percentage: z.number().min(0).max(100).nullable().optional(),
    recycling_difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).nullable().optional(),
    category_icon: z.string().max(50).optional(),
    environmental_impact: z.record(z.unknown()).nullable().optional(),
    preparation_tips: z.array(z.record(z.string())).nullable().optional(),
    acceptance_rate: z.number().min(0).max(100).nullable().optional(),
    average_price_per_unit: z.number().nullable().optional(),
    price_unit: z.string().max(20).optional(),
    fun_fact: z.string().max(200).optional(),
    annual_recycling_volume: z.number().nullable().optional(),
    parent_id: z.string().cuid().optional(),
});

// GET handler to retrieve all materials (Admin Only, Paginated)
export async function GET(request: NextRequest) {
    // 1. Check Authentication & Authorization
    const session = await getServerSession(authOptions);
    const userIsAdmin = session?.user ? (session.user as { isAdmin?: boolean }).isAdmin === true : false;

    if (!session?.user?.id || !userIsAdmin) {
        console.log("Admin API access denied for getting materials", { userId: session?.user?.id, isAdmin: userIsAdmin });
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        // 2. Parse Query Parameters for Pagination
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || `${DEFAULT_PAGE_SIZE}`, 10);
        const skip = (page - 1) * limit;

        // 3. Fetch Materials and Total Count
        const [materials, totalCount] = await prisma.$transaction([
            prisma.material.findMany({
                orderBy: { name: 'asc' },
                skip: skip,
                take: limit,
                include: {
                    parent: true,
                    _count: {
                        select: {
                            listings: true,
                            offers: true,
                            children: true,
                        }
                    },
                }
            }),
            prisma.material.count()
        ]);

        // Format response to include counts with clear names and all enhanced fields
        const formattedMaterials = materials.map(m => ({
            id: m.id,
            name: m.name,
            description: m.description,
            slug: m.slug,
            parentMaterial: m.parent,
            recyclability_percentage: m.recyclability_percentage,
            recycling_difficulty: m.recycling_difficulty,
            category_icon: m.category_icon,
            environmental_impact: m.environmental_impact,
            preparation_tips: m.preparation_tips,
            acceptance_rate: m.acceptance_rate,
            average_price_per_unit: m.average_price_per_unit,
            price_unit: m.price_unit,
            fun_fact: m.fun_fact,
            annual_recycling_volume: m.annual_recycling_volume,
            image_url: m.image_url,
            created_at: m.created_at,
            updated_at: m.updated_at,
            listingCount: m._count?.listings ?? 0,
            offerCount: m._count?.offers ?? 0,
            subMaterialCount: m._count?.children ?? 0,
        }));

        const finalMaterials = formattedMaterials;

        const totalPages = Math.ceil(totalCount / limit);

        // 4. Return Success Response
        return NextResponse.json({
            success: true,
            data: finalMaterials,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                pageSize: limit,
                totalItems: totalCount,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (error: any) {
        console.error('[GET Admin Materials Error]', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch materials', details: error.message },
            { status: 500 }
        );
    }
}

// POST handler to create a new material (Admin Only)
export async function POST(request: NextRequest) {
    // 1. Check Authentication & Authorization
    const session = await getServerSession(authOptions);
    const userIsAdmin = session?.user ? (session.user as { isAdmin?: boolean }).isAdmin === true : false;

    if (!session?.user?.id || !userIsAdmin) {
        console.log("Admin API access denied for creating material", { userId: session?.user?.id, isAdmin: userIsAdmin });
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        // Validate request body
        const body = await request.json();
        // Basic validation (can enhance with Zod if needed)
        const { name, description, slug, parentMaterialId /*, category*/ } = body; // Destructure, ensure category is not used
        if (!name) {
            return NextResponse.json({ error: 'Material name is required' }, { status: 400 });
        }

        // Check for existing material with the same name
        const existingMaterial = await prisma.material.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } }
        });
        if (existingMaterial) {
            return NextResponse.json({ error: `Material with name "${name}" already exists.` }, { status: 409 });
        }

        // 4. Create the Material using Prisma
        const newMaterial = await prisma.material.create({
            data: {
                name: name,
                description: description,
                slug: slug || slugify(name), // Generate slug if not provided
                parent: parentMaterialId
                    ? { connect: { id: parentMaterialId } }
                    : undefined,
                // Category field removed
            },
        });

        console.log(`Admin ${session.user.email} created material ${newMaterial.id} (${newMaterial.name})`);

        // 5. Return Success Response
        return NextResponse.json({ success: true, data: newMaterial }, { status: 201 });

    } catch (error: any) {
        console.error('[POST Admin Material Error]', error);
        // Handle potential Prisma unique constraint errors explicitly if needed
        return NextResponse.json(
            { success: false, error: 'Failed to create material', details: error.message },
            { status: 500 }
        );
    }
} 