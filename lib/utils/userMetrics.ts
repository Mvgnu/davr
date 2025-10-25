import { prisma } from '@/lib/db/prisma';

/**
 * Get seller metrics for a user
 */
export async function getUserSellerMetrics(userId: string) {
  try {
    const [totalListings, activeListings, totalListingsCount] = await prisma.$transaction([
      // Total listings created by user
      prisma.marketplaceListing.count({
        where: { seller_id: userId }
      }),
      // Active listings
      prisma.marketplaceListing.count({
        where: { 
          seller_id: userId,
          status: 'ACTIVE'
        }
      }),
      // Total listings count (for reference)
      prisma.marketplaceListing.count()
    ]);

    // Calculate success rate or other metrics
    const successRate = totalListings > 0 
      ? Math.round((activeListings / totalListings) * 100) 
      : 0;

    // Since we don't have reviews yet, we'll use listings as a proxy for activity
    // In the future, we could add actual ratings once we implement user review system
    const rating = 0; // Placeholder - would come from user reviews
    const reviewCount = 0; // Placeholder - would come from user reviews

    return {
      totalListings,
      activeListings,
      successRate,
      rating,
      reviewCount,
      joinedSince: null // Would come from user creation date
    };
  } catch (error) {
    console.error('Error fetching user seller metrics:', error);
    return {
      totalListings: 0,
      activeListings: 0,
      successRate: 0,
      rating: 0,
      reviewCount: 0,
      joinedSince: null
    };
  }
}