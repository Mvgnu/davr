import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const DEFAULT_PAGE_SIZE = 10;

// GET handler to fetch all recycling centers (Admin Only)
export async function GET(request: Request) {
  try {
    await requireRole('ADMIN');

    // Handle Pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || `${DEFAULT_PAGE_SIZE}`, 10);
    const skip = (page - 1) * limit;

    // Fetch recycling centers from the database with relations and pagination
    const [centers, totalCenters] = await prisma.$transaction([
      prisma.recyclingCenter.findMany({
        skip: skip,
        take: limit,
        orderBy: {
          name: 'asc',
        },
        include: {
          managedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.recyclingCenter.count(), // Get the total count for pagination
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCenters / limit);

    // Return the paginated list
    return NextResponse.json({
      success: true,
      data: {
        centers,
        pagination: {
          currentPage: page,
          totalPages,
          pageSize: limit,
          totalItems: totalCenters,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('[GET Dashboard Admin Centers Error]', error);

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
      { error: 'Failed to fetch recycling centers' },
      { status: 500 }
    );
  }
}

// POST handler to create a new recycling center (Admin Only)
export async function POST(request: Request) {
  try {
    await requireRole('ADMIN');

    const body = await request.json();
    
    // Validate the input
    const centerSchema = z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
      email: z.string().email("Invalid email").optional(),
      phone: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      verification_status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
    });
    
    const validationResult = centerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { name, description, address, city, postal_code, country, email, phone, latitude, longitude, verification_status } = validationResult.data;
    
    const newCenter = await prisma.recyclingCenter.create({
      data: {
        name,
        description: description || null,
        address_street: address || null,
        city: city || null,
        postal_code: postal_code || null,
        country: country || "Germany",
        email: email || null,
        phone_number: phone || null,
        latitude: latitude || null,
        longitude: longitude || null,
        verification_status: verification_status || 'PENDING',
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: newCenter 
    });
  } catch (error) {
    console.error('[POST Dashboard Admin Centers Error]', error);

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
      { error: 'Failed to create recycling center' },
      { status: 500 }
    );
  }
}

// PUT handler to update a recycling center (Admin Only)
export async function PUT(request: Request) {
  try {
    await requireRole('ADMIN');

    const body = await request.json();
    
    // Validate the input
    const centerSchema = z.object({
      id: z.string().cuid(),
      name: z.string().min(1, "Name is required").optional(),
      description: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
      email: z.string().email("Invalid email").optional(),
      phone: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      verification_status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
    });
    
    const validationResult = centerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { id, ...updateData } = validationResult.data;
    
    // Update the recycling center
    const updatedCenter = await prisma.recyclingCenter.update({
      where: { id },
      data: {
        ...(updateData.name !== undefined && { name: updateData.name }),
        ...(updateData.description !== undefined && { description: updateData.description || null }),
        ...(updateData.address !== undefined && { address_street: updateData.address || null }),
        ...(updateData.city !== undefined && { city: updateData.city || null }),
        ...(updateData.postal_code !== undefined && { postal_code: updateData.postal_code || null }),
        ...(updateData.country !== undefined && { country: updateData.country || "Germany" }),
        ...(updateData.email !== undefined && { email: updateData.email || null }),
        ...(updateData.phone !== undefined && { phone_number: updateData.phone || null }),
        ...(updateData.latitude !== undefined && { latitude: updateData.latitude || null }),
        ...(updateData.longitude !== undefined && { longitude: updateData.longitude || null }),
        ...(updateData.verification_status !== undefined && { verification_status: updateData.verification_status }),
        updated_at: new Date(),
      },
      include: {
        managedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedCenter 
    });
  } catch (error) {
    console.error('[PUT Dashboard Admin Centers Error]', error);

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
      
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { error: 'Recycling center not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update recycling center' },
      { status: 500 }
    );
  }
}

// DELETE handler to delete a recycling center (Admin Only)
export async function DELETE(request: Request) {
  try {
    await requireRole('ADMIN');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Center ID is required' },
        { status: 400 }
      );
    }

    // Check if center exists
    const existingCenter = await prisma.recyclingCenter.findUnique({
      where: { id },
    });

    if (!existingCenter) {
      return NextResponse.json(
        { error: 'Recycling center not found' },
        { status: 404 }
      );
    }

    // Delete the recycling center
    await prisma.recyclingCenter.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Recycling center deleted successfully' 
    });
  } catch (error) {
    console.error('[DELETE Dashboard Admin Centers Error]', error);

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
      
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json(
          { error: 'Recycling center not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete recycling center' },
      { status: 500 }
    );
  }
}