import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Added Utility Functions ---

/**
 * Creates a URL-friendly slug from a string.
 * Example: "My Title!" -> "my-title"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[&/\\#,+()$~%.':*?<>{}]/g, '') // Remove special characters
    .replace(/--+/g, '-');      // Replace multiple - with single -
}

/**
 * Formats a number as currency (EUR).
 */
export function formatCurrency(amount: number | null | undefined, currency: string = 'EUR', locale: string = 'de-DE'): string {
  if (amount === null || amount === undefined) {
    return 'N/A'; // Or return an empty string or placeholder
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculates the distance between two points using the Haversine formula.
 * Returns distance in kilometers.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

/**
 * Formats a distance in kilometers.
 */
export function formatDistance(distanceKm: number | null | undefined): string {
   if (distanceKm === null || distanceKm === undefined) {
        return 'N/A';
    }
    if (distanceKm < 1) {
        return `${(distanceKm * 1000).toFixed(0)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
}
