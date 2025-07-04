import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * Run all database migrations to create necessary tables
 */
export async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        status VARCHAR(50) DEFAULT 'active',
        verified BOOLEAN DEFAULT FALSE,
        last_login TIMESTAMP,
        profile_image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Update existing users table with new columns if they don't exist
    try {
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255)`);
    } catch (error) {
      console.error('Error adding columns to users table:', error);
      // Continue with migrations even if column additions fail
    }
    
    // Create materials table
    await query(`
      CREATE TABLE IF NOT EXISTS materials (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        recyclable BOOLEAN DEFAULT TRUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create recycling centers table
    await query(`
      CREATE TABLE IF NOT EXISTS recycling_centers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20) NOT NULL,
        state VARCHAR(100),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        phone VARCHAR(50),
        email VARCHAR(255),
        website VARCHAR(255),
        description TEXT,
        rating DECIMAL(3, 2) DEFAULT 0,
        rating_count INTEGER DEFAULT 0,
        is_verified BOOLEAN DEFAULT FALSE,
        owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create index on city for faster searches
    await query(`
      CREATE INDEX IF NOT EXISTS idx_recycling_centers_city ON recycling_centers(city)
    `);
    
    // Create index on owner_id for faster user-related queries
    await query(`
      CREATE INDEX IF NOT EXISTS idx_recycling_centers_owner ON recycling_centers(owner_id)
    `);
    
    // Create recycling center offers table
    await query(`
      CREATE TABLE IF NOT EXISTS recycling_center_offers (
        id SERIAL PRIMARY KEY,
        recycling_center_id INTEGER NOT NULL REFERENCES recycling_centers(id) ON DELETE CASCADE,
        material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
        price DECIMAL(10, 2) NOT NULL,
        min_quantity INTEGER NOT NULL,
        notes TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(recycling_center_id, material_id)
      )
    `);
    
    // Create reviews table
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        recycling_center_id INTEGER NOT NULL REFERENCES recycling_centers(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create marketplace listings table
    await query(`
      CREATE TABLE IF NOT EXISTS marketplace_listings (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        city VARCHAR(100),
        postal_code VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create index on material_id for marketplace listings
    await query(`
      CREATE INDEX IF NOT EXISTS idx_marketplace_listings_material ON marketplace_listings(material_id)
    `);
    
    // Add columns for verified status and claim management to recycling centers
    try {
      await query(`
        ALTER TABLE recycling_centers ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'unverified'
      `);
      await query(`
        ALTER TABLE recycling_centers ADD COLUMN IF NOT EXISTS claimed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
      `);
    } catch (error) {
      console.error('Error adding verification columns to recycling_centers table:', error);
      // Continue with migrations even if column additions fail
    }

    // Create recycling center claims table
    await query(`
      CREATE TABLE IF NOT EXISTS recycling_center_claims (
        id SERIAL PRIMARY KEY,
        recycling_center_id INTEGER NOT NULL REFERENCES recycling_centers(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        company_name VARCHAR(255),
        business_role VARCHAR(255),
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes for faster claim lookups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_recycling_center_claims_center ON recycling_center_claims(recycling_center_id)
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_recycling_center_claims_user ON recycling_center_claims(user_id)
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_recycling_center_claims_status ON recycling_center_claims(status)
    `);
    
    console.log('Database migrations completed successfully');
    return true;
  } catch (error) {
    console.error('Error during migrations:', error);
    throw error;
  }
}

/**
 * Seed the database with initial data
 */
export async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Check if materials table is already populated
    const materialsCheck = await query('SELECT COUNT(*) FROM materials');
    const materialCount = parseInt(materialsCheck.rows[0].count);
    
    // Only seed materials if there are none
    if (materialCount === 0) {
      console.log('Seeding materials...');
      
      // Seed materials
      const materials = [
        // Metals
        { name: 'Aluminum Cans', category: 'Metals', recyclable: true, description: 'Used beverage cans made of aluminum' },
        { name: 'Aluminum Foil', category: 'Metals', recyclable: true, description: 'Kitchen foil made of aluminum' },
        { name: 'Copper Wire', category: 'Metals', recyclable: true, description: 'Electrical wiring made of copper' },
        { name: 'Steel Cans', category: 'Metals', recyclable: true, description: 'Food cans made of steel' },
        { name: 'Brass', category: 'Metals', recyclable: true, description: 'Alloy of copper and zinc' },
        
        // Plastics
        { name: 'PET Bottles', category: 'Plastics', recyclable: true, description: 'Plastic bottles made of polyethylene terephthalate (Type 1)' },
        { name: 'HDPE Containers', category: 'Plastics', recyclable: true, description: 'Plastic containers made of high-density polyethylene (Type 2)' },
        { name: 'PVC', category: 'Plastics', recyclable: true, description: 'Polyvinyl chloride plastic (Type 3)' },
        { name: 'LDPE Plastic', category: 'Plastics', recyclable: true, description: 'Low-density polyethylene plastic (Type 4)' },
        { name: 'PP Plastic', category: 'Plastics', recyclable: true, description: 'Polypropylene plastic (Type 5)' },
        
        // Paper
        { name: 'Cardboard', category: 'Paper', recyclable: true, description: 'Thick paper material used for packaging' },
        { name: 'Newspaper', category: 'Paper', recyclable: true, description: 'Printed paper material for news' },
        { name: 'Office Paper', category: 'Paper', recyclable: true, description: 'White paper used in offices' },
        { name: 'Magazines', category: 'Paper', recyclable: true, description: 'Glossy printed publications' },
        
        // Glass
        { name: 'Glass Bottles', category: 'Glass', recyclable: true, description: 'Bottles made of glass' },
        { name: 'Glass Jars', category: 'Glass', recyclable: true, description: 'Food containers made of glass' },
        
        // E-Waste
        { name: 'Computers', category: 'E-Waste', recyclable: true, description: 'Desktop and laptop computers' },
        { name: 'Smartphones', category: 'E-Waste', recyclable: true, description: 'Mobile phones and smartphones' },
        { name: 'Batteries', category: 'E-Waste', recyclable: true, description: 'Single-use and rechargeable batteries' },
        { name: 'Televisions', category: 'E-Waste', recyclable: true, description: 'Old and new TV sets' }
      ];
      
      for (const material of materials) {
        await query(
          'INSERT INTO materials (name, category, recyclable, description) VALUES ($1, $2, $3, $4)',
          [material.name, material.category, material.recyclable, material.description]
        );
      }
    }
    
    // Check if users table is already populated
    const usersCheck = await query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(usersCheck.rows[0].count);
    
    // Only seed users if there are none
    if (userCount === 0) {
      console.log('Creating default admin user...');
      
      // Create default admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await query(
        'INSERT INTO users (email, password, name, role, verified, status) VALUES ($1, $2, $3, $4, $5, $6)',
        ['admin@example.com', hashedPassword, 'Admin User', 'admin', true, 'active']
      );
      
      // Create some regular users
      const regularUserPassword = await bcrypt.hash('user123', 10);
      await query(
        'INSERT INTO users (email, password, name, role, verified, status) VALUES ($1, $2, $3, $4, $5, $6)',
        ['user1@example.com', regularUserPassword, 'Regular User 1', 'user', true, 'active']
      );
      
      await query(
        'INSERT INTO users (email, password, name, role, verified, status) VALUES ($1, $2, $3, $4, $5, $6)',
        ['user2@example.com', regularUserPassword, 'Regular User 2', 'user', false, 'pending']
      );
    }
    
    // Check if recycling centers table is already populated
    const centersCheck = await query('SELECT COUNT(*) FROM recycling_centers');
    const centerCount = parseInt(centersCheck.rows[0].count);
    
    // Only seed recycling centers if there are none
    if (centerCount === 0) {
      console.log('Seeding recycling centers...');
      
      // Get user IDs
      const userResult = await query('SELECT id FROM users');
      const userIds = userResult.rows.map(row => row.id);
      
      // Seed some recycling centers
      const centers = [
        {
          name: 'Berlin Recycling Center',
          slug: 'berlin-recycling-center',
          address: 'Recyclingstraße 123',
          city: 'Berlin',
          postal_code: '10115',
          state: 'Berlin',
          latitude: 52.5200,
          longitude: 13.4050,
          phone: '+49 30 1234567',
          email: 'info@berlin-recycling.de',
          website: 'https://www.berlin-recycling.de',
          description: 'Main recycling center in Berlin specializing in metals and plastics.',
          is_verified: true,
          owner_id: userIds[0]
        },
        {
          name: 'Hamburg Green Recyclers',
          slug: 'hamburg-green-recyclers',
          address: 'Umweltstraße 45',
          city: 'Hamburg',
          postal_code: '20095',
          state: 'Hamburg',
          latitude: 53.5511,
          longitude: 9.9937,
          phone: '+49 40 9876543',
          email: 'contact@hamburg-recyclers.de',
          website: 'https://www.hamburg-recyclers.de',
          description: 'Eco-friendly recycling center serving Hamburg area.',
          is_verified: true,
          owner_id: userIds[1]
        },
        {
          name: 'Munich Materials Recovery',
          slug: 'munich-materials-recovery',
          address: 'Recyclingweg 78',
          city: 'Munich',
          postal_code: '80331',
          state: 'Bavaria',
          latitude: 48.1351,
          longitude: 11.5820,
          phone: '+49 89 1357924',
          email: 'info@munich-materials.de',
          description: 'Specialized in metals and electronic waste.',
          is_verified: true,
          owner_id: userIds[0]
        }
      ];
      
      for (const center of centers) {
        const result = await query(
          `INSERT INTO recycling_centers (
            name, slug, address, city, postal_code, state, 
            latitude, longitude, phone, email, website, 
            description, is_verified, owner_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING id`,
          [
            center.name, center.slug, center.address, center.city,
            center.postal_code, center.state, center.latitude, center.longitude,
            center.phone, center.email, center.website, center.description,
            center.is_verified, center.owner_id
          ]
        );
        
        const centerId = result.rows[0].id;
        
        // Get material IDs
        const materialResult = await query('SELECT id, category FROM materials');
        const materials = materialResult.rows;
        
        // Add some material offers for each center
        const metallicMaterials = materials.filter(m => m.category === 'Metals');
        const plasticMaterials = materials.filter(m => m.category === 'Plastics');
        const paperMaterials = materials.filter(m => m.category === 'Paper');
        
        // Add offers for different categories based on the center
        const materialsToAdd = [];
        
        if (center.name.includes('Berlin')) {
          materialsToAdd.push(...metallicMaterials, ...plasticMaterials);
        } else if (center.name.includes('Hamburg')) {
          materialsToAdd.push(...paperMaterials, ...plasticMaterials);
        } else if (center.name.includes('Munich')) {
          materialsToAdd.push(...metallicMaterials, ...materials.filter(m => m.category === 'E-Waste'));
        }
        
        // Add each material offer
        for (const material of materialsToAdd) {
          const price = (Math.random() * (0.5 - 0.05) + 0.05).toFixed(2);
          const minQuantity = Math.floor(Math.random() * 20) + 1;
          
          await query(
            `INSERT INTO recycling_center_offers (
              recycling_center_id, material_id, price, min_quantity, active
            ) VALUES ($1, $2, $3, $4, $5)`,
            [centerId, material.id, price, minQuantity, true]
          );
        }
      }
    }
    
    console.log('Database seeding completed successfully');
    return true;
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
} 