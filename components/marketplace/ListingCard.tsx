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
    id?: string; // Add user ID for linking to profile
  };
  // Add more fields for richer display
  type?: string; // BUY/SELL
  quantity?: number | null;
  unit?: string | null;
  seller?: { // More detailed seller info
    id: string;
    name: string | null;
    rating?: number | null; // Average rating
    reviewCount?: number | null; // Number of reviews
    joinedSince?: Date | null; // When seller joined
    totalListings?: number | null; // Number of active listings
    responseTime?: string | null; // Average response time
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
    created_at,
    seller
  } = listing;

  const timeAgo = formatDistanceToNowStrict(new Date(created_at), { addSuffix: true, locale: de });
  const categoryStyle = getCategoryStyle(category);
  const linkHref = slug ? `/marketplace/${slug}` : `/marketplace/listings/${id}`;
  const priceDisplay = displayPrice(approximate_min_price, approximate_max_price);

  // Format seller rating for display
  const displayRating = seller?.rating ? (
    <div className="flex items-center gap-1">
      <span className="text-yellow-500">★</span>
      <span className="text-sm font-medium">{seller.rating?.toFixed(1)}</span>
      {seller.reviewCount !== undefined && (
        <span className="text-xs text-muted-foreground">({seller.reviewCount})</span>
      )}
    </div>
  ) : null;

  // Format seller join date
  const sellerSince = seller?.joinedSince ? `Seit ${seller.joinedSince.getFullYear()}` : null;

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
        
        {/* Seller info */}
        {seller && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="inline-block h-6 w-6 rounded-full bg-gray-300 border border-white" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {seller.name || 'Unbekannter Verkäufer'}
              </span>
            </div>
            {displayRating && <div className="flex items-center">{displayRating}</div>}
          </div>
        )}

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

      <CardFooter className="p-4 bg-muted/30 border-t border-border flex flex-col items-start gap-2">
        <div className="flex justify-between w-full items-center">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          <Link href={linkHref} className="flex items-center gap-1 text-primary hover:underline text-sm">
            Details <ExternalLink size={14} />
          </Link>
        </div>
        
        {sellerSince && (
          <div className="flex justify-between w-full items-center text-xs text-muted-foreground">
            <span>{sellerSince}</span>
            {seller?.totalListings !== undefined && (
              <span>{seller.totalListings} Aktive Angebote</span>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ListingCard;