import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

interface RouteParams {
  params: { slug: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  const { slug } = params;

  if (!slug) {
    return NextResponse.json({ error: 'Material slug parameter is required' }, { status: 400 });
  }

  try {
    const material = await prisma.material.findUnique({
      where: { slug: slug },
      // Select fields needed for the detail view
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        image_url: true,
        parent_id: true, // For hierarchy info
        parent: { select: { name: true, slug: true } }, // Include parent name/slug
        children: { select: { name: true, slug: true } }, // Include children names/slugs
        // Potentially include related RecyclingCenterOffers or MarketplaceListings count/summary later
      },
    });

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    return NextResponse.json(material);

  } catch (error) {
    console.error(`[GET Material Error - Slug: ${slug}]`, error);
    return NextResponse.json(
      { error: 'Failed to fetch material' },
      { status: 500 }
    );
  }
} 