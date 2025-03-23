// Schema for marketplace listings
export function generateMarketplaceSchema(baseUrl: string, listings: Array<{
  id: string;
  title: string;
  price: number;
  unit: string;
  location: string;
  image?: string;
  seller: {
    name: string;
    rating: number;
    isVerified: boolean;
  };
  isNew: boolean;
  createdAt: Date;
}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: listings.map((listing, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        '@id': `${baseUrl}/marketplace/listings/${listing.id}`,
        name: listing.title,
        image: listing.image || `${baseUrl}/images/placeholder.png`,
        offers: {
          '@type': 'Offer',
          price: listing.price,
          priceCurrency: 'EUR',
          priceValidUntil: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
          availability: 'https://schema.org/InStock',
          seller: {
            '@type': 'Organization',
            name: listing.seller.name
          }
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: listing.seller.rating,
          ratingCount: 1,
          bestRating: 5,
          worstRating: 1
        }
      }
    }))
  };
}

// Schema for material prices
export function generateMaterialPricesSchema(baseUrl: string, prices: Array<{
  name: string;
  price: number;
  trend: 'up' | 'down' | 'stable';
}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: prices.map((material, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: material.name,
        offers: {
          '@type': 'Offer',
          price: material.price,
          priceCurrency: 'EUR',
          priceValidUntil: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0]
        }
      }
    }))
  };
} 