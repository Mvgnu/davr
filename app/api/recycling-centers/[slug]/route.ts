import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET handler to fetch a single recycling center by slug
 */
export async function GET(
  request: Request, 
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  if (!slug) {
    return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
  }

  try {
    const center = await prisma.recyclingCenter.findUnique({
      where: { 
        slug: slug 
      },
      include: { // Include related data needed for the detail page
        offers: {
          include: {
            material: true, // Include material details for each offer
          },
        },
        // Include other relations if needed (e.g., managedBy, reviews)
      },
    });

    if (!center) {
      console.log(`Recycling center with slug '${slug}' not found.`);
      return NextResponse.json({ error: 'Recycling center not found' }, { status: 404 });
    }

    // Optionally format the response if needed
    return NextResponse.json(center);

  } catch (error: any) {
    console.error(`[GET Recycling Center Error - Slug: ${slug}]`, error);
    return NextResponse.json(
      { error: 'Failed to fetch recycling center', details: error.message },
      { status: 500 }
    );
  }
} 
 