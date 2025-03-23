// Schema for the search page
import { Material, Center } from '@/types/search';

export function generateSearchSchema(query: string, materials: Material[], centers: Center[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: materials.map((material, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: material.name,
          description: material.description,
          category: material.category
        }
      }))
    },
    about: {
      '@type': 'Thing',
      name: `Suchergebnisse für "${query}"`,
      description: `${materials.length} Materialien und ${centers.length} Recyclinghöfe gefunden`
    }
  };
}

export function generateCentersSchema(centers: Center[], baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: centers.map((center, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'LocalBusiness',
        '@id': `${baseUrl}/recycling-centers/${center.id}`,
        name: center.name,
        address: {
          '@type': 'PostalAddress',
          addressLocality: center.city,
          postalCode: center.postalCode
        },
        ...(center.distance && {
          additionalProperty: {
            '@type': 'PropertyValue',
            name: 'distance',
            value: `${center.distance.toFixed(1)} km`
          }
        })
      }
    }))
  };
} 