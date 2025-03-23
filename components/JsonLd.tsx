import React from 'react';

interface JsonLdProps {
  data: Record<string, any>;
}

/**
 * Component for adding JSON-LD structured data to pages
 * This helps search engines better understand the content of your pages
 * 
 * @param data - The structured data object to be serialized
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data)
      }}
    />
  );
} 