import axios from '@/lib/axios';

export interface CityStats {
  id: number;
  name: string;
  state: string;
  centersCount: number;
}

export interface Material {
  id: number;
  name: string;
  category: string;
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
    id: number;
    name: string;
    category: string;
    centerCount: number;
  }>;
}

/**
 * Fetches statistics about recycling centers
 */
export async function getRecyclingStats(): Promise<RecyclingStats> {
  try {
    const response = await axios.get('/api/recycling-centers/stats');
    // The API returns { data: { ... stats }}
    return response.data.data || {
      totalCenters: 0,
      totalMaterials: 0,
      recyclingRate: 0,
      totalCities: 0
    };
  } catch (error) {
    console.error('Error fetching recycling stats:', error);
    // Return fallback data if API fails - in production, you might want to handle this differently
    return {
      totalCenters: 0,
      totalMaterials: 0,
      recyclingRate: 0,
      totalCities: 0
    };
  }
}

/**
 * Fetches popular cities with recycling centers
 */
export async function getPopularCities(): Promise<CityStats[]> {
  try {
    const response = await axios.get('/api/recycling-centers/popular-cities');
    // The API returns { data: [ ...cities ]}
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching popular cities:', error);
    return [];
  }
}

/**
 * Fetches all available materials for recycling
 */
export async function getAllMaterials(category?: string): Promise<Material[]> {
  try {
    const url = category 
      ? `/api/materials?category=${encodeURIComponent(category)}` 
      : '/api/materials';
    
    const response = await axios.get(url);
    return response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch materials:', error);
    return [];
  }
}

/**
 * Fetches materials by category
 */
export function groupMaterialsByCategory(materials: Material[]): Record<string, Material[]> {
  return materials.reduce((acc, material) => {
    if (!acc[material.category]) {
      acc[material.category] = [];
    }
    acc[material.category].push(material);
    return acc;
  }, {} as Record<string, Material[]>);
}

/**
 * Fetches top recycling materials by popularity
 */
export async function getTopMaterials(): Promise<Material[]> {
  try {
    const response = await axios.get('/api/materials/top');
    return response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch top materials:', error);
    return [];
  }
}

/**
 * Fetches all supported cities
 */
export async function getAllCities(): Promise<string[]> {
  try {
    // This endpoint might not exist yet
    const response = await axios.get('/api/recycling-centers/cities');
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
} 