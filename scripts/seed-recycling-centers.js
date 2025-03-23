// This script creates sample recycling centers for testing purposes
// Using ES modules
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const { Client } = pg;

// Database connection string
const DB_CONNECTION_STRING = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5435/postgres';

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
  const client = new Client({
    connectionString: DB_CONNECTION_STRING
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // First, check if recycling centers already exist
    const checkResult = await client.query('SELECT COUNT(*) FROM recycling_centers');
    const count = parseInt(checkResult.rows[0].count);

    if (count > 0) {
      console.log(`Database already has ${count} recycling centers. Use the --force flag to reseed.`);
      if (!process.argv.includes('--force')) {
        console.log('Exiting without seeding. Use --force to replace existing data.');
        await client.end();
        return;
      }
      console.log('Force flag detected. Clearing existing recycling centers and their offers...');
      await client.query('DELETE FROM recycling_center_offers');
      await client.query('DELETE FROM recycling_centers');
    }

    console.log('Seeding recycling centers...');

    // Get all materials from the database
    const materialsResult = await client.query('SELECT id, name FROM materials WHERE parent_id IS NULL');
    const dbMaterials = materialsResult.rows;
    
    if (dbMaterials.length === 0) {
      console.log('No materials found in the database. Please run seed-materials.js first.');
      return;
    }

    // Create 50 sample recycling centers
    for (let i = 0; i < 50; i++) {
      const city = getRandomItem(cities);
      const centerName = `${getRandomItem(centerNames)} ${city.name}`;
      const slug = generateSlug(centerName);
      const streetNumber = getRandomInt(1, 100);
      const address = `${getRandomItem(streetNames)} ${streetNumber}`;
      const coordinates = getRandomGermanCoordinates();
      
      // Insert a recycling center
      const centerQuery = `
        INSERT INTO recycling_centers (
          name, slug, address, city, postal_code, state, country,
          phone, email, website, description, latitude, longitude,
          is_verified, verification_status, rating, rating_count
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id
      `;
      
      const phone = `+49 ${getRandomInt(100, 999)} ${getRandomInt(1000000, 9999999)}`;
      const email = `info@${slug.replace(/-/g, '')}.de`;
      const website = `https://www.${slug.replace(/-/g, '')}.de`;
      const description = `${centerName} ist ein modernes Recyclingzentrum in ${city.name}, das verschiedene Materialien recycelt und ankauft.`;
      const isVerified = Math.random() > 0.3; // 70% chance of being verified
      const verificationStatus = isVerified ? 'verified' : 'pending';
      const rating = (Math.random() * 3 + 2).toFixed(2); // Random rating between 2.00 and 5.00
      const ratingCount = getRandomInt(5, 150);
      
      const centerValues = [
        centerName,
        slug,
        address,
        city.name,
        city.postalCode,
        city.state,
        'Germany',
        phone,
        email,
        website,
        description,
        coordinates.latitude,
        coordinates.longitude,
        isVerified,
        verificationStatus,
        rating,
        ratingCount
      ];
      
      const centerResult = await client.query(centerQuery, centerValues);
      const centerId = centerResult.rows[0].id;
      
      console.log(`Added recycling center: ${centerName} (ID: ${centerId})`);
      
      // Create offers for this center (randomly select 3-8 materials)
      const numMaterials = getRandomInt(3, 8);
      const selectedMaterials = [...dbMaterials]
        .sort(() => 0.5 - Math.random())
        .slice(0, numMaterials);
      
      for (const material of selectedMaterials) {
        const price = (Math.random() * 2).toFixed(2); // Random price between 0.00 and 2.00
        const minQuantity = getRandomInt(1, 10);
        const isActive = Math.random() > 0.1; // 90% chance of being active
        
        const offerQuery = `
          INSERT INTO recycling_center_offers (
            recycling_center_id, material_id, price, min_quantity, notes, is_active
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        
        const offerValues = [
          centerId,
          material.id,
          price,
          minQuantity,
          `Wir kaufen ${material.name} zu einem guten Preis.`,
          isActive
        ];
        
        await client.query(offerQuery, offerValues);
        console.log(`  Added offer for ${material.name} at ${price}€/kg`);
      }
    }

    console.log('Recycling centers seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding recycling centers:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedRecyclingCenters().catch(console.error); 