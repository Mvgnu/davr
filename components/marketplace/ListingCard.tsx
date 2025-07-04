'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Package, MapPin, ExternalLink, CircleDollarSign } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { de } from 'date-fns/locale';

// Interface for the Marketplace Listing data
// Note: Adjusted to match typical data structures and component needs
interface MarketplaceListing {
  id: string;
  slug?: string; // Include slug for linking
  title: string;
  description?: string | null; // Make description optional and nullable
  approximate_min_price?: number | null;
  approximate_max_price?: number | null;
  image_url?: string | null;
  status?: string; // e.g., 'available', 'sold'
  category?: string; // e.g., 'plastic', 'metal'
  location?: string | null; // Make location nullable to match UserListing
  created_at: string; // ISO date string
  user?: { // Include user info if needed
    name?: string;
  };
}

interface ListingCardProps {
  listing: MarketplaceListing;
  className?: string;
}

// Utility to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
};

// Helper to display price range
const displayPrice = (min?: number | null, max?: number | null): string => {
    if (min != null && max != null && min !== max) {
        return `${formatCurrency(min)} - ${formatCurrency(max)}`;
    } else if (min != null) {
        return formatCurrency(min);
    } else if (max != null) {
        return formatCurrency(max); // Display max if only max is present
    } else {
        return 'Preis n.a.'; // Price not available
    }
};

// Utility to get a category-specific color/icon (example)
const getCategoryStyle = (category?: string) => {
  switch (category?.toLowerCase()) {
    case 'metal': return { color: 'bg-blue-100 text-blue-800', icon: <Package size={16} /> };
    case 'plastic': return { color: 'bg-green-100 text-green-800', icon: <Package size={16} /> };
    case 'paper': return { color: 'bg-yellow-100 text-yellow-800', icon: <Package size={16} /> };
    default: return { color: 'bg-gray-100 text-gray-800', icon: <Package size={16} /> };
  }
};

const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  className = ''
}) => {
  const {
    id,
    slug,
    title,
    description,
    approximate_min_price,
    approximate_max_price,
    image_url,
    status = 'available', // Default status
    category,
    location,
    created_at
  } = listing;

  const timeAgo = formatDistanceToNowStrict(new Date(created_at), { addSuffix: true, locale: de });
  const categoryStyle = getCategoryStyle(category);
  const linkHref = slug ? `/marketplace/${slug}` : `/marketplace/listings/${id}`; // Fix: use listings (plural)
  const priceDisplay = displayPrice(approximate_min_price, approximate_max_price);

  return (
    <Card className={`overflow-hidden flex flex-col h-full border border-border hover:shadow-lg transition-shadow duration-200 ${className}`}>
      <CardHeader className="p-0 relative">
        <Link href={linkHref} className="block aspect-video relative">
          {image_url ? (
            <Image
              src={image_url}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              style={{ objectFit: 'cover' }}
              className="transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/70 flex items-center justify-center">
              <Package className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
        </Link>
        
        {/* Badges positioned over the image */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <Badge variant="secondary" className={`${categoryStyle.color} flex items-center gap-1`}>
            {categoryStyle.icon}
            {category || 'Material'}
          </Badge>
          {status && <Badge variant={status === 'available' ? 'default' : 'destructive'} className="capitalize">{status}</Badge>}
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-grow flex flex-col">
        <CardTitle className="text-lg font-semibold mb-1 leading-tight">
          <Link href={linkHref} className="hover:text-primary transition-colors duration-200">
            {title}
          </Link>
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-3 flex-grow">
          {description ? (description.length > 100 ? `${description.substring(0, 100)}...` : description) : 'Keine Beschreibung verfügbar'}
        </CardDescription>

        {/* Price and Location */}
        <div className="flex flex-wrap justify-between items-center text-sm mb-3 gap-2">
          <div className="flex items-center gap-1 font-medium text-lg text-primary">
            <CircleDollarSign size={18} />
            {priceDisplay}
          </div>
          {location && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin size={16} />
              <span className="truncate max-w-[120px]">{location}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 bg-muted/30 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
        <span>{timeAgo}</span>
        <Link href={linkHref} className="flex items-center gap-1 text-primary hover:underline">
          Details <ExternalLink size={14} />
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ListingCard;