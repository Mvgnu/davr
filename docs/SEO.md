# SEO Implementation Guide

## Overview

DAVR implements comprehensive SEO (Search Engine Optimization) to maximize visibility in search engines, drive organic traffic, and improve discoverability of recycling centers and materials.

---

## Core Components

### 1. Dynamic Sitemap (`app/sitemap.ts`)

**Purpose**: Automatically generates XML sitemap for search engines

**Features**:
- ✅ Static pages (about, faq, etc.)
- ✅ Dynamic recycling center pages
- ✅ Dynamic material pages
- ✅ Dynamic marketplace listings (up to 1,000)
- ✅ Dynamic blog posts
- ✅ Priority and change frequency optimization
- ✅ Last modified timestamps

**Access**: `https://yoursite.com/sitemap.xml`

**Update Frequency**: Regenerated on each request (cached by Next.js)

### 2. Robots.txt (`app/robots.ts`)

**Purpose**: Controls search engine crawling behavior

**Features**:
- ✅ Allows public pages
- ✅ Blocks admin, auth, and private pages
- ✅ Blocks API endpoints
- ✅ Special rules for Google
- ✅ Blocks unwanted bots
- ✅ References sitemap

**Access**: `https://yoursite.com/robots.txt`

### 3. Metadata Utilities (`lib/seo/metadata.ts`)

**Purpose**: Reusable SEO metadata configurations

**Features**:
- ✅ Default site-wide metadata
- ✅ Page-specific metadata generators
- ✅ Open Graph tags
- ✅ Twitter Cards
- ✅ JSON-LD structured data
- ✅ Canonical URLs

---

## Implementation Guide

### Static Pages

Update page metadata using the default configuration:

```typescript
import { Metadata } from 'next';
import { defaultMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  ...defaultMetadata,
  title: 'About Us',
  description: 'Learn about DAVR and our mission...',
};
```

### Dynamic Pages (Recycling Centers)

Use metadata generators for dynamic content:

```typescript
import { generateCenterMetadata, generateLocalBusinessSchema } from '@/lib/seo/metadata';

export async function generateMetadata({ params }): Promise<Metadata> {
  const center = await prisma.recyclingCenter.findUnique({
    where: { slug: params.slug },
  });

  if (!center) {
    return { title: 'Center Not Found' };
  }

  return generateCenterMetadata(center);
}

export default async function CenterPage({ params }) {
  const center = await getCenterData(params.slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateLocalBusinessSchema(center)),
        }}
      />
      {/* Page content */}
    </>
  );
}
```

### Dynamic Pages (Materials)

```typescript
import { generateMaterialMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ params }): Promise<Metadata> {
  const material = await prisma.material.findUnique({
    where: { slug: params.slug },
  });

  return generateMaterialMetadata(material);
}
```

### Dynamic Pages (Blog Posts)

```typescript
import { generateBlogMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug },
    include: { author: true },
  });

  return generateBlogMetadata(post);
}
```

---

## Sitemap Configuration

### Priority Guidelines

```
1.0 - Homepage
0.9 - Main category pages (centers, materials, marketplace)
0.8 - Individual center pages, blog index
0.7 - Material pages, static content
0.6 - Marketplace listings, individual blog posts
0.5 - Less important pages
```

### Change Frequency

```
hourly   - Marketplace (high activity)
daily    - Homepage, centers index, blog
weekly   - Individual centers, materials
monthly  - Static pages (about, faq)
yearly   - Legal pages (privacy, terms)
```

---

## Robots.txt Configuration

### Allowed Paths

```
✅ / (homepage)
✅ /about
✅ /recycling-centers
✅ /recycling-centers/*
✅ /materials
✅ /materials/*
✅ /marketplace
✅ /marketplace/listings/*
✅ /blog
✅ /blog/*
✅ /recycling-guide
✅ /faq
✅ /sustainability
✅ /for-businesses
✅ /for-recycling-centers
```

### Disallowed Paths

