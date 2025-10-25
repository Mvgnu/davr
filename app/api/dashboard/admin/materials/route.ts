import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';

const DEFAULT_PAGE_SIZE = 10;

// GET handler to fetch all materials (Admin Only)
export async function GET(request: Request) {
  try {
    await requireRole('ADMIN');

    // Handle Pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || `${DEFAULT_PAGE_SIZE}`, 10);
    const skip = (page - 1) * limit;

    // Fetch materials from the database with relations and pagination
    const [materials, totalMaterials] = await prisma.$transaction([
      prisma.material.findMany({
        skip: skip,
        take: limit,
        orderBy: {
          name: 'asc',
        },
        include: {
          parent: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.material.count(), // Get the total count for pagination
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalMaterials / limit);

    // Return the paginated list
    return NextResponse.json({
      success: true,
      data: {
        materials,
        pagination: {
          currentPage: page,
          totalPages,
          pageSize: limit,
          totalItems: totalMaterials,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('[GET Dashboard Admin Materials Error]', error);

    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

// POST handler to create a new material (Admin Only)
export async function POST(request: Request) {
  try {
    await requireRole('ADMIN');

    const body = await request.json();
    
    // Require slug from frontend
    if (!body.slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }
    
    // Sanitize the slug
    const sanitizedSlug = body.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Check if slug already exists
    const existingMaterial = await prisma.material.findUnique({
      where: { slug: sanitizedSlug },
    });
    
    if (existingMaterial) {
      return NextResponse.json(
        { error: 'Material with this slug already exists' },
        { status: 409 }
      );
    }
    
    const newMaterial = await prisma.material.create({
      data: {
        name: body.name,
        description: body.description,
        slug: sanitizedSlug,
        parent_id: body.parent_id,
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: newMaterial 
    });
  } catch (error) {
    console.error('[POST Dashboard Admin Materials Error]', error);

    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create material' },
      { status: 500 }
    );
  }
}