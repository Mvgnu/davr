import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export interface RecyclingStats {
  totalCenters: number;
  totalMaterials: number;
  recyclingRate: number;
  totalCities?: number;
  acceptanceRatio?: {
    recycling: number;
    purchase: number;
  };
  popularMaterials?: Array<{
    id: number;
    name: string;
    category: string;
    centerCount: number;
  }>;
}

/**
 * GET handler to fetch recycling center statistics
 */
export async function GET() {
  try {
    // Query the database to get various statistics
    
    // Get total centers count
    const centersQuery = 'SELECT COUNT(*) as count FROM recycling_centers';
    const centersResult = await query(centersQuery);
    const totalCenters = parseInt(centersResult.rows[0].count);
    
    // Get total materials count
    const materialsQuery = 'SELECT COUNT(*) as count FROM materials WHERE parent_id IS NULL';
    const materialsResult = await query(materialsQuery);
    const totalMaterials = parseInt(materialsResult.rows[0].count);
    
    // Get total cities count
    const citiesQuery = 'SELECT COUNT(DISTINCT city) as count FROM recycling_centers';
    const citiesResult = await query(citiesQuery);
    const totalCities = parseInt(citiesResult.rows[0].count);
    
    // Get centers that purchase materials (price > 0)
    const purchaseQuery = `
      SELECT COUNT(DISTINCT recycling_center_id) as count 
      FROM recycling_center_offers 
      WHERE price > 0 AND is_active = true
    `;
    const purchaseResult = await query(purchaseQuery);
    const purchaseCenters = parseInt(purchaseResult.rows[0].count);
    
    // Calculate acceptance ratio
    const acceptanceRatio = {
      recycling: 1, // All centers accept recycling by definition
      purchase: totalCenters > 0 ? purchaseCenters / totalCenters : 0
    };
    
    // Get popular materials
    const popularMaterialsQuery = `
      SELECT 
        m.id, 
        m.name, 
        m.category, 
        COUNT(DISTINCT rco.recycling_center_id) as center_count
      FROM materials m
      JOIN recycling_center_offers rco ON m.id = rco.material_id
      WHERE m.parent_id IS NULL AND rco.is_active = true
      GROUP BY m.id, m.name, m.category
      ORDER BY center_count DESC
      LIMIT 5
    `;
    const popularMaterialsResult = await query(popularMaterialsQuery);
    const popularMaterials = popularMaterialsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      centerCount: parseInt(row.center_count)
    }));
    
    // Assume a recycling rate of 65% for now
    // In a real app, this would be calculated from actual recycling data
    const recyclingRate = 0.65;
    
    const stats: RecyclingStats = {
      totalCenters,
      totalMaterials,
      recyclingRate,
      totalCities,
      acceptanceRatio,
      popularMaterials
    };
    
    return NextResponse.json({
      data: stats
    });
  } catch (error) {
    console.error('Error fetching recycling statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recycling statistics' }, 
      { status: 500 }
    );
  }
} 