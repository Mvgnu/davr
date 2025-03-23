import { RecyclingCenter } from '@/components/SearchProvider';

/**
 * Client-safe function to fetch recycling centers from the API endpoint
 */
export async function getRecyclingCenters(): Promise<RecyclingCenter[]> {
  try {
    // Make an API call to our backend endpoint instead of directly accessing MongoDB
    const response = await fetch('/api/recycling-centers', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store' // Don't cache the response
    });

    if (!response.ok) {
      throw new Error(`Error fetching recycling centers: ${response.status}`);
    }

    // Parse the response JSON
    const data = await response.json();
    
    // The API response structure is { data: [...centers], meta: {...} }
    const centers = data.data || [];
    
    if (!centers || !Array.isArray(centers)) {
      console.log('No recycling centers found or invalid data format');
      return [];
    }
    
    return centers;
  } catch (error) {
    console.error('Error fetching recycling centers:', error);
    return []; // Return empty array on error
  }
}

/**
 * Client-safe function to fetch recycling centers by city
 */
export async function getRecyclingCentersByCity(city: string): Promise<RecyclingCenter[]> {
  try {
    // Make an API call to our backend endpoint with the city filter
    const response = await fetch(`/api/recycling-centers?city=${encodeURIComponent(city)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store' // Don't cache the response
    });

    if (!response.ok) {
      throw new Error(`Error fetching recycling centers: ${response.status}`);
    }

    // Parse the response JSON
    const data = await response.json();
    
    // The API response structure is { data: [...centers], meta: {...} }
    const centers = data.data || [];
    
    if (!centers || !Array.isArray(centers)) {
      console.log(`No recycling centers found for city: ${city} or invalid data format`);
      return [];
    }
    
    return centers;
  } catch (error) {
    console.error(`Error fetching recycling centers for city ${city}:`, error);
    return []; // Return empty array on error
  }
} 