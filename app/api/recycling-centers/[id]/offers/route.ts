import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { MaterialOffer } from '../../[id]/route';

/**
 * GET handler to fetch all material offers for a recycling center
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const centerId = parseInt(params.id);
    
    if (isNaN(centerId)) {
      return NextResponse.json(
        { error: 'Invalid center ID format', success: false },
        { status: 400 }
      );
    }
    
    // Check if center exists
    const centerQuery = `SELECT id FROM recycling_centers WHERE id = $1`;
    const centerResult = await query(centerQuery, [centerId]);
    
    if (centerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Recycling center not found', success: false },
        { status: 404 }
      );
    }
    
    // Get material offers
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
    
    const offersResult = await query(offersQuery, [centerId]);
    
    // Format offers for response
    const materialOffers = offersResult.rows.map(offer => ({
      id: offer.id,
      materialId: offer.material_id,
      materialName: offer.material_name,
      category: offer.category,
      price: parseFloat(offer.price),
      minQuantity: parseInt(offer.min_quantity),
      notes: offer.notes || undefined,
      active: offer.active
    }));
    
    return NextResponse.json({
      offers: materialOffers,
      success: true
    });
  } catch (error) {
    console.error('Error fetching material offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material offers', success: false },
      { status: 500 }
    );
  }
}

/**
 * POST handler to create a new material offer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const centerId = parseInt(params.id);
    
    if (isNaN(centerId)) {
      return NextResponse.json(
        { error: 'Invalid center ID format', success: false },
        { status: 400 }
      );
    }
    
    // Check if center exists
    const centerQuery = `SELECT id FROM recycling_centers WHERE id = $1`;
    const centerResult = await query(centerQuery, [centerId]);
    
    if (centerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Recycling center not found', success: false },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.materialId || data.price === undefined || data.minQuantity === undefined) {
      return NextResponse.json({
        error: 'Missing required fields: materialId, price, and minQuantity are required',
        success: false
      }, { status: 400 });
    }
    
    // Check if material exists
    const materialQuery = `SELECT id FROM materials WHERE id = $1`;
    const materialResult = await query(materialQuery, [data.materialId]);
    
    if (materialResult.rows.length === 0) {
      return NextResponse.json({
        error: 'Material not found',
        success: false
      }, { status: 404 });
    }
    
    // Check if offer already exists for this material
    const checkQuery = `
      SELECT id FROM recycling_center_offers 
      WHERE recycling_center_id = $1 AND material_id = $2
    `;
    const checkResult = await query(checkQuery, [centerId, data.materialId]);
    
    if (checkResult.rows.length > 0) {
      return NextResponse.json({
        error: 'An offer for this material already exists',
        success: false
      }, { status: 409 });
    }
    
    // Insert new offer
    const insertQuery = `
      INSERT INTO recycling_center_offers (
        recycling_center_id,
        material_id,
        price,
        min_quantity,
        notes,
        active
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    
    const insertParams = [
      centerId,
      data.materialId,
      data.price,
      data.minQuantity,
      data.notes || null,
      data.active !== undefined ? data.active : true
    ];
    
    const insertResult = await query(insertQuery, insertParams);
    const newOfferId = insertResult.rows[0].id;
    
    // Get the full offer details to return
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
    
    const offerResult = await query(offerQuery, [newOfferId]);
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
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating material offer:', error);
    return NextResponse.json(
      { error: 'Failed to create material offer', success: false },
      { status: 500 }
    );
  }
} 