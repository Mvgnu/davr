import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { z } from "zod";

/**
 * GET handler to fetch recycling center offers
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const centerId = searchParams.get('centerId');
    const materialId = searchParams.get('materialId');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // Build query
    let whereClause = '';
    const queryParams: any[] = [];
    let paramCount = 1;
    
    if (centerId) {
      whereClause = `WHERE o.recycling_center_id = $${paramCount++}`;
      queryParams.push(centerId);
    }
    
    if (materialId) {
      whereClause = whereClause 
        ? `${whereClause} AND o.material_id = $${paramCount++}`
        : `WHERE o.material_id = $${paramCount++}`;
      queryParams.push(materialId);
    }
    
    // Only show active offers by default
    whereClause = whereClause
      ? `${whereClause} AND o.is_active = true`
      : `WHERE o.is_active = true`;
    
    const offersQuery = `
      SELECT 
        o.id, o.recycling_center_id, o.material_id, o.price, 
        o.min_quantity, o.notes, o.is_active, o.created_at, o.updated_at,
        m.name as material_name, m.category as material_category, 
        m.recyclable, m.image_url,
        c.name as center_name, c.slug as center_slug, c.city, c.postal_code
      FROM recycling_center_offers o
      JOIN materials m ON o.material_id = m.id
      JOIN recycling_centers c ON o.recycling_center_id = c.id
      ${whereClause}
      ORDER BY o.price DESC
      LIMIT $${paramCount}
    `;
    
    queryParams.push(limit);
    const offersResult = await query(offersQuery, queryParams);
    
    // Format offers
    const offers = offersResult.rows.map(offer => ({
      id: offer.id,
      centerId: offer.recycling_center_id,
      centerName: offer.center_name,
      centerSlug: offer.center_slug,
      centerLocation: {
        city: offer.city,
        postalCode: offer.postal_code
      },
      materialId: offer.material_id,
      materialName: offer.material_name,
      materialCategory: offer.material_category,
      price: parseFloat(offer.price),
      minQuantity: offer.min_quantity || 0,
      notes: offer.notes || '',
      recyclable: offer.recyclable,
      imageUrl: offer.image_url,
      active: offer.is_active,
      createdAt: offer.created_at,
      updatedAt: offer.updated_at
    }));
    
    return NextResponse.json({ offers });
  } catch (error) {
    console.error('Error fetching recycling center offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recycling center offers' },
      { status: 500 }
    );
  }
}

/**
 * POST handler to create a recycling center offer
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.centerId || !data.materialId || data.price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: centerId, materialId, and price are required' },
        { status: 400 }
      );
    }
    
    // Check if user is admin or center owner
    const centerQuery = `
      SELECT c.owner_id, u.email, u.role
      FROM recycling_centers c
      JOIN users u ON c.owner_id = u.id
      WHERE c.id = $1
    `;
    
    const centerResult = await query(centerQuery, [data.centerId]);
    
    if (centerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Recycling center not found' }, { status: 404 });
    }
    
    const center = centerResult.rows[0];
    
    // Get current user
    const userQuery = 'SELECT id, role FROM users WHERE email = $1';
    const userResult = await query(userQuery, [session.user.email]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = userResult.rows[0];
    const isAdmin = user.role === 'admin';
    const isOwner = center.owner_id === user.id;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins and center owners can add offers' },
        { status: 403 }
      );
    }
    
    // Check if material exists
    const materialQuery = 'SELECT id FROM materials WHERE id = $1';
    const materialResult = await query(materialQuery, [data.materialId]);
    
    if (materialResult.rows.length === 0) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    
    // Check if offer already exists
    const existingOfferQuery = `
      SELECT id FROM recycling_center_offers 
      WHERE recycling_center_id = $1 AND material_id = $2
    `;
    
    const existingOfferResult = await query(existingOfferQuery, [data.centerId, data.materialId]);
    
    if (existingOfferResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'An offer for this material already exists for this recycling center' },
        { status: 409 }
      );
    }
    
    // Create new offer
    const insertQuery = `
      INSERT INTO recycling_center_offers (
        recycling_center_id, material_id, price, min_quantity, notes, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    
    const insertParams = [
      data.centerId,
      data.materialId,
      data.price,
      data.minQuantity || 0,
      data.notes || '',
      data.active !== undefined ? data.active : true
    ];
    
    const result = await query(insertQuery, insertParams);
    const offerId = result.rows[0].id;
    
    return NextResponse.json(
      {
        success: true,
        offer: {
          id: offerId,
          centerId: data.centerId,
          materialId: data.materialId,
          price: data.price,
          minQuantity: data.minQuantity || 0,
          notes: data.notes || '',
          active: data.active !== undefined ? data.active : true
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating recycling center offer:', error);
    return NextResponse.json(
      { error: 'Failed to create recycling center offer' },
      { status: 500 }
    );
  }
} 