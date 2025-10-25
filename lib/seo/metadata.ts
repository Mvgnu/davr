import { Metadata } from 'next';

/**
 * SEO Metadata Utilities for DAVR Platform
 *
 * Provides reusable metadata configurations for consistent SEO
 * across all pages with proper Open Graph and Twitter Card support
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const siteName = 'DAVR - Deutsche Aluminium Verwertung & Recycling';
const siteDescription = 'Deutschlands führende Plattform für Aluminiumrecycling. Finden Sie Recyclingzentren, handeln Sie mit Aluminiummaterialien und lernen Sie über nachhaltige Verwertung.';

export const defaultMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    'Aluminium Recycling',
    'Recyclingzentren Deutschland',
    'Aluminium Verwertung',
    'Metallrecycling',
    'Nachhaltigkeit',
    'Kreislaufwirtschaft',
    'Aluminium Marktplatz',
    'Sekundäraluminium',
    'Schrott Recycling',
  ],
  authors: [{ name: 'DAVR Platform' }],
  creator: 'DAVR',
  publisher: 'DAVR',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: baseUrl,
    siteName,
    title: siteName,
    description: siteDescription,
    images: [
      {
        url: `${baseUrl}/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'DAVR - Aluminiumrecycling Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
    images: [`${baseUrl}/images/twitter-image.png`],
    creator: '@davr_platform',
  },
  alternates: {
    canonical: baseUrl,
  },
  verification: {
    google: 'your-google-site-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
};

/**
 * Generate metadata for recycling center pages
 */
export function generateCenterMetadata(center: {
  name: string;
  city: string;
  description?: string | null;
  slug: string;
}): Metadata {
  const title = `${center.name} - Recyclingzentrum in ${center.city}`;
  const description =
    center.description ||
    `Recyclingzentrum ${center.name} in ${center.city}. Informationen zu Öffnungszeiten, Materialien und Bewertungen.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/recycling-centers/${center.slug}`,
      // Use a supported OpenGraph type
      type: 'website',
      images: [
        {
          url: `${baseUrl}/images/og-image.png`,
          width: 1200,
          height: 630,
          alt: center.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/recycling-centers/${center.slug}`,
    },
  };
}

/**
 * Generate metadata for material pages
 */
export function generateMaterialMetadata(material: {
  name: string;
  description?: string | null;
  slug: string;
}): Metadata {
  const title = `${material.name} Recycling - Verwertung & Entsorgung`;
  const description =
    material.description ||
    `Alles über ${material.name} Recycling: Finden Sie Recyclingzentren, Marktplätze und Informationen zur Verwertung.`;

  return {
    title,
    description,
    keywords: [
      material.name,
      `${material.name} Recycling`,
      `${material.name} Verwertung`,
      `${material.name} Entsorgung`,
      'Aluminium',
    ],
    openGraph: {
      title,
      description,
      url: `${baseUrl}/materials/${material.slug}`,
      type: 'article',
      images: [
        {
          url: `${baseUrl}/images/og-image.png`,
          width: 1200,
          height: 630,
          alt: material.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/materials/${material.slug}`,
    },
  };
}

/**
 * Generate metadata for marketplace listing pages
 */
export function generateListingMetadata(listing: {
  title: string;
  description?: string | null;
  type: 'BUY' | 'SELL';
  material?: { name: string } | null;
}): Metadata {
  const actionText = listing.type === 'BUY' ? 'Kaufe' : 'Verkaufe';
  const materialText = listing.material ? ` - ${listing.material.name}` : '';
  const title = `${actionText}: ${listing.title}${materialText}`;
  const description =
    listing.description ||
    `${actionText} ${listing.title} auf dem DAVR Aluminium Marktplatz.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Generate metadata for blog post pages
 */
export function generateBlogMetadata(post: {
  title: string;
  excerpt?: string | null;
  slug: string;
  published_at?: Date | null;
  author?: { name: string | null } | null;
}): Metadata {
  const description = post.excerpt || post.title;
  const publishedTime = post.published_at?.toISOString();

  return {
    title: post.title,
    description,
    authors: post.author?.name ? [{ name: post.author.name }] : undefined,
    openGraph: {
      title: post.title,
      description,
      url: `${baseUrl}/blog/${post.slug}`,
      type: 'article',
      publishedTime,
      authors: post.author?.name ? [post.author.name] : undefined,
      images: [
        {
          url: `${baseUrl}/images/og-image.png`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/blog/${post.slug}`,
    },
  };
}

/**
 * Generate metadata for search pages (noindex to avoid duplicate content)
 */
export function generateSearchMetadata(query?: string): Metadata {
  const title = query ? `Suche: ${query}` : 'Suche';

  return {
    title,
    description: 'Suchen Sie nach Recyclingzentren, Materialien und Marktplatzangeboten.',
    robots: {
      index: false, // Don't index search results
      follow: true,
    },
  };
}

/**
 * Generate JSON-LD structured data for local business (recycling centers)
 */
export function generateLocalBusinessSchema(center: {
  name: string;
  address_street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  website?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RecyclingCenter',
    name: center.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: center.address_street,
      addressLocality: center.city,
      postalCode: center.postal_code,
      addressCountry: 'DE',
    },
    ...(center.phone && { telephone: center.phone }),
    ...(center.website && { url: center.website }),
    ...(center.latitude &&
      center.longitude && {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: center.latitude,
          longitude: center.longitude,
        },
      }),
  };
}

/**
 * Generate JSON-LD structured data for organization
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DAVR',
    url: baseUrl,
    logo: `${baseUrl}/images/logo.png`,
    description: siteDescription,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['German', 'English'],
    },
  };
}
