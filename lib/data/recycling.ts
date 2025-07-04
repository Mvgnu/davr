import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client'; // Import Prisma types

export interface CityStats {
  id: number;
  name: string;
  centersCount: number;
}

export interface Material {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
}

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
    id: string;
    name: string;
    centerCount: number;
  }>;
}

/**
 * Fetches statistics about recycling centers directly from DB
 */
export async function getRecyclingStats(): Promise<RecyclingStats> {
  try {
    const totalCenters = await prisma.recyclingCenter.count();
    const totalMaterials = await prisma.material.count(); 
    const recyclingRate = 67;
    const cityCountResult = await prisma.recyclingCenter.aggregate({
        _count: { city: true },
        where: { city: { not: null } }
    });
    const totalCities = cityCountResult._count.city;

    const purchaseCentersResult = await prisma.recyclingCenterOffer.groupBy({
        by: ['recycling_center_id'],
        where: { price_per_unit: { gt: 0 } },
        _count: { recycling_center_id: true }
    });
    const purchaseCenters = purchaseCentersResult.length;
    const acceptanceRatio = {
        recycling: 1, 
        purchase: totalCenters > 0 ? purchaseCenters / totalCenters : 0
    };

    const popularMaterialsGrouped = await prisma.recyclingCenterOffer.groupBy({
      by: ['material_id'],
      _count: { recycling_center_id: true },
      orderBy: { _count: { recycling_center_id: 'desc' } },
      take: 5,
    });
    const topMaterialIds = popularMaterialsGrouped.map(p => p.material_id);
    const topMaterialDetails = await prisma.material.findMany({
        where: { id: { in: topMaterialIds } },
        select: { id: true, name: true }
    });
    const materialDetailsMap = new Map(topMaterialDetails.map(m => [m.id, m]));
    const popularMaterials = popularMaterialsGrouped.map(group => ({
        id: group.material_id,
        name: materialDetailsMap.get(group.material_id)?.name ?? 'Unknown Material',
        centerCount: group._count.recycling_center_id
    }));

    return {
      totalCenters: totalCenters,
      totalMaterials: totalMaterials,
      recyclingRate: recyclingRate, 
      totalCities: totalCities,
      acceptanceRatio: acceptanceRatio,
      popularMaterials: popularMaterials
    };
  } catch (error) {
    console.error('Error fetching recycling stats directly:', error);
    return { totalCenters: 0, totalMaterials: 0, recyclingRate: 0, totalCities: 0 };
  }
}

/**
 * Fetches popular cities with recycling centers directly from DB
 */
export async function getPopularCities(): Promise<CityStats[]> {
  try {
    const popularCitiesData = await prisma.recyclingCenter.groupBy({
      by: ['city'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
      where: { city: { not: null } }
    });
    return popularCitiesData.map((row, index) => ({
      id: index + 1, 
      name: row.city!, 
      centersCount: row._count?.id ?? 0
    }));
  } catch (error) {
    console.error('Error fetching popular cities directly:', error);
    return [];
  }
}

/**
 * Fetches all available materials directly from DB using Prisma
 * @param category - Optional category filter (currently ignored as not in schema)
 */
export async function getAllMaterials(category?: string): Promise<Material[]> {
  try {
    const materials = await prisma.material.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parent_id: true
      }
    });
    return materials;
  } catch (error) {
    console.error('Failed to fetch materials [Prisma]:', error);
    return [];
  }
}

/**
 * Fetches materials by category (Currently just returns all materials)
 */
export function groupMaterialsByCategory(materials: Material[]): Record<string, Material[]> {
  if (!materials || materials.length === 0) return {};
  return { 'All Materials': materials };
}

/**
 * Fetches top recycling materials by popularity (using Prisma)
 */
export async function getTopMaterials(): Promise<Material[]> {
  try {
    const topMaterialsGrouped = await prisma.recyclingCenterOffer.groupBy({
      by: ['material_id'],
      _count: { recycling_center_id: true },
      orderBy: { _count: { recycling_center_id: 'desc' } },
      take: 10,
    });
    const topMaterialIds = topMaterialsGrouped.map(m => m.material_id);
    const topMaterialsDetails = await prisma.material.findMany({
      where: { id: { in: topMaterialIds } },
      select: { id: true, name: true, slug: true, description: true, parent_id: true }
    });
    const countsMap = new Map(topMaterialsGrouped.map(m => [m.material_id, m._count.recycling_center_id]));
    topMaterialsDetails.sort((a, b) => (countsMap.get(b.id) || 0) - (countsMap.get(a.id) || 0));
    return topMaterialsDetails;
  } catch (error) {
    console.error('Failed to fetch top materials [Prisma]:', error);
    return [];
  }
}

/**
 * Fetches all supported cities directly from DB
 */
export async function getAllCities(): Promise<string[]> {
  try {
    const citiesResult = await prisma.recyclingCenter.findMany({
      where: { city: { not: null } },
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' }
    });
    return citiesResult.map(c => c.city!).filter(Boolean);
  } catch (error) {
    console.error('Error fetching cities directly:', error);
    return [];
  }
}

/**
 * Fetches a specific recycling center by its slug ID (using Prisma)
 */
export async function getRecyclingCenterBySlug(slug: string) {
  try {
    const center = await prisma.recyclingCenter.findUnique({
      where: { slug: slug },
      include: {
        offers: { 
          include: { material: { select: { name: true, slug: true } } }
        },
      }
    });
    
    if (!center) {
      return null; 
    }

    const formattedCenter = {
        ...center,
        buyingMaterials: center.offers?.map(offer => ({
            materialId: offer.material_id,
            materialName: offer.material.name,
            pricePerKg: offer.price_per_unit,
            notes: offer.notes,
            active: true
        })),
    };

    return formattedCenter;
  } catch (error) {
    console.error(`Error fetching recycling center by slug ${slug} [Prisma]:`, error);
    throw error; 
  }
} 