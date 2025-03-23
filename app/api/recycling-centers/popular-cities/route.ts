import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export interface City {
  id?: number;
  name: string;
  state: string;
  centersCount: number;
}

/**
 * GET handler to fetch most popular cities with recycling centers
 */
export async function GET() {
  try {
    // Query the database to get cities with the most recycling centers
    const citiesQuery = `
      SELECT 
        city, 
        state,
        COUNT(*) as centers_count
      FROM recycling_centers
      GROUP BY city, state
      ORDER BY centers_count DESC
      LIMIT 10
    `;
    
    const result = await query(citiesQuery);
    
    const popularCities: City[] = result.rows.map((row, index) => ({
      id: index + 1, // Generate an id for the city
      name: row.city,
      state: row.state,
      centersCount: parseInt(row.centers_count)
    }));
    
    return NextResponse.json({
      data: popularCities
    });
  } catch (error) {
    console.error('Error fetching popular cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular cities' }, 
      { status: 500 }
    );
  }
} 