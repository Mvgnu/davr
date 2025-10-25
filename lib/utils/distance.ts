/**
 * Distance calculation utilities using the Haversine formula
 * for calculating great-circle distances between two points on a sphere
 */

/**
 * Convert degrees to radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 *
 * @param lat1 - Latitude of first point in degrees
 * @param lon1 - Longitude of first point in degrees
 * @param lat2 - Latitude of second point in degrees
 * @param lon2 - Longitude of second point in degrees
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km

  return distance;
}

/**
 * Sort an array of items by distance from a given location
 * Items must have latitude and longitude properties (or coordinates/location objects)
 *
 * @param items - Array of items to sort
 * @param userLat - User's latitude
 * @param userLng - User's longitude
 * @returns Array of items with distance property added, sorted by distance
 */
export function sortByDistance<T extends Record<string, any>>(
  items: T[],
  userLat: number,
  userLng: number
): Array<T & { distance: number }> {
  return items
    .map((item) => {
      // Try to extract coordinates from various possible formats
      const itemLat =
        item.latitude ||
        item.lat ||
        item.coordinates?.lat ||
        item.location?.lat ||
        0;
      const itemLng =
        item.longitude ||
        item.lng ||
        item.coordinates?.lng ||
        item.location?.lng ||
        0;

      const distance = calculateDistance(userLat, userLng, itemLat, itemLng);

      return {
        ...item,
        distance,
      };
    })
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Filter items by maximum distance from a given location
 *
 * @param items - Array of items to filter
 * @param userLat - User's latitude
 * @param userLng - User's longitude
 * @param maxDistance - Maximum distance in kilometers
 * @returns Array of items within the specified distance
 */
export function filterByDistance<T extends Record<string, any>>(
  items: T[],
  userLat: number,
  userLng: number,
  maxDistance: number
): T[] {
  return items.filter((item) => {
    const itemLat =
      item.latitude ||
      item.lat ||
      item.coordinates?.lat ||
      item.location?.lat ||
      0;
    const itemLng =
      item.longitude ||
      item.lng ||
      item.coordinates?.lng ||
      item.location?.lng ||
      0;

    const distance = calculateDistance(userLat, userLng, itemLat, itemLng);
    return distance <= maxDistance;
  });
}

/**
 * Format distance for display
 *
 * @param distance - Distance in kilometers
 * @returns Formatted string (e.g., "2.5 km" or "850 m")
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
}
