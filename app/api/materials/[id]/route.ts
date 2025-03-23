import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const materialId = params.id;
    
    // Get the material by ID
    const materialResult = await query(
      `SELECT 
        id, 
        name, 
        description, 
        category,
        subtype,
        recyclable,
        market_value_level,
        approximate_min_price,
        approximate_max_price,
        image_url,
        parent_id
      FROM materials
      WHERE id = $1`,
      [materialId]
    );
    
    if (materialResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Material not found' },
        { status: 404 }
      );
    }
    
    const material = materialResult.rows[0];
    
    // If this is a parent material, get its children
    if (!material.parent_id) {
      const childrenResult = await query(
        `SELECT 
          id, 
          name, 
          description, 
          category,
          subtype,
          recyclable,
          market_value_level,
          approximate_min_price,
          approximate_max_price,
          image_url,
          parent_id
        FROM materials
        WHERE parent_id = $1
        ORDER BY name ASC`,
        [material.id]
      );
      
      if (childrenResult.rows.length > 0) {
        material.children = childrenResult.rows;
      }
    }
    
    // Get recycling stats for this material
    const recyclingStatsResult = await query(
      `SELECT 
        COUNT(DISTINCT rc.id) as centers_count
      FROM 
        recycling_centers rc
      JOIN 
        recycling_center_offers rco ON rc.id = rco.recycling_center_id
      WHERE 
        rco.material_id = $1`,
      [materialId]
    );
    
    const centersCount = parseInt(recyclingStatsResult.rows[0]?.centers_count || '0');
    
    // Get price stats
    const priceStatsResult = await query(
      `SELECT 
        AVG(price) as avg_price,
        MAX(price) as max_price,
        MIN(price) as min_price
      FROM 
        recycling_center_offers
      WHERE 
        material_id = $1 AND is_active = true AND price > 0`,
      [materialId]
    );
    
    const priceStats = priceStatsResult.rows[0];
    
    return NextResponse.json({ 
      success: true, 
      data: {
        ...material,
        stats: {
          centersCount,
          avgPrice: priceStats?.avg_price ? parseFloat(parseFloat(priceStats.avg_price).toFixed(2)) : 0,
          minPrice: priceStats?.min_price ? parseFloat(parseFloat(priceStats.min_price).toFixed(2)) : 0,
          maxPrice: priceStats?.max_price ? parseFloat(parseFloat(priceStats.max_price).toFixed(2)) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching material:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch material details' },
      { status: 500 }
    );
  }
} 