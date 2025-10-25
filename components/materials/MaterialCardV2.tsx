"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

interface MaterialCardV2Props {
  name: string;
  slug: string;
  imageUrl?: string | null;
  description?: string | null;
}

export default function MaterialCardV2({ name, slug, imageUrl, description }: MaterialCardV2Props) {
  const placeholderImage = '/images/placeholder-marketplace.svg';
  return (
    <Link href={`/materials/${slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden border-border/70 hover:shadow-md transition-shadow">
        <div className="aspect-[4/3] relative bg-muted">
          <Image
            src={imageUrl || placeholderImage}
            alt={name}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        </div>
        <CardContent className="p-4">
          <h3 className="text-base font-semibold mb-1 line-clamp-1 group-hover:text-primary transition-colors">{name}</h3>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}


