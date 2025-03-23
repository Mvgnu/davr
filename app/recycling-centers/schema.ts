import { RecyclingCenter } from '@/types/recycling';

// Function to generate structured data for the recycling centers page
export function generateRecyclingCentersSchema(centers: RecyclingCenter[], baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: centers.map((center, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'LocalBusiness',
        '@id': `${baseUrl}/recycling-centers/${center._id}`,
        name: center.name,
        description: `Recyclinghof in ${center.city}, ${center.state || ''}`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: center.city,
          postalCode: center.postalCode,
          addressRegion: center.state
        },
        telephone: center.phone,
        email: center.email,
        url: center.website,
        ...(center.rating && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: center.rating.average,
            reviewCount: center.rating.count
          }
        })
      }
    }))
  };
}

// Function to generate structured data for a single recycling center page
export function generateRecyclingCenterSchema(center: RecyclingCenter, baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${baseUrl}/recycling-centers/${center._id}`,
    name: center.name,
    description: `Recyclinghof in ${center.city}, ${center.state || ''}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: center.city,
      postalCode: center.postalCode,
      addressRegion: center.state
    },
    telephone: center.phone,
    email: center.email,
    url: center.website,
    ...(center.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: center.rating.average,
        reviewCount: center.rating.count
      }
    })
  };
} 