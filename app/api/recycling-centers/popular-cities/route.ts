import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export interface PopularCity {
  city: string;
  centersCount: number;
}

/**
 * GET handler to fetch most popular cities (top 10 by center count) using Prisma
 */
export async function GET() {
  try {
    // Query the database to group centers by city and count them
    const cityGroups = await prisma.recyclingCenter.groupBy({
      by: ['city'],
      where: {
        city: {
          not: null
        }
      },
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          city: 'desc'
        }
      },
      take: 10
    });
    
    // Map the results to the desired format
    const popularCities: PopularCity[] = cityGroups.map(group => ({
      city: group.city!,
      centersCount: group._count._all
    }));
    
    return NextResponse.json({
      success: true,
      data: popularCities
    });
  } catch (error) {
    console.error('Error fetching popular cities [Prisma]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch popular cities' }, 
      { status: 500 }
    );
  }
} 