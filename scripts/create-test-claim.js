import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable not set');
  process.exit(1);
}

console.log(`Using database connection: ${connectionString.replace(/:[^:]*@/, ':****@')}`);

const pool = new Pool({
  connectionString,
  max: 5,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createTestClaim() {
  try {
    console.log('Creating test claim request...');
    
    // Get a valid recycling center ID
    const recyclingCenterResult = await pool.query(`
      SELECT id FROM recycling_centers
      ORDER BY id ASC
      LIMIT 1
    `);
    
    if (recyclingCenterResult.rows.length === 0) {
      console.error('No recycling centers found in the database');
      return;
    }
    
    const recyclingCenterId = recyclingCenterResult.rows[0].id;
    
    // Find a valid user
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    
    if (userResult.rows.length === 0) {
      console.error('No users found in the database. Please create a user first.');
      return;
    }
    
    let userId = userResult.rows[0].id;
    
    console.log(`Using recycling center ID: ${recyclingCenterId} and user ID: ${userId}`);
    
    // Check if a claim already exists
    const existingClaimResult = await pool.query(
      'SELECT id FROM recycling_center_claims WHERE recycling_center_id = $1 AND user_id = $2',
      [recyclingCenterId, userId]
    );
    
    if (existingClaimResult.rows.length > 0) {
      console.log('A claim already exists for this recycling center and user. Finding a different user...');
      
      // Try to find a different user
      const differentUserResult = await pool.query(
        'SELECT id FROM users WHERE id != $1 LIMIT 1',
        [userId]
      );
      
      if (differentUserResult.rows.length > 0) {
        userId = differentUserResult.rows[0].id;
        console.log(`Using different user ID: ${userId}`);
      } else {
        // Try a different recycling center instead
        const differentCenterResult = await pool.query(
          'SELECT id FROM recycling_centers WHERE id != $1 LIMIT 1',
          [recyclingCenterId]
        );
        
        if (differentCenterResult.rows.length > 0) {
          recyclingCenterId = differentCenterResult.rows[0].id;
          console.log(`Using different recycling center ID: ${recyclingCenterId}`);
        } else {
          console.log('No other recycling centers or users found. Creating with a unique message instead.');
        }
      }
    }
    
    // Insert the claim with a timestamp to ensure uniqueness
    const timestamp = new Date().toISOString();
    const claimResult = await pool.query(
      `INSERT INTO recycling_center_claims (
        recycling_center_id, user_id, name, email, phone, message, 
        company_name, business_role, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id`,
      [
        recyclingCenterId,
        userId,
        'Test User',
        'test@example.com',
        '+49123456789',
        `Dies ist eine Testanfrage vom ${timestamp} für die Übernahme dieses Recycling-Centers.`,
        'Test GmbH',
        'Geschäftsführer',
        'pending'
      ]
    );
    
    console.log(`✅ Test claim request created with ID: ${claimResult.rows[0].id}`);
    console.log(`Using recycling center ID: ${recyclingCenterId}, User ID: ${userId}`);
    
  } catch (error) {
    console.error('Error creating test claim:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

createTestClaim(); 