```
❌ /admin (all admin pages)
❌ /api/* (all API endpoints)
❌ /auth/* (authentication pages)
❌ /dashboard (user dashboard)
❌ /profile (user profiles)
❌ /manage/* (center management)
❌ /marketplace/new (create listing)
❌ /marketplace/edit/* (edit listing)
❌ /login
❌ /register
❌ /_next/* (Next.js internals)
```

### Blocked Bots

```
- AhrefsBot (SEO crawler)
- SemrushBot (SEO crawler)
- DotBot (aggressive crawler)
- MJ12bot (Majestic crawler)
- BLEXBot (aggressive crawler)
```

---

## Metadata Best Practices

### Title Tags

**Format**: `Page Title | DAVR - Deutsche Aluminium Verwertung & Recycling`

**Guidelines**:
- Keep under 60 characters
- Include target keyword
- Unique for each page
- Compelling and descriptive

**Examples**:
```
Good: "Recyclingzentrum München - Öffnungszeiten & Bewertungen | DAVR"
Bad:  "Recyclingzentrum | DAVR"
```

### Meta Descriptions

**Guidelines**:
- 150-160 characters optimal
- Include call-to-action
- Describe page content accurately
- Include target keyword naturally

**Examples**:
```
Good: "Finden Sie das beste Recyclingzentrum in München. Vergleichen Sie Öffnungszeiten, Bewertungen und akzeptierte Materialien auf DAVR."
Bad:  "Recyclingzentrum München"
```

### Keywords

**Guidelines**:
- 5-10 relevant keywords
- Include variations and synonyms
- Match user search intent
- Avoid keyword stuffing

### Open Graph Tags

**Required**:
- og:title
- og:description
- og:image (1200x630px)
- og:url
- og:type

**Example**:
```typescript
openGraph: {
  title: "Recyclingzentrum München",
  description: "Finden Sie das beste...",
  url: "https://davr.com/recycling-centers/munchen",
  type: "business.business",
  images: [{
    url: "https://davr.com/images/og-munich.jpg",
    width: 1200,
    height: 630,
  }],
}
```

### Twitter Cards

**Card Types**:
- `summary` - Default card
- `summary_large_image` - For blog posts, centers

**Example**:
```typescript
twitter: {
  card: "summary_large_image",
  title: "Recyclingzentrum München",
  description: "Finden Sie das beste...",
  images: ["https://davr.com/images/twitter-munich.jpg"],
}
```

---

## Structured Data (JSON-LD)

### Local Business (Recycling Centers)

```json
{
  "@context": "https://schema.org",
  "@type": "RecyclingCenter",
  "name": "Recyclingzentrum München",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Musterstraße 123",
    "addressLocality": "München",
    "postalCode": "80331",
    "addressCountry": "DE"
  },
  "telephone": "+49-89-1234567",
  "url": "https://davr.com/recycling-centers/munchen",
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 48.1351,
    "longitude": 11.5820
  }
}
```

### Organization

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "DAVR",
  "url": "https://davr.com",
  "logo": "https://davr.com/images/logo.png",
  "description": "Deutschlands führende Plattform...",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": ["German", "English"]
  }
}
```

### Article (Blog Posts)

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Aluminium Recycling Guide",
  "author": {
    "@type": "Person",
    "name": "John Doe"
  },
  "datePublished": "2025-01-15",
  "dateModified": "2025-01-16",
  "image": "https://davr.com/images/blog-image.jpg",
  "publisher": {
    "@type": "Organization",
    "name": "DAVR",
    "logo": {
      "@type": "ImageObject",
      "url": "https://davr.com/images/logo.png"
    }
  }
}
```

---

## Testing & Validation

### Google Search Console

1. **Add Property**: https://search.google.com/search-console
2. **Submit Sitemap**: Submit `https://yoursite.com/sitemap.xml`
3. **Monitor**:
   - Index coverage
   - Search performance
   - Mobile usability
   - Core Web Vitals

### Rich Results Test

**Tool**: https://search.google.com/test/rich-results

**Test**:
- Local business markup
- Article markup
- Organization markup

