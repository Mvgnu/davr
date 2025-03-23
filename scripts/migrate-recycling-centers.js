/**
 * Migration script to move data from MongoDB to PostgreSQL for recycling centers
 * 
 * Usage:
 * node scripts/migrate-recycling-centers.js
 * 
 * Requirements:
 * - MongoDB connection string in .env as MONGODB_URI
 * - PostgreSQL connection string in .env as DATABASE_URL
 * - Both databases must be accessible during migration
 */

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const { Pool } = require('pg');

// Database connections
const mongoUri = process.env.MONGODB_URI;
const pgConnectionString = process.env.DATABASE_URL;

// Connect to both databases
async function connectToDatabases() {
  console.log('Connecting to MongoDB...');
  const mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  const mongoDB = mongoClient.db();
  
  console.log('Connecting to PostgreSQL...');
  const pgPool = new Pool({
    connectionString: pgConnectionString,
  });
  
  return { mongoClient, mongoDB, pgPool };
}

// Helper to convert MongoDB ObjectId to string
function objectIdToString(id) {
  if (!id) return null;
  return id instanceof ObjectId ? id.toString() : id;
}

// Main migration function
async function migrateRecyclingCenters() {
  let { mongoClient, mongoDB, pgPool } = await connectToDatabases();
  
  try {
    console.log('Starting migration of recycling centers...');
    
    // 1. Get all recycling centers from MongoDB
    const recyclingCenters = await mongoDB.collection('recyclingcenters').find({}).toArray();
    console.log(`Found ${recyclingCenters.length} recycling centers in MongoDB`);
    
    // 2. Get all users for mapping MongoDB user IDs to PostgreSQL user IDs
    const userMap = new Map();
    
    // First check if there's a users collection in MongoDB
    const userCollection = await mongoDB.listCollections({ name: 'users' }).toArray();
    if (userCollection.length > 0) {
      const users = await mongoDB.collection('users').find({}).toArray();
      
      // Get users from PostgreSQL to map by email
      const pgUsers = await pgPool.query('SELECT id, email FROM users');
      
      // Create a map of MongoDB user ID to PostgreSQL user ID based on email match
      for (const mongoUser of users) {
        const pgUser = pgUsers.rows.find(u => u.email === mongoUser.email);
        if (pgUser) {
          userMap.set(objectIdToString(mongoUser._id), pgUser.id);
        }
      }
      
      console.log(`Mapped ${userMap.size} users between MongoDB and PostgreSQL`);
    }
    
    // Default admin user ID in case we can't map users
    let defaultAdminId = null;
    try {
      const adminResult = await pgPool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
      if (adminResult.rows.length > 0) {
        defaultAdminId = adminResult.rows[0].id;
      }
    } catch (e) {
      console.warn('Could not find admin user in PostgreSQL. Some centers may have no owner.');
    }
    
    // 3. Get materials mapping
    const materials = await mongoDB.collection('materials').find({}).toArray();
    const pgMaterials = await pgPool.query('SELECT id, name FROM materials');
    
    // Create a map of material names to PostgreSQL IDs
    const materialMap = new Map();
    for (const material of materials) {
      const pgMaterial = pgMaterials.rows.find(m => m.name.toLowerCase() === material.name.toLowerCase());
      if (pgMaterial) {
        materialMap.set(objectIdToString(material._id), pgMaterial.id);
      }
    }
    
    console.log(`Mapped ${materialMap.size} materials between MongoDB and PostgreSQL`);
    
    // 4. Start a transaction to ensure data consistency
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      
      // 5. Insert recycling centers
      for (const center of recyclingCenters) {
        console.log(`Migrating center: ${center.name}`);
        
        // Determine owner ID
        let ownerId = defaultAdminId;
        if (center.ownerId && userMap.has(objectIdToString(center.ownerId))) {
          ownerId = userMap.get(objectIdToString(center.ownerId));
        }
        
        // Create slug if not exists
        const slug = center.slug || center.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        
        // Convert opening hours if exists
        let openingHours = null;
        if (center.openingHours) {
          openingHours = JSON.stringify(center.openingHours);
        }
        
        // Insert recycling center
        const insertCenterResult = await client.query(
          `INSERT INTO recycling_centers (
            name, slug, address, city, postal_code, state, phone, email,
            website, description, opening_hours, latitude, longitude,
            owner_id, is_verified, verification_status, 
            rating, rating_count
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          RETURNING id`,
          [
            center.name,
            slug,
            center.address,
            center.city,
            center.postalCode,
            center.state || '',
            center.phone || null,
            center.email || null,
            center.website || null,
            center.description || '',
            openingHours,
            center.location?.coordinates?.[1] || null, // latitude
            center.location?.coordinates?.[0] || null, // longitude
            ownerId,
            center.isVerified || false,
            center.verificationStatus || 'pending',
            center.rating || 0,
            center.ratingCount || 0
          ]
        );
        
        const newCenterId = insertCenterResult.rows[0].id;
        
        // Migrate material offers if they exist
        if (center.buyMaterials && center.buyMaterials.length > 0) {
          for (const material of center.buyMaterials) {
            // Skip if we can't map the material
            if (!material.materialId || !materialMap.has(objectIdToString(material.materialId))) {
              console.warn(`Could not map material ${material.materialId} for center ${center.name}`);
              continue;
            }
            
            const pgMaterialId = materialMap.get(objectIdToString(material.materialId));
            
            // Insert offer
            await client.query(
              `INSERT INTO recycling_center_offers (
                recycling_center_id, material_id, price, min_quantity,
                notes, is_active
              ) VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                newCenterId,
                pgMaterialId,
                material.price || 0,
                material.minQuantity || null,
                material.notes || '',
                true
              ]
            );
          }
        }
        
        // Migrate reviews if they exist
        if (center.reviews && center.reviews.length > 0) {
          for (const review of center.reviews) {
            // Try to map the user
            let reviewUserId = null;
            if (review.userId && userMap.has(objectIdToString(review.userId))) {
              reviewUserId = userMap.get(objectIdToString(review.userId));
            }
            
            // Skip if no user ID and anonymous reviews not allowed
            if (!reviewUserId) {
              console.warn(`Skipping review for center ${center.name} due to missing user mapping`);
              continue;
            }
            
            await client.query(
              `INSERT INTO reviews (
                recycling_center_id, user_id, rating, comment, created_at
              ) VALUES ($1, $2, $3, $4, $5)`,
              [
                newCenterId,
                reviewUserId,
                review.rating || 3,
                review.comment || '',
                review.createdAt || new Date()
              ]
            );
          }
        }
      }
      
      await client.query('COMMIT');
      console.log('Migration completed successfully!');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error during migration:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close connections
    await mongoClient.close();
    await pgPool.end();
  }
}

// Run migration if script is executed directly
if (require.main === module) {
  migrateRecyclingCenters()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration script failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateRecyclingCenters }; 