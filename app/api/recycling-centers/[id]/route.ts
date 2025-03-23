import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { RecyclingCenter } from '../route';

export interface RecyclingCenterMaterial {
  id: number;
  materialId: number;
  name: string;
  price: number;
  minQuantity: number;
  recyclable: boolean;
}

export type RecyclingCenterDetail = {
  id: number;
  name: string;
  slug: string;
  address: string;
  location: {
    city: string;
    zipCode: string;
    state: string;
    latitude?: number;
    longitude?: number;
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  description?: string;
  rating: {
    average: number;
    count: number;
  };
  offersCount: number;
  isVerified: boolean;
  ownerId?: number;
  materialOffers?: MaterialOffer[];
};

export type MaterialOffer = {
  id: number;
  materialId: number;
  materialName: string;
  category: string;
  price: number;
  minQuantity: number;
  notes?: string;
  active: boolean;
};

/**
 * GET handler to fetch a single recycling center by ID or slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const idOrSlug = params.id;
    
    if (!idOrSlug) {
      return NextResponse.json(
        { error: 'Invalid ID or slug format', success: false },
        { status: 400 }
      );
    }

    // Check if the ID is numeric or a slug
    const isNumeric = /^\d+$/.test(idOrSlug);
    
    // Construct the appropriate query based on ID or slug
    const centerQuery = `
      SELECT 
        rc.id, 
        rc.name, 
        rc.slug, 
        rc.address,
        rc.city, 
        rc.postal_code,
        rc.state,
        rc.latitude,
        rc.longitude,
        rc.phone, 
        rc.email, 
        rc.website, 
        rc.description,
        rc.rating,
        rc.rating_count,
        rc.is_verified,
        rc.owner_id,
        (SELECT COUNT(*) FROM recycling_center_offers WHERE recycling_center_id = rc.id) as offers_count
      FROM recycling_centers rc
      WHERE ${isNumeric ? 'rc.id = $1' : 'rc.slug = $1'}
    `;
    
    const centerResult = await query(centerQuery, [idOrSlug]);
    
    if (centerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Recycling center not found', success: false },
        { status: 404 }
      );
    }
    
    const center = centerResult.rows[0];
    
    // Get material offers for this center
    const offersQuery = `
      SELECT 
        rco.id,
        rco.material_id,
        m.name as material_name,
        m.category,
        rco.price,
        rco.min_quantity,
        rco.notes,
        rco.active
      FROM recycling_center_offers rco
      JOIN materials m ON rco.material_id = m.id
      WHERE rco.recycling_center_id = $1
      ORDER BY m.category, m.name
    `;
    
    const offersResult = await query(offersQuery, [center.id]);
    
    // Format response
    const formattedCenter: RecyclingCenterDetail = {
      id: center.id,
      name: center.name,
      slug: center.slug,
      address: center.address,
      location: {
        city: center.city,
        zipCode: center.postal_code,
        state: center.state,
        latitude: center.latitude ? parseFloat(center.latitude) : undefined,
        longitude: center.longitude ? parseFloat(center.longitude) : undefined
      },
      contact: {
        phone: center.phone || undefined,
        email: center.email || undefined,
        website: center.website || undefined
      },
      description: center.description,
      rating: {
        average: center.rating ? parseFloat(center.rating) : 0,
        count: center.rating_count || 0
      },
      offersCount: parseInt(center.offers_count) || 0,
      isVerified: center.is_verified,
      ownerId: center.owner_id,
      materialOffers: offersResult.rows.map(offer => ({
        id: offer.id,
        materialId: offer.material_id,
        materialName: offer.material_name,
        category: offer.category,
        price: parseFloat(offer.price),
        minQuantity: parseInt(offer.min_quantity),
        notes: offer.notes || undefined,
        active: offer.active
      }))
    };
    
    return NextResponse.json({ 
      center: formattedCenter,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching recycling center:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recycling center', success: false },
      { status: 500 }
    );
  }
}

/**
 * PUT handler to update a recycling center
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID format', success: false },
        { status: 400 }
      );
    }
    
    // Check if center exists
    const checkQuery = `SELECT id FROM recycling_centers WHERE id = $1`;
    const checkResult = await query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Recycling center not found', success: false },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.address || !data.city || !data.postalCode) {
      return NextResponse.json({
        error: 'Missing required fields: name, address, city, and postalCode are required',
        success: false
      }, { status: 400 });
    }
    
    // If name is changing, check if new slug would collide
    if (data.name !== checkResult.rows[0].name) {
      const newSlug = data.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      
      const slugCheckQuery = `
        SELECT id FROM recycling_centers WHERE slug = $1 AND id != $2
      `;
      
      const slugCheckResult = await query(slugCheckQuery, [newSlug, id]);
      
      if (slugCheckResult.rows.length > 0) {
        return NextResponse.json({
          error: 'A recycling center with this name already exists',
          success: false
        }, { status: 409 });
      }
    }
    
    // Update center
    const updateQuery = `
      UPDATE recycling_centers
      SET 
        name = $1,
        slug = $2,
        address = $3,
        city = $4,
        postal_code = $5,
        state = $6,
        latitude = $7,
        longitude = $8,
        phone = $9,
        email = $10,
        website = $11,
        description = $12
      WHERE id = $13
      RETURNING id, name, slug, address, city, postal_code, state, is_verified
    `;
    
    const slug = data.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    
    const updateParams = [
      data.name,
      slug,
      data.address,
      data.city,
      data.postalCode,
      data.state || null,
      data.latitude || null,
      data.longitude || null,
      data.phone || null,
      data.email || null,
      data.website || null,
      data.description || null,
      id
    ];
    
    const updateResult = await query(updateQuery, updateParams);
    const updatedCenter = updateResult.rows[0];
    
    return NextResponse.json({ 
      success: true, 
      center: {
        id: updatedCenter.id,
        name: updatedCenter.name,
        slug: updatedCenter.slug,
        address: updatedCenter.address,
        city: updatedCenter.city,
        postalCode: updatedCenter.postal_code,
        state: updatedCenter.state,
        isVerified: updatedCenter.is_verified
      }
    });
  } catch (error) {
    console.error('Error updating recycling center:', error);
    return NextResponse.json(
      { error: 'Failed to update recycling center', success: false },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler to remove a recycling center
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID format', success: false },
        { status: 400 }
      );
    }
    
    // Check if center exists
    const checkQuery = `SELECT id FROM recycling_centers WHERE id = $1`;
    const checkResult = await query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Recycling center not found', success: false },
        { status: 404 }
      );
    }
    
    // Delete related material offers first
    await query(`DELETE FROM recycling_center_offers WHERE recycling_center_id = $1`, [id]);
    
    // Delete the recycling center
    await query(`DELETE FROM recycling_centers WHERE id = $1`, [id]);
    
    return NextResponse.json({ 
      success: true,
      message: 'Recycling center deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recycling center:', error);
    return NextResponse.json(
      { error: 'Failed to delete recycling center', success: false },
      { status: 500 }
    );
  }
} 