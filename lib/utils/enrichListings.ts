import { MarketplaceListing } from '@prisma/client';
import { getUserSellerMetrics } from '@/lib/utils/userMetrics';
import { calculateUserRating } from '@/lib/utils/userRating';

// Type for enriched listing with seller metrics
export interface EnrichedMarketplaceListing extends Omit<MarketplaceListing, 'seller'> {
  seller: {
    id: string;
    name: string | null;
    rating?: number | null;
    reviewCount?: number | null;
    joinedSince?: Date | null;
    totalListings?: number | null;
    activeListings?: number | null;
    responseTime?: string | null;
  };
}

/**
 * Enrich listings with seller metrics
 */
export async function enrichListingsWithSellerMetrics(
  listings: MarketplaceListing[]
): Promise<EnrichedMarketplaceListing[]> {
  // For efficiency, we'll process all sellers in batches
  // This is especially important when we have a proper rating system
  const enrichedListings = await Promise.all(listings.map(async (listing) => {
    // Get seller rating and metrics
    const [ratingInfo, sellerMetrics] = await Promise.all([
      calculateUserRating(listing.seller_id),
      getUserSellerMetrics(listing.seller_id)
    ]);
    
    return {
      ...listing,
      seller: {
        id: listing.seller_id,
        name: listing.seller?.name || null,
        rating: ratingInfo.averageRating || null,
        reviewCount: ratingInfo.totalReviews || null,
        joinedSince: sellerMetrics.joinedSince || null,
        totalListings: sellerMetrics.totalListings || null,
        activeListings: sellerMetrics.activeListings || null,
        responseTime: sellerMetrics.successRate > 80 ? 'Schnell' : sellerMetrics.successRate > 50 ? 'Mittel' : 'Langsam' || null
      }
    };
  }));
  
  return enrichedListings;
}