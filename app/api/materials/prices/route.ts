import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET handler for fetching material price statistics
 * This endpoint calculates min, max, and average prices for each material
 * based on actual offers from recycling centers in the database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get('materialId');
    const category = searchParams.get('category');
    
    // Build query to get price statistics for materials
    let sql = `
      SELECT 
        m.id AS material_id,
        m.name AS material_name,
        m.category,
        COUNT(rco.id) AS offer_count,
        MIN(rco.price) AS min_price,
        MAX(rco.price) AS max_price,
        AVG(rco.price) AS avg_price
      FROM 
        materials m
      LEFT JOIN 
        recycling_center_offers rco ON m.id = rco.material_id
      WHERE 
        rco.active = true
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // Add additional filters if provided
    if (materialId) {
      sql += ` AND m.id = $${paramIndex}`;
      params.push(materialId);
      paramIndex++;
    }
    
    if (category) {
      sql += ` AND LOWER(m.category) = LOWER($${paramIndex})`;
      params.push(category);
      paramIndex++;
    }
    
    // Group by material
    sql += `
      GROUP BY 
        m.id, m.name, m.category
      ORDER BY 
        m.category, m.name
    `;
    
    // Execute query
    const result = await query(sql, params);
    
    // Format results
    const priceStats = result.rows.map(row => ({
      materialId: row.material_id,
      materialName: row.material_name,
      category: row.category,
      offerCount: parseInt(row.offer_count) || 0,
      minPrice: row.min_price ? parseFloat(row.min_price) : null,
      maxPrice: row.max_price ? parseFloat(row.max_price) : null,
      avgPrice: row.avg_price ? parseFloat(row.avg_price) : null,
      // Add price trend data - this would ideally come from historical data
      // For now we'll leave it null
      priceTrend: null
    }));
    
    return NextResponse.json({
      success: true,
      data: priceStats
    });
  } catch (error) {
    console.error('Error fetching material price statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material price statistics', success: false },
      { status: 500 }
    );
  }
} 