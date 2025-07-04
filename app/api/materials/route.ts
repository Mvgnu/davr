import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// Define the Material type
export interface Material {
  id: number;
  name: string;
  description: string | null;
  category: string;
  subtype: string | null;
  recyclable: boolean | null;
  market_value_level: string | null;
  approximate_min_price: number | null;
  approximate_max_price: number | null;
  image_url: string | null;
}

// Define database row type
interface MaterialRow {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  subtype: string | null;
  recyclable: boolean | null;
  market_value_level: string | null;
  approximate_min_price: string | null;
  approximate_max_price: string | null;
  image_url: string | null;
}

/**
 * GET handler for fetching materials with optional category filter
 */
export async function GET(request: Request) {
  try {
    const materialsData = await prisma.material.findMany({
      select: {
        id: true,
        name: true,
        slug: true, // Include slug if useful for filtering/linking later
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Define the expected shape of data returned by Prisma select
    type MaterialData = { id: number | string; name: string; slug: string | null }; 
    const materials = materialsData.map((m: MaterialData) => ({ ...m, id: String(m.id) }));

    return NextResponse.json(materials);
  } catch (error) {
    console.error('[GET Materials Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

// POST handler to create a new material (admin only)
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name and category are required' },
        { status: 400 }
      );
    }
    
    // Insert material into database
    const insertSql = `
      INSERT INTO materials (name, category, recyclable, description)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, category, recyclable, description
    `;
    
    const params = [
      data.name,
      data.category,
      data.recyclable !== undefined ? data.recyclable : true,
      data.description || null
    ];
    
    const result = await query(insertSql, params);
    const newMaterial = result.rows[0];
    
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