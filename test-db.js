// Simple script to test database connection
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Test connection by getting counts
    const userCount = await prisma.user.count();
    const materialCount = await prisma.material.count();
    const recyclingCenterCount = await prisma.recyclingCenter.count();
    
    console.log('Successfully connected to database!');
    console.log(`Users: ${userCount}`);
    console.log(`Materials: ${materialCount}`);
    console.log(`Recycling Centers: ${recyclingCenterCount}`);
    
    return { success: true, counts: { users: userCount, materials: materialCount, recyclingCenters: recyclingCenterCount } };
  } catch (error) {
    console.error('Failed to connect to the database:');
    console.error(error);
    return { success: false, error };
  } finally {
    await prisma.$disconnect();
  }
}

main(); 