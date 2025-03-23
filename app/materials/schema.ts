// Schema for the materials page
export function generateMaterialsListSchema(baseUrl: string, materials: Array<{
  id: string;
  name: string;
  description: string;
  category: string;
  recyclable: boolean;
  marketValue: string;
}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: materials.map((material, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        '@id': `${baseUrl}/materials/${material.id}`,
        name: material.name,
        description: material.description,
        category: material.category,
        additionalProperty: [
          {
            '@type': 'PropertyValue',
            name: 'recyclable',
            value: material.recyclable
          },
          {
            '@type': 'PropertyValue',
            name: 'marketValue',
            value: material.marketValue
          }
        ]
      }
    }))
  };
}

// Schema for a single material page
export function generateMaterialSchema(material: {
  id: string;
  name: string;
  description: string;
  category: string;
  recyclable: boolean;
  marketValue: string;
}, baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${baseUrl}/materials/${material.id}`,
    name: material.name,
    description: material.description,
    category: material.category,
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'recyclable',
        value: material.recyclable
      },
      {
        '@type': 'PropertyValue',
        name: 'marketValue',
        value: material.marketValue
      }
    ]
  };
} 