import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/materials/stats
 * Returns global statistics about materials for the hero section
 */
export async function GET() {
  try {
    // Get total materials count
    const totalMaterials = await prisma.material.count();

    // Get total centers that accept materials
    const totalCenters = await prisma.recyclingCenter.count({
      where: {
        verification_status: 'VERIFIED',
      },
    });

    // Calculate total CO2 saved (sum from environmental_impact)
    const materialsWithImpact = await prisma.material.findMany({
      where: {
        environmental_impact: { not: Prisma.DbNull },
      },
      select: {
        environmental_impact: true,
        annual_recycling_volume: true,
      },
    });

    let totalCO2SavedKg = 0;
    materialsWithImpact.forEach((material) => {
      const impact = material.environmental_impact as any;
      const volume = material.annual_recycling_volume || 0;
      if (impact && impact.co2_saved_per_kg && volume) {
        totalCO2SavedKg += impact.co2_saved_per_kg * volume;
      }
    });

    // Convert to tonnes (divide by 1000)
    const totalCO2SavedTonnes = Math.round(totalCO2SavedKg / 1000);

    // Get most recycled material (by annual volume)
    const mostRecycled = await prisma.material.findFirst({
      where: {
        annual_recycling_volume: { not: null },
      },
      orderBy: {
        annual_recycling_volume: 'desc',
      },
      select: {
        name: true,
        annual_recycling_volume: true,
        slug: true,
      },
    });

    // Get featured materials (high recyclability + good data)
    const featuredMaterials = await prisma.material.findMany({
      where: {
        recyclability_percentage: { gte: 80 },
        environmental_impact: { not: Prisma.DbNull },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        recyclability_percentage: true,
        category_icon: true,
        image_url: true,
        fun_fact: true,
      },
      orderBy: {
        recyclability_percentage: 'desc',
      },
      take: 6,
    });

    return NextResponse.json({
      total_materials: totalMaterials,
      total_centers_accepting: totalCenters,
      total_co2_saved_tonnes: totalCO2SavedTonnes,
      most_recycled_material: mostRecycled ? {
        name: mostRecycled.name,
        slug: mostRecycled.slug,
        annual_volume_tonnes: mostRecycled.annual_recycling_volume,
      } : null,
      featured_materials: featuredMaterials,
    });
  } catch (error) {
    console.error('[Materials Stats Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials statistics' },
      { status: 500 }
    );
  }
}
