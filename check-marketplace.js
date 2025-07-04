// Script to check marketplace listings in the database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check marketplace listings
    const listingCount = await prisma.marketplaceListing.count();
    console.log(`Marketplace listings: ${listingCount}`);
    
    // Check if there are any users to associate with listings
    const userCount = await prisma.user.count();
    console.log(`Users: ${userCount}`);
    
    // See if there are any recycling center offers
    const offerCount = await prisma.recyclingCenterOffer.count();
    console.log(`Recycling Center Offers: ${offerCount}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error checking marketplace listings:');
    console.error(error);
    return { success: false, error };
  } finally {
    await prisma.$disconnect();
  }
}

main(); 