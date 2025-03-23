import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET handler to fetch all cities with recycling centers
 */
export async function GET() {
  try {
    // Query the database to get all unique cities
    const citiesQuery = `
      SELECT DISTINCT city 
      FROM recycling_centers 
      ORDER BY city ASC
    `;
    
    const result = await query(citiesQuery);
    
    // Extract city names from the result
    const cities = result.rows.map(row => row.city);
    
    return NextResponse.json({
      data: cities
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' }, 
      { status: 500 }
    );
  }
} 