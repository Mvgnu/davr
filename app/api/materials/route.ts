import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET handler for fetching materials with optional filtering and enhanced fields
 * Query params:
 * - search: string - Search in name and description
 * - category_icon: string - Filter by category icon
 * - min_recyclability: number - Min recyclability percentage
 * - difficulty: EASY|MEDIUM|HARD - Filter by recycling difficulty
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const categoryIcon = searchParams.get('category_icon');
    const minRecyclability = searchParams.get('min_recyclability');
    const difficulty = searchParams.get('difficulty');

    console.log('[GET Materials] Starting materials fetch with filters:', {
      search, categoryIcon, minRecyclability, difficulty
    });

    // Build where clause
    const where: Prisma.MaterialWhereInput = {};
    const andConditions: Prisma.MaterialWhereInput[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (categoryIcon) {
      andConditions.push({ category_icon: categoryIcon });
    }

    if (minRecyclability) {
      const minValue = parseInt(minRecyclability, 10);
      if (!isNaN(minValue)) {
        andConditions.push({ recyclability_percentage: { gte: minValue } });
      }
    }

    if (difficulty && ['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
      andConditions.push({ recycling_difficulty: difficulty as any });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const materials = await prisma.material.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image_url: true,
        // NEW ENHANCED FIELDS
        recyclability_percentage: true,
        recycling_difficulty: true,
        category_icon: true,
        environmental_impact: true,
        preparation_tips: true,
        acceptance_rate: true,
        average_price_per_unit: true,
        price_unit: true,
        fun_fact: true,
        annual_recycling_volume: true,
        // Relations for counts
        _count: {
          select: {
            offers: true,
            listings: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log('[GET Materials] Found materials count:', materials.length);

    return NextResponse.json(materials);
  } catch (error) {
    console.error('[GET Materials Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST handler to create a new material (admin only)
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name is required' },
        { status: 400 }
      );
    }
    
    // Create material using Prisma
    const newMaterial = await prisma.material.create({
      data: {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        description: data.description || null,
      },
    });
    
    return NextResponse.json({
      success: true,
      material: newMaterial
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating material:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create material' },
      { status: 500 }
    );
  }
}