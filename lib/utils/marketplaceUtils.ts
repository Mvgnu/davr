import { IMarketplaceListing } from '@/lib/models/MarketplaceListing';
import User from '@/lib/models/User';
import RecyclingCenter from '@/lib/models/RecyclingCenter';
import { Types } from 'mongoose';
import { formatDate as formatDateUtil } from '@/lib/utils';

/**
 * Formats a price with Euro symbol and correct decimal places
 */
export function formatPrice(price: number): string {
  return `${price.toFixed(2).replace('.', ',')} €`;
}

/**
 * Gets the main image URL for a listing
 */
export function getMainImage(listing: IMarketplaceListing | null): string {
  if (!listing || !listing.images || listing.images.length === 0) {
    return '/images/placeholder-marketplace.svg';
  }
  return listing.images[0];
}

/**
 * Gets all image URLs for a listing
 */
export function getAllImages(listing: IMarketplaceListing | null): string[] {
  if (!listing || !listing.images || listing.images.length === 0) {
    return ['/images/placeholder-marketplace.svg'];
  }
  return listing.images;
}

/**
 * Translate listing status for display
 */
export function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'aktiv': 'Aktiv',
    'verkauft': 'Verkauft',
    'abgelaufen': 'Abgelaufen',
    'archiviert': 'Archiviert',
    'geprüft': 'Geprüft',
    'pending': 'Ausstehend',
    'completed': 'Abgeschlossen',
    'cancelled': 'Storniert'
  };
  
  return statusMap[status] || status;
}

/**
 * Get the color class for a status badge
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'aktiv': 'bg-green-100 text-green-800',
    'verkauft': 'bg-blue-100 text-blue-800',
    'abgelaufen': 'bg-orange-100 text-orange-800',
    'archiviert': 'bg-gray-100 text-gray-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800'
  };
  
  return colorMap[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Enhance a listing with seller information
 */
export async function enhanceListingWithSellerInfo(
  listing: IMarketplaceListing & { _id: Types.ObjectId }
): Promise<any> {
  try {
    // Convert to plain object
    const enhancedListing = {
      ...(typeof listing.toObject === 'function' ? listing.toObject() : listing),
      _id: listing._id.toString(),
      sellerId: listing.sellerId.toString(),
    };
    
    // Get seller information
    const seller = await User.findById(listing.sellerId).lean();
    
    if (seller) {
      enhancedListing.seller = {
        _id: seller._id.toString(),
        name: seller.name,
        email: seller.email,
        profileImage: seller.profileImage || '' // Handle potentially missing profileImage
      };
    }
    
    // Format dates as ISO strings
    if (enhancedListing.createdAt) {
      enhancedListing.createdAt = new Date(enhancedListing.createdAt).toISOString();
    }
    if (enhancedListing.updatedAt) {
      enhancedListing.updatedAt = new Date(enhancedListing.updatedAt).toISOString();
    }
    if (enhancedListing.expiresAt) {
      enhancedListing.expiresAt = new Date(enhancedListing.expiresAt).toISOString();
    }
    
    // Process bids if they exist
    if (enhancedListing.bids && enhancedListing.bids.length > 0) {
      enhancedListing.bids = enhancedListing.bids.map((bid: any) => ({
        ...bid,
        _id: bid._id.toString(),
        recyclingCenterId: bid.recyclingCenterId.toString(),
        createdAt: new Date(bid.createdAt).toISOString(),
        updatedAt: new Date(bid.updatedAt).toISOString()
      }));
      
      // Add count of bids
      enhancedListing.bidCount = enhancedListing.bids.length;
      
      // Add highest bid
      const sortedBids = [...enhancedListing.bids].sort((a, b) => b.amount - a.amount);
      enhancedListing.highestBid = sortedBids[0]?.amount || 0;
    } else {
      enhancedListing.bidCount = 0;
      enhancedListing.highestBid = 0;
    }
    
    return enhancedListing;
  } catch (error) {
    console.error('Error enhancing listing:', error);
    return listing;
  }
}

/**
 * Check if a listing is expired
 */
export function isListingExpired(listing: IMarketplaceListing): boolean {
  if (!listing.expiresAt) return false;
  
  const expiryDate = new Date(listing.expiresAt);
  const now = new Date();
  
  return expiryDate < now;
}

/**
 * Format the time difference for display (e.g., "vor 2 Tagen")
 */
export function formatTimeAgo(date: Date | string | number): string {
  const dateObj = new Date(date);
  const now = new Date();
  
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) {
    return 'gerade eben';
  } else if (diffMin < 60) {
    return `vor ${diffMin} ${diffMin === 1 ? 'Minute' : 'Minuten'}`;
  } else if (diffHour < 24) {
    return `vor ${diffHour} ${diffHour === 1 ? 'Stunde' : 'Stunden'}`;
  } else if (diffDay < 30) {
    return `vor ${diffDay} ${diffDay === 1 ? 'Tag' : 'Tagen'}`;
  } else {
    return formatDateUtil(date);
  }
}

/**
 * Generate the placeholder image for the marketplace
 */
export function getPlaceholderImage(): string {
  return '/images/placeholder-marketplace.svg';
} 