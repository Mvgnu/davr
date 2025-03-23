/**
 * Map utilities for the recycling center application
 */

/**
 * Generates a URL for a static map image based on coordinates
 * 
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 * @param options - Optional parameters for the image
 * @returns URL string for the map image
 */
export function getMapImageUrl(
  latitude: number | undefined,
  longitude: number | undefined,
  options: {
    width?: number;
    height?: number;
    zoom?: number;
  } = {}
): string {
  // Return a placeholder if no coordinates are provided
  if (latitude === undefined || longitude === undefined) {
    return '/images/map-placeholder.jpg';
  }

  // Default parameters
  const width = options.width || 400;
  const height = options.height || 300;
  const zoom = options.zoom || 14;

  // Format the URL with the specified parameters
  return `/api/map-image/${latitude}/${longitude}?width=${width}&height=${height}&zoom=${zoom}`;
}

/**
 * Generates a direct OpenStreetMap URL for navigation
 */
export function getOpenStreetMapDirectionsUrl(latitude: number, longitude: number): string {
  return `https://www.openstreetmap.org/directions?from=&to=${latitude}%2C${longitude}`;
}

/**
 * Generates a Google Maps directions URL
 */
export function getGoogleMapsDirectionsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
} 