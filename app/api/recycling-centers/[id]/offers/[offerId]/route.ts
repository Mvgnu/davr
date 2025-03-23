import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { MaterialOffer } from '../../../[id]/route';

/**
 * GET handler to fetch a single material offer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string, offerId: string } }
) {
  try {
    const centerId = parseInt(params.id);
    const offerId = parseInt(params.offerId);
    
    if (isNaN(centerId) || isNaN(offerId)) {
      return NextResponse.json(
        { error: 'Invalid ID format', success: false },
        { status: 400 }
      );
    }
    
    // Get material offer
    const offerQuery = `
      SELECT 
        rco.id,
        rco.material_id,
        m.name as material_name,
        m.category,
        rco.price,
        rco.min_quantity,
        rco.notes,
        rco.active,
        rc.id as center_id,
        rc.name as center_name,
        rc.owner_id
      FROM recycling_center_offers rco
      JOIN materials m ON rco.material_id = m.id
      JOIN recycling_centers rc ON rco.recycling_center_id = rc.id
      WHERE rco.recycling_center_id = $1 AND rco.id = $2
    `;
    
    const offerResult = await query(offerQuery, [centerId, offerId]);
    
    if (offerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Material offer not found', success: false },
        { status: 404 }
      );
    }
    
    const offer = offerResult.rows[0];
    
    // Format offer for response
    const materialOffer: MaterialOffer = {
      id: offer.id,
      materialId: offer.material_id,
      materialName: offer.material_name,
      category: offer.category,
      price: parseFloat(offer.price),
      minQuantity: parseInt(offer.min_quantity),
      notes: offer.notes || undefined,
      active: offer.active
    };
    
    return NextResponse.json({
      offer: materialOffer,
      success: true
    });
  } catch (error) {
    console.error('Error fetching material offer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material offer', success: false },
      { status: 500 }
    );
  }
}

/**
 * PUT handler to update a material offer
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string, offerId: string } }
) {
  try {
    const centerId = parseInt(params.id);
    const offerId = parseInt(params.offerId);
    
    if (isNaN(centerId) || isNaN(offerId)) {
      return NextResponse.json(
        { error: 'Invalid ID format', success: false },
        { status: 400 }
      );
    }
    
    // Check if offer exists and belongs to the center
    const checkQuery = `
      SELECT rco.id, rc.owner_id 
      FROM recycling_center_offers rco
      JOIN recycling_centers rc ON rco.recycling_center_id = rc.id
      WHERE rco.recycling_center_id = $1 AND rco.id = $2
    `;
    
    const checkResult = await query(checkQuery, [centerId, offerId]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Material offer not found', success: false },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (data.price === undefined || data.minQuantity === undefined) {
      return NextResponse.json({
        error: 'Missing required fields: price and minQuantity are required',
        success: false
      }, { status: 400 });
    }
    
    // Update offer
    const updateQuery = `
      UPDATE recycling_center_offers
      SET 
        price = $1,
        min_quantity = $2,
        notes = $3,
        active = $4
      WHERE id = $5 AND recycling_center_id = $6
      RETURNING id
    `;
    
    const updateParams = [
      data.price,
      data.minQuantity,
      data.notes || null,
      data.active !== undefined ? data.active : true,
      offerId,
      centerId
    ];
    
    const updateResult = await query(updateQuery, updateParams);
    
    if (updateResult.rows.length === 0) {
      return NextResponse.json({
        error: 'Failed to update material offer',
        success: false
      }, { status: 500 });
    }
    
    // Get updated offer details
    const offerQuery = `
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
      WHERE rco.id = $1
    `;
    
    const offerResult = await query(offerQuery, [offerId]);
    const offer = offerResult.rows[0];
    
    return NextResponse.json({
      offer: {
        id: offer.id,
        materialId: offer.material_id,
        materialName: offer.material_name,
        category: offer.category,
        price: parseFloat(offer.price),
        minQuantity: parseInt(offer.min_quantity),
        notes: offer.notes || undefined,
        active: offer.active
      },
      success: true
    });
  } catch (error) {
    console.error('Error updating material offer:', error);
    return NextResponse.json(
      { error: 'Failed to update material offer', success: false },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler to remove a material offer
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, offerId: string } }
) {
  try {
    const centerId = parseInt(params.id);
    const offerId = parseInt(params.offerId);
    
    if (isNaN(centerId) || isNaN(offerId)) {
      return NextResponse.json(
        { error: 'Invalid ID format', success: false },
        { status: 400 }
      );
    }
    
    // Check if offer exists and belongs to the center
    const checkQuery = `
      SELECT rco.id, rc.owner_id 
      FROM recycling_center_offers rco
      JOIN recycling_centers rc ON rco.recycling_center_id = rc.id
      WHERE rco.recycling_center_id = $1 AND rco.id = $2
    `;
    
    const checkResult = await query(checkQuery, [centerId, offerId]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Material offer not found', success: false },
        { status: 404 }
      );
    }
    
    // Delete offer
    const deleteQuery = `
      DELETE FROM recycling_center_offers
      WHERE id = $1 AND recycling_center_id = $2
    `;
    
    await query(deleteQuery, [offerId, centerId]);
    
    return NextResponse.json({
      success: true,
      message: 'Material offer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting material offer:', error);
    return NextResponse.json(
      { error: 'Failed to delete material offer', success: false },
      { status: 500 }
    );
  }
} 