import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';

/**
 * GET handler for a single recycling center offer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const offerQuery = `
      SELECT 
        o.id, o.recycling_center_id, o.material_id, o.price, 
        o.min_quantity, o.notes, o.is_active, o.created_at, o.updated_at,
        m.name as material_name, m.category as material_category, 
        m.recyclable, m.image_url,
        c.name as center_name, c.slug as center_slug, c.city, c.postal_code
      FROM recycling_center_offers o
      JOIN materials m ON o.material_id = m.id
      JOIN recycling_centers c ON o.recycling_center_id = c.id
      WHERE o.id = $1
    `;
    
    const offerResult = await query(offerQuery, [id]);
    
    if (offerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }
    
    const offer = offerResult.rows[0];
    
    // Format the response
    return NextResponse.json({
      offer: {
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
      }
    });
  } catch (error) {
    console.error('Error fetching recycling center offer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recycling center offer' },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler to update a recycling center offer
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    const data = await request.json();
    
    // Get the offer to check permissions
    const offerQuery = `
      SELECT 
        o.recycling_center_id, 
        c.owner_id,
        u.role as user_role, 
        u.id as user_id
      FROM recycling_center_offers o
      JOIN recycling_centers c ON o.recycling_center_id = c.id
      JOIN users u ON u.email = $1
      WHERE o.id = $2
    `;
    
    const offerResult = await query(offerQuery, [session.user.email, id]);
    
    if (offerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Offer not found or user not found' }, { status: 404 });
    }
    
    const offer = offerResult.rows[0];
    
    // Check if user is admin or the owner of the recycling center
    const isAdmin = offer.user_role === 'admin';
    const isOwner = offer.owner_id === offer.user_id;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins and center owners can update offers' },
        { status: 403 }
      );
    }
    
    // Build update query
    let setClause = [];
    const queryParams: any[] = [];
    let paramCount = 1;
    
    if (data.price !== undefined) {
      setClause.push(`price = $${paramCount++}`);
      queryParams.push(data.price);
    }
    
    if (data.minQuantity !== undefined) {
      setClause.push(`min_quantity = $${paramCount++}`);
      queryParams.push(data.minQuantity);
    }
    
    if (data.notes !== undefined) {
      setClause.push(`notes = $${paramCount++}`);
      queryParams.push(data.notes);
    }
    
    if (data.active !== undefined) {
      setClause.push(`is_active = $${paramCount++}`);
      queryParams.push(data.active);
    }
    
    // Always update the updated_at timestamp
    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // If nothing to update
    if (setClause.length === 0) {
      return NextResponse.json({ message: 'No changes provided' });
    }
    
    // Add ID to params
    queryParams.push(id);
    
    // Execute update
    const updateQuery = `
      UPDATE recycling_center_offers
      SET ${setClause.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, recycling_center_id, material_id, price, min_quantity, notes, is_active
    `;
    
    const result = await query(updateQuery, queryParams);
    
    return NextResponse.json({
      success: true,
      offer: {
        id: result.rows[0].id,
        centerId: result.rows[0].recycling_center_id,
        materialId: result.rows[0].material_id,
        price: parseFloat(result.rows[0].price),
        minQuantity: result.rows[0].min_quantity || 0,
        notes: result.rows[0].notes || '',
        active: result.rows[0].is_active
      }
    });
  } catch (error) {
    console.error('Error updating recycling center offer:', error);
    return NextResponse.json(
      { error: 'Failed to update recycling center offer' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for a recycling center offer
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    // Get the offer to check permissions
    const offerQuery = `
      SELECT 
        o.recycling_center_id, 
        c.owner_id,
        u.role as user_role, 
        u.id as user_id
      FROM recycling_center_offers o
      JOIN recycling_centers c ON o.recycling_center_id = c.id
      JOIN users u ON u.email = $1
      WHERE o.id = $2
    `;
    
    const offerResult = await query(offerQuery, [session.user.email, id]);
    
    if (offerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Offer not found or user not found' }, { status: 404 });
    }
    
    const offer = offerResult.rows[0];
    
    // Check if user is admin or the owner of the recycling center
    const isAdmin = offer.user_role === 'admin';
    const isOwner = offer.owner_id === offer.user_id;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins and center owners can delete offers' },
        { status: 403 }
      );
    }
    
    // Delete the offer
    await query('DELETE FROM recycling_center_offers WHERE id = $1', [id]);
    
    return NextResponse.json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recycling center offer:', error);
    return NextResponse.json(
      { error: 'Failed to delete recycling center offer' },
      { status: 500 }
    );
  }
} 