import { MetadataRoute } from 'next';

/**
 * Robots.txt configuration for DAVR platform
 *
 * Controls search engine crawling behavior:
 * - Allows crawling of public pages
 * - Blocks admin, auth, and user-specific pages
 * - References sitemap for efficient crawling
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/recycling-centers',
          '/recycling-centers/*',
          '/materials',
          '/materials/*',
          '/marketplace',
          '/marketplace/listings/*',
          '/marketplace/materials',
          '/marketplace/materials/*',
          '/blog',
          '/blog/*',
          '/recycling-guide',
          '/faq',
          '/sustainability',
          '/for-businesses',
          '/for-recycling-centers',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/api/*',
          '/auth/*',
          '/dashboard',
          '/dashboard/*',
          '/profile',
          '/profile/*',
          '/manage/*',
          '/marketplace/new',
          '/marketplace/edit/*',
          '/login',
          '/register',
          '/_next/*',
          '/search?*', // Allow search page but not with query params
        ],
      },
      {
        // Special rules for Google
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/about',
          '/recycling-centers',
          '/recycling-centers/*',
          '/materials',
          '/materials/*',
          '/marketplace',
          '/marketplace/listings/*',
          '/blog',
          '/blog/*',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/api/*',
          '/auth/*',
          '/dashboard',
          '/dashboard/*',
          '/profile',
          '/manage/*',
          '/marketplace/new',
          '/marketplace/edit/*',
        ],
      },
      {
        // Block bad bots
        userAgent: [
          'AhrefsBot',
          'SemrushBot',
          'DotBot',
          'MJ12bot',
          'BLEXBot',
        ],
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
