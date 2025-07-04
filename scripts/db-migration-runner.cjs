/**
 * Direct database migration runner - handling migrations directly
 */

// Require dotenv to load environment variables
require('dotenv').config();

// Set up PostgreSQL connection string
const { Pool } = require('pg');
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Run all database migrations
async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Create recycling center claims table (which is the one causing issues)
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
    
    // Create indexes for faster claim lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_recycling_center_claims_center ON recycling_center_claims(recycling_center_id)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_recycling_center_claims_user ON recycling_center_claims(user_id)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_recycling_center_claims_status ON recycling_center_claims(status)
    `);
    
    console.log('Database migrations completed successfully');
    return true;
  } catch (error) {
    console.error('Error during migrations:', error);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Execute migrations
async function main() {
  try {
    await runMigrations();
    console.log('Migration script completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main(); 