### Lighthouse SEO Audit

```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://yoursite.com --only-categories=seo --view
```

**Target Scores**:
- SEO Score: 90+
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+

### Manual Checks

```bash
# Verify sitemap
curl https://yoursite.com/sitemap.xml

# Verify robots.txt
curl https://yoursite.com/robots.txt

# Check meta tags
curl -s https://yoursite.com/recycling-centers/munchen | grep -i "meta"
```

---

## Performance Optimization

### Image Optimization

**Guidelines**:
- Use Next.js Image component
- WebP format with fallbacks
- Lazy loading for below-the-fold images
- Proper alt text for all images

```typescript
import Image from 'next/image';

<Image
  src="/images/center.jpg"
  alt="Recyclingzentrum München - Außenansicht"
  width={800}
  height={600}
  loading="lazy"
/>
```

### Page Speed

**Targets**:
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.8s
- Cumulative Layout Shift (CLS): < 0.1

**Optimizations**:
- Static page generation where possible
- Incremental Static Regeneration (ISR)
- Code splitting
- Font optimization

---

## Local SEO

### Google My Business

For recycling centers:
1. Claim Google My Business listing
2. Verify address and phone
3. Add photos and hours
4. Encourage reviews
5. Link to DAVR profile

### NAP Consistency

Ensure Name, Address, Phone consistency:
- Google My Business
- DAVR profile
- Website footer
- Social media profiles
- Local directories

---

## Content Strategy

### Target Keywords

**Primary**:
- Aluminium Recycling Deutschland
- Recyclingzentren [City]
- Aluminium Verwertung
- Schrott verkaufen

**Long-tail**:
- Wo kann ich Aluminium recyceln in [City]
- Beste Preise für Aluminium Schrott
- Recyclingzentrum [City] Öffnungszeiten

### Content Types

1. **Location Pages**: City-specific recycling guides
2. **Material Guides**: Detailed recycling information
3. **Blog Posts**: News, tips, industry updates
4. **FAQs**: Common questions with rich answers
5. **Case Studies**: Success stories

---

## Monitoring & Analytics

### Google Analytics 4

**Key Metrics**:
- Organic traffic
- Bounce rate
- Pages per session
- Conversion rate
- Top landing pages

**Setup**:
```typescript
// app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      </body>
    </html>
  );
}
```

### Search Console Insights

**Monitor**:
- Click-through rate (CTR)
- Average position
- Impressions
- Top queries
- Top pages

**Goals**:
- CTR > 2%
- Average position < 10
- Growing impressions

---

## Common Issues & Solutions

### Issue: Pages not indexed

**Solutions**:
1. Check robots.txt doesn't block page
2. Submit sitemap to Search Console
3. Request indexing manually
4. Ensure page is linked from homepage
5. Check for noindex meta tag

### Issue: Low rankings

**Solutions**:
1. Improve content quality and length
2. Add internal links
3. Optimize title and description
4. Increase page speed
5. Get quality backlinks

### Issue: Duplicate content

**Solutions**:
1. Use canonical tags
2. Implement proper redirects
3. Add noindex to search/filter pages
4. Consolidate similar pages

---

## Roadmap

### Completed ✅
- Dynamic sitemap generation
- Robots.txt configuration
- Metadata utilities
- Open Graph tags
- Twitter Cards
- JSON-LD structured data

### In Progress 🔄
- Google Search Console setup
- Analytics integration
- Rich snippets implementation

### Planned 📋
- Multilingual SEO (English)
- Video content optimization
- FAQ schema markup
- Review schema markup
- Breadcrumb schema
- Advanced local SEO

---

## Resources

### Tools
- [Google Search Console](https://search.google.com/search-console)
- [Google Analytics](https://analytics.google.com)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Schema.org](https://schema.org)
- [Rich Results Test](https://search.google.com/test/rich-results)

### Documentation
- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Schema.org Documentation](https://schema.org/docs/documents.html)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-16
**Author:** Claude Code
**Status:** ✅ Implemented
