import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma'; // Use Prisma client

/**
 * GET handler to fetch all distinct cities with recycling centers using Prisma
 */
export async function GET() {
  try {
    // Query the database to get all unique, non-null cities
    const citiesResult = await prisma.recyclingCenter.findMany({
      select: {
        city: true
      },
      where: {
        city: {
          not: null // Exclude entries where city is null
        }
      },
      distinct: ['city'],
      orderBy: {
        city: 'asc'
      }
    });
    
    // Extract city names from the result
    const cities = citiesResult.map(row => row.city);
    
    return NextResponse.json({
      success: true, // Added success flag
      data: cities
    });
  } catch (error) {
    console.error('Error fetching cities [Prisma]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cities' }, 
      { status: 500 }
    );
  }
} 