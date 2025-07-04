// Database seeding script
import * as dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize environment variables
dotenv.config();

// Get file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get database connection from environment variable
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set!');
  process.exit(1);
}

// Create a new Pool instance
const { Pool } = pg;
const pool = new Pool({
  connectionString,
});

// Function to check if tables exist
async function checkTables() {
  try {
    console.log('Checking if tables exist...');
    
    const result = await pool.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    
    const tableCount = parseInt(result.rows[0].count);
    console.log(`Found ${tableCount} tables in the database.`);
    
    // If no tables, run the schema creation script
    if (tableCount === 0) {
      console.log('No tables found. Creating schema...');
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      await pool.query(schemaSql);
      console.log('Schema created successfully.');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking tables:', error.message);
    throw error;
  }
}

// Function to check if data exists
async function checkData() {
  try {
    console.log('Checking if data exists...');
    
    // Check users
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const usersCount = parseInt(usersResult.rows[0].count);
    console.log(`Found ${usersCount} users.`);
    
    // Check materials
    const materialsResult = await pool.query('SELECT COUNT(*) as count FROM materials');
    const materialsCount = parseInt(materialsResult.rows[0].count);
    console.log(`Found ${materialsCount} materials.`);
    
    // Check recycling centers
    const centersResult = await pool.query('SELECT COUNT(*) as count FROM recycling_centers');
    const centersCount = parseInt(centersResult.rows[0].count);
    console.log(`Found ${centersCount} recycling centers.`);
    
    return {
      needsUsers: usersCount === 0,
      needsMaterials: materialsCount === 0,
      needsCenters: centersCount === 0
    };
  } catch (error) {
    console.error('Error checking data:', error.message);
    throw error;
  }
}

// Function to seed users
async function seedUsers() {
  try {
    console.log('Seeding users...');
    
    await pool.query(`
      INSERT INTO users (name, email, password, role, email_verified)
      VALUES 
        ('Admin User', 'admin@example.com', 'password123', 'admin', NOW()),
        ('Regular User', 'user@example.com', 'password123', 'user', NOW())
      ON CONFLICT (email) DO NOTHING
    `);
    
    console.log('Users seeded successfully.');
  } catch (error) {
    console.error('Error seeding users:', error.message);
    throw error;
  }
}

// Function to seed materials
async function seedMaterials() {
  try {
    console.log('Seeding materials...');
    
    // Sample materials data
    const materialsSql = `
      INSERT INTO materials (name, description, category, recyclable, market_value_level, approximate_min_price, approximate_max_price)
      VALUES
        ('Aluminum Cans', 'Used beverage cans made of aluminum', 'Metals', true, 'medium', 1.20, 1.90),
        ('Copper Wires', 'Electrical wiring made of copper', 'Metals', true, 'high', 4.50, 6.00),
        ('Steel Scrap', 'Metal scrap primarily made of steel', 'Metals', true, 'medium', 0.30, 0.60),
        ('Newspapers', 'Old newspapers and print media', 'Paper & Cardboard', true, 'low', 0.10, 0.20),
        ('Cardboard Boxes', 'Corrugated cardboard packaging', 'Paper & Cardboard', true, 'low', 0.05, 0.15),
        ('PET Bottles', 'Plastic bottles made of PET', 'Plastics', true, 'low', 0.25, 0.40),
        ('HDPE Containers', 'High-density polyethylene containers', 'Plastics', true, 'low', 0.30, 0.45),
        ('Smartphones', 'Used or damaged smartphones', 'Electronics', true, 'high', 30.00, 200.00),
        ('Computers', 'Desktop and laptop computers', 'Electronics', true, 'high', 50.00, 300.00),
        ('Batteries', 'Various types of batteries', 'Electronics', true, 'medium', 0.50, 3.00),
        ('Clear Glass', 'Clear glass bottles and jars', 'Glass', true, 'low', 0.05, 0.10),
        ('Colored Glass', 'Colored glass bottles and containers', 'Glass', true, 'low', 0.03, 0.08),
        ('Tires', 'Used vehicle tires', 'Automotive', true, 'low', 2.00, 5.00),
        ('Motor Oil', 'Used motor oil', 'Automotive', true, 'medium', 0.20, 0.40),
        ('Wood Pallets', 'Wooden shipping pallets', 'Wood', true, 'low', 3.00, 7.00),
        ('Untreated Lumber', 'Clean, untreated wood scraps', 'Wood', true, 'low', 0.10, 0.30),
        ('Clothing', 'Used clothing in good condition', 'Textiles', true, 'low', 0.50, 2.00),
        ('Fabrics', 'Various fabric scraps and textiles', 'Textiles', true, 'low', 0.20, 0.80),
        ('Garden Waste', 'Yard trimmings and plant matter', 'Organic', true, 'low', 0.00, 0.05),
        ('Food Waste', 'Compostable food scraps', 'Organic', true, 'low', 0.00, 0.02)
      ON CONFLICT DO NOTHING
    `;
    
    await pool.query(materialsSql);
    console.log('Materials seeded successfully.');
  } catch (error) {
    console.error('Error seeding materials:', error.message);
    throw error;
  }
}

// Function to seed recycling centers
async function seedRecyclingCenters() {
  try {
    console.log('Seeding recycling centers...');
    
    // Insert recycling centers
    const centersSql = `
      INSERT INTO recycling_centers (
        name, slug, address, city, postal_code, state, phone, email, website, 
        description, latitude, longitude, is_verified, owner_id
      )
      VALUES
        (
          'Berlin Recycling Center', 
          'berlin-recycling-center',
          'Recyclingstraße 123', 
          'Berlin', 
          '10115', 
          'Berlin',
          '+49 30 1234567',
          'info@berlin-recycling.de',
          'https://www.berlin-recycling.de',
          'Main recycling center in Berlin specializing in metals and plastics.',
          52.52000, 
          13.40500,
          true,
          1
        ),
        (
          'Munich Eco Recycle', 
          'munich-eco-recycle',
          'Umweltweg 45', 
          'Munich', 
          '80331', 
          'Bayern',
          '+49 89 9876543',
          'contact@munich-eco.de',
          'https://www.munich-eco.de',
          'Eco-friendly recycling facility accepting a wide range of materials.',
          48.13700, 
          11.57500,
          true,
          1
        ),
        (
          'Hamburg Green Solutions', 
          'hamburg-green-solutions',
          'Grünerweg 78', 
          'Hamburg', 
          '20095', 
          'Hamburg',
          '+49 40 5555123',
          'info@hamburg-green.de',
          'https://www.hamburg-green.de',
          'Specialized in electronic waste and hazardous materials.',
          53.55000, 
          10.00000,
          true,
          1
        )
      ON CONFLICT (slug) DO NOTHING
    `;
    
    await pool.query(centersSql);
    console.log('Recycling centers seeded successfully.');
    
    // Add relationships between centers and materials
    console.log('Adding material offers to centers...');
    
    // Get all centers
    const centersResult = await pool.query('SELECT id FROM recycling_centers');
    const centers = centersResult.rows;
    
    // Get all materials
    const materialsResult = await pool.query('SELECT id FROM materials');
    const materials = materialsResult.rows;
    
    // For each center, add some materials
    for (const center of centers) {
      // Randomly select 8-15 materials for each center
      const numMaterials = Math.floor(Math.random() * 8) + 8;
      const shuffled = [...materials].sort(() => 0.5 - Math.random());
      const selectedMaterials = shuffled.slice(0, numMaterials);
      
      for (const material of selectedMaterials) {
        // Random price between 0 and 5 (some will buy, some will just accept)
        const price = Math.random() > 0.3 ? Math.random() * 5 : 0;
        
        await pool.query(`
          INSERT INTO recycling_center_offers 
            (recycling_center_id, material_id, price, is_active)
          VALUES ($1, $2, $3, true)
          ON CONFLICT (recycling_center_id, material_id) DO UPDATE 
            SET price = $3, is_active = true
        `, [center.id, material.id, price]);
      }
    }
    
    console.log('Material offers added successfully.');
  } catch (error) {
    console.error('Error seeding recycling centers:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Check if tables exist and create them if not
    const createdSchema = await checkTables();
    
    // If we didn't need to create the schema, check if we need to seed data
    if (!createdSchema) {
      const { needsUsers, needsMaterials, needsCenters } = await checkData();
      
      if (needsUsers) {
        await seedUsers();
      }
      
      if (needsMaterials) {
        await seedMaterials();
      }
      
      if (needsCenters) {
        await seedRecyclingCenters();
      }
      
      if (!needsUsers && !needsMaterials && !needsCenters) {
        console.log('Database already has data. No seeding required.');
      }
    } else {
      // If we created the schema, seed all data
      await seedUsers();
      await seedMaterials();
      await seedRecyclingCenters();
    }
    
    console.log('Database preparation completed successfully!');
  } catch (error) {
    console.error('Error preparing database:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the main function
main(); 