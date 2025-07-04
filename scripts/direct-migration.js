// Direct migration script for the recycling_center_claims table
// This script uses JavaScript directly to create the table without TypeScript
import dotenv from 'dotenv';
import pg from 'pg';

// Load environment variables
dotenv.config();

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Create the recycling_center_claims table
async function createRecyclingCenterClaimsTable() {
  try {
    console.log('Creating recycling_center_claims table...');
    
    // Create table if not exists
    await pool.query(`
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
    
    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_recycling_center_claims_center ON recycling_center_claims(recycling_center_id)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_recycling_center_claims_user ON recycling_center_claims(user_id)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_recycling_center_claims_status ON recycling_center_claims(status)
    `);
    
    console.log('✅ Successfully created recycling_center_claims table and indexes');
  } catch (error) {
    console.error('Error creating recycling_center_claims table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
async function main() {
  try {
    await createRecyclingCenterClaimsTable();
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main(); 