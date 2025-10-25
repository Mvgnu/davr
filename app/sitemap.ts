import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db/prisma';

/**
 * Dynamic sitemap generation for DAVR platform
 *
 * Includes:
 * - Static pages (about, faq, etc.)
 * - Dynamic recycling center pages
 * - Dynamic material pages
 * - Dynamic marketplace listings
 * - Dynamic blog posts
 *
 * Updates automatically as content changes
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Static pages with priorities and change frequencies
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/recycling-centers`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/materials`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/marketplace`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/recycling-guide`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/sustainability`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/for-businesses`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/for-recycling-centers`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  try {
    // Fetch verified recycling centers
    const centers = await prisma.recyclingCenter.findMany({
      where: {
        verification_status: 'VERIFIED',
      },
      select: {
        slug: true,
        updated_at: true,
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

    const centerPages: MetadataRoute.Sitemap = centers.map((center) => ({
      url: `${baseUrl}/recycling-centers/${center.slug}`,
      lastModified: center.updated_at,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // Fetch materials
    const materials = await prisma.material.findMany({
      select: {
        slug: true,
        updated_at: true,
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

    const materialPages: MetadataRoute.Sitemap = materials.map((material) => ({
      url: `${baseUrl}/materials/${material.slug}`,
      lastModified: material.updated_at,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // Fetch active marketplace listings
    const listings = await prisma.marketplaceListing.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        updated_at: true,
      },
      orderBy: {
        updated_at: 'desc',
      },
      take: 1000, // Limit to prevent sitemap from being too large
    });

    const listingPages: MetadataRoute.Sitemap = listings.map((listing) => ({
      url: `${baseUrl}/marketplace/listings/${listing.id}`,
      lastModified: listing.updated_at,
      changeFrequency: 'daily',
      priority: 0.6,
    }));

    // Fetch published blog posts (if BlogPost model exists)
    let blogPages: MetadataRoute.Sitemap = [];
    try {
      const posts = await prisma.blogPost.findMany({
        where: {
          status: 'PUBLISHED',
        },
        select: {
          slug: true,
          updated_at: true,
        },
        orderBy: {
          updated_at: 'desc',
        },
      });

      blogPages = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updated_at,
        changeFrequency: 'monthly',
        priority: 0.6,
      }));
    } catch (error) {
      // BlogPost table might not exist yet
      console.log('[Sitemap] BlogPost table not found, skipping blog pages');
    }

    // Combine all pages
    return [...staticPages, ...centerPages, ...materialPages, ...listingPages, ...blogPages];
  } catch (error) {
    console.error('[Sitemap] Error generating sitemap:', error);
    // Return at least static pages if database query fails
    return staticPages;
  }
}
