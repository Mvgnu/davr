/**
 * Converts a string to a URL-friendly slug
 * @param text The text to slugify
 * @returns A URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
}

/**
 * Creates a slug from a recycling center name and city
 * @param name Center name
 * @param city City name
 * @returns A slug in the format "{city-slug}-{name-slug}"
 */
export function createRecyclingCenterSlug(name: string, city: string): string {
  const citySlug = slugify(city);
  const nameSlug = slugify(name);
  return `${citySlug}-${nameSlug}`;
} 