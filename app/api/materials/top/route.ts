import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Query the top 10 materials by popularity (number of recycling centers that accept them)
    const result = await query(`
      SELECT 
        m.id, 
        m.name, 
        m.description, 
        m.category,
        m.subtype,
        m.recyclable,
        m.market_value_level,
        m.approximate_min_price,
        m.approximate_max_price,
        m.image_url,
        COUNT(DISTINCT rco.recycling_center_id) as centers_count 
      FROM 
        materials m
      LEFT JOIN 
        recycling_center_offers rco ON m.id = rco.material_id
      GROUP BY 
        m.id
      ORDER BY 
        centers_count DESC
      LIMIT 10
    `);
    
    return NextResponse.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (error) {
    console.error('Error fetching top materials:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch top materials' },
      { status: 500 }
    );
  }
} 