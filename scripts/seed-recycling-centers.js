// This script creates sample recycling centers for testing purposes
// Using ES modules
import { PrismaClient, Prisma } from '@prisma/client';
import slugify from 'slugify';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Define materials for recycling centers
const materials = [
  'Aluminium', 'PET', 'HDPE', 'Papier', 'Glas', 'Elektroschrott', 'Stahl', 'Kupfer', 'Textilien'
];

// Define some German cities with their states and postal codes
const cities = [
  { name: 'Berlin', state: 'Berlin', postalCode: '10115' },
  { name: 'München', state: 'Bayern', postalCode: '80331' },
  { name: 'Hamburg', state: 'Hamburg', postalCode: '20095' },
  { name: 'Köln', state: 'Nordrhein-Westfalen', postalCode: '50667' },
  { name: 'Frankfurt', state: 'Hessen', postalCode: '60306' },
  { name: 'Stuttgart', state: 'Baden-Württemberg', postalCode: '70173' },
  { name: 'Düsseldorf', state: 'Nordrhein-Westfalen', postalCode: '40213' },
  { name: 'Leipzig', state: 'Sachsen', postalCode: '04109' },
  { name: 'Dortmund', state: 'Nordrhein-Westfalen', postalCode: '44135' },
  { name: 'Essen', state: 'Nordrhein-Westfalen', postalCode: '45127' }
];

// List of recycling center names
const centerNames = [
  'Wertstoffhof',
  'Recyclingzentrum',
  'Entsorgungszentrum',
  'Wertstoffsammelstelle',
  'Recycling-Depot',
  'Recycling-Station',
  'Altstoffsammelzentrum',
  'Abfallwirtschaftszentrum',
  'Upcycling-Center',
  'Grüner Punkt Recycling'
];

// List of street names
const streetNames = [
  'Hauptstraße',
  'Recyclingweg',
  'Industriestraße',
  'Wertstoffalle',
  'Müllergasse',
  'Entsorgungsplatz',
  'Containerweg',
  'Umweltstraße',
  'Nachhaltigkeit-Allee',
  'Kreislaufwirtschaftsplatz'
];

// Generate a random number between min and max (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a random item from an array
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate random coordinates in Germany
function getRandomGermanCoordinates() {
  // Germany latitude range: approximately 47.3° to 55.1°
  // Germany longitude range: approximately 5.9° to 15.0°
  const lat = 47.3 + (Math.random() * (55.1 - 47.3));
  const lng = 5.9 + (Math.random() * (15.0 - 5.9));
  return { latitude: lat, longitude: lng };
}

// Function to generate a slug from the name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

// Function to seed recycling centers
async function seedRecyclingCenters() {
  console.log('Seeding recycling centers using Prisma Client...');

  // Check if centers exist (using Prisma)
  const count = await prisma.recyclingCenter.count();

  if (count > 0) {
    console.log(`Database already has ${count} recycling centers.`);
    if (!process.argv.includes('--force')) {
      console.log('Exiting without seeding. Use --force to replace existing data.');
      return; // Exit if not forcing
    }
    console.log('Force flag detected. Clearing existing recycling centers and their offers...');
    // Use Prisma transactions for safe deletion
    await prisma.$transaction([
      prisma.recyclingCenterOffer.deleteMany(), // Delete offers first due to foreign key
      prisma.recyclingCenter.deleteMany(),
    ]);
    console.log('Existing data cleared.');
  }

  // Get all materials from the database using Prisma
  const dbMaterials = await prisma.material.findMany({
    // Select only leaf nodes (materials without children) as offerable items
    where: { children: { none: {} } }, 
    select: { id: true, name: true }
  });

  if (dbMaterials.length === 0) {
    console.log('No suitable materials (leaf nodes) found in the database. Please run seed-materials.js first.');
    return;
  }

  console.log(`Found ${dbMaterials.length} offerable materials.`);

  // Create 50 sample recycling centers
  for (let i = 0; i < 50; i++) {
    const city = getRandomItem(cities);
    const centerName = `${getRandomItem(centerNames)} ${city.name}`;
    // Append index to ensure unique slug in case of name collision
    const slug = `${generateSlug(centerName)}-${i}`;
    const streetNumber = getRandomInt(1, 100);
    const address = `${getRandomItem(streetNames)} ${streetNumber}`;
    const coordinates = getRandomGermanCoordinates();
    const phone = `+49 ${getRandomInt(100, 999)} ${getRandomInt(1000000, 9999999)}`;
    const email = `info@${slug.replace(/-/g, '')}.de`;
    const website = `https://www.${slug.replace(/-/g, '')}.de`;
    const description = `${centerName} ist ein modernes Recyclingzentrum in ${city.name}, das verschiedene Materialien recycelt und ankauft.`;
    // Removed fields not present in the latest schema.prisma
    // const isVerified = Math.random() > 0.3;
    // const verificationStatus = isVerified ? 'verified' : 'pending';
    // const rating = (Math.random() * 3 + 2).toFixed(2);
    // const ratingCount = getRandomInt(5, 150);

    // Create center using Prisma
    const newCenter = await prisma.recyclingCenter.create({
      data: {
        name: centerName,
        slug: slug,
        address_street: address,
        city: city.name,
        postal_code: city.postalCode,
        // state: city.state, // Field not in schema
        // country: 'Germany', // Field not in schema
        phone_number: phone,
        // email: email, // Field not in schema
        website: website,
        // description: description, // Field not in schema
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        // Add owner relation if needed, e.g., link to an admin user ID
        // owner_id: 'some_admin_user_id' 
        // is_verified: isVerified, // Field not in schema
        // verification_status: verificationStatus, // Field not in schema
        // rating: parseFloat(rating), // Field not in schema
        // rating_count: ratingCount, // Field not in schema
      },
    });
    console.log(`Added recycling center: ${newCenter.name} (ID: ${newCenter.id})`);

    // Create offers for this center (randomly select 3-8 materials)
    const numMaterials = getRandomInt(3, Math.min(8, dbMaterials.length)); // Ensure we don't select more than available
    const selectedMaterials = [...dbMaterials]
      .sort(() => 0.5 - Math.random())
      .slice(0, numMaterials);

    for (const material of selectedMaterials) {
      const price = parseFloat((Math.random() * 2).toFixed(2)); // Random price between 0.00 and 2.00
      const unit = 'kg'; // Assume kg for now
      // const minQuantity = getRandomInt(1, 10);
      // const isActive = Math.random() > 0.1; // 90% chance of being active

      await prisma.recyclingCenterOffer.create({
        data: {
          recycling_center_id: newCenter.id,
          material_id: material.id,
          price_per_unit: price,
          unit: unit,
          notes: `Wir kaufen ${material.name} zu einem guten Preis.`,
          // min_quantity: minQuantity, // Field not in schema
          // is_active: isActive, // Field not in schema
        },
      });
      console.log(`  Added offer for ${material.name} at ${price}€/${unit}`);
    }
  }

  console.log('Recycling centers seeding completed successfully!');
}

async function main() {
  try {
    await seedRecyclingCenters();
  } catch (error) {
    console.error('Error seeding recycling centers:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 