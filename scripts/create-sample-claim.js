// Script to insert a sample claim request into the database
import dotenv from 'dotenv';
import { pool } from '../lib/db.js';

// Load environment variables
dotenv.config();

async function createSampleClaim() {
  console.log('Creating sample claim request...');
  
  try {
    // Find a recycling center that doesn't have a claim yet
    const recyclingCenterResult = await pool.query(`
      SELECT rc.id 
      FROM recycling_centers rc
      LEFT JOIN recycling_center_claims rcc ON rc.id = rcc.recycling_center_id
      WHERE rcc.id IS NULL
      LIMIT 1
    `);
    
    if (recyclingCenterResult.rows.length === 0) {
      console.log('No available recycling centers found. Using default ID 3');
      var recyclingCenterId = 3;
    } else {
      var recyclingCenterId = recyclingCenterResult.rows[0].id;
    }
    
    // Find a valid user
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    
    if (userResult.rows.length === 0) {
      console.log('No users found in the database. Please create a user first.');
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
      
      // Find a different user
      const differentUserResult = await pool.query(
        'SELECT id FROM users WHERE id != $1 LIMIT 1',
        [userId]
      );
      
      if (differentUserResult.rows.length > 0) {
        userId = differentUserResult.rows[0].id;
        console.log(`Using different user ID: ${userId}`);
      } else {
        console.log('No other users found. Will attempt to create a new claim with the same user.');
      }
    }
    
    // Insert the claim
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
        'Dies ist eine Testanfrage für die Übernahme dieses Recycling-Centers. Bitte genehmigen Sie diese Anfrage für Testzwecke.',
        'Test GmbH',
        'Geschäftsführer',
        'pending'
      ]
    );
    
    console.log(`Sample claim request created with ID: ${claimResult.rows[0].id}`);
    console.log(`Recycling center ID: ${recyclingCenterId}, User ID: ${userId}`);
    
  } catch (error) {
    console.error('Error creating sample claim:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the function
createSampleClaim(); 