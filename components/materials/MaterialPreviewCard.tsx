'use client'; // Client component for potential hover effects

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ArrowRight, Package } from 'lucide-react';

interface MaterialPreviewCardProps {
  material: {
    name: string;
    slug: string;
    image_url: string | null;
    description?: string | null; // Optional description
  };
}

const MaterialPreviewCard: React.FC<MaterialPreviewCardProps> = ({ material }) => {
  const { name, slug, image_url, description } = material;
  const placeholderImage = '/images/placeholder-marketplace.svg'; // Use existing SVG placeholder
  const linkHref = `/materials/${slug}`;

  return (
    <Link href={linkHref} className="group block h-full">
      <Card className="h-full flex flex-col overflow-hidden border-border/80 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 ease-in-out">
        <CardHeader className="p-0 relative">
          <div className="aspect-[4/3] relative w-full bg-muted overflow-hidden">
            <Image
              src={image_url || placeholderImage}
              alt={name}
              fill
              className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
            {/* Optional: Add overlay if needed */}
            {/* <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div> */}
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-200 mb-1.5 line-clamp-2">
            {name}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0 mt-auto">
          <div className="text-sm text-primary font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Mehr erfahren <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default MaterialPreviewCard; 