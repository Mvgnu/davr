// Database inspection script
import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkSchema() {
  try {
    console.log('Connecting to PostgreSQL database...');
    
    // Check users table schema
    const usersSchema = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nUSERS TABLE SCHEMA:');
    console.table(usersSchema.rows);
    
    // Check a sample user
    const sampleUser = await pool.query(`
      SELECT * FROM users LIMIT 1;
    `);
    
    if (sampleUser.rows.length > 0) {
      console.log('\nSAMPLE USER:');
      console.log(JSON.stringify(sampleUser.rows[0], null, 2));
    } else {
      console.log('\nNo users found in the database.');
    }

    // Check admin users
    const adminUsers = await pool.query(`
      SELECT id, name, email, role, account_type
      FROM users 
      WHERE role = 'admin' OR role = 'ADMIN';
    `);
    
    console.log('\nADMIN USERS:');
    if (adminUsers.rows.length > 0) {
      console.table(adminUsers.rows);
    } else {
      console.log('No admin users found.');
    }
    
  } catch (error) {
    console.error('Error checking database schema:', error);
  } finally {
    // Close pool
    await pool.end();
  }
}

checkSchema().catch(console.error); 