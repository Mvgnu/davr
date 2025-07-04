#!/usr/bin/env node

/**
 * Direct database migration script
 */

// Set up environment
require('dotenv').config();
const { Pool } = require('pg');

// Get database connection string
const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set!');
  process.exit(1);
}

// Initialize Postgres connection pool
console.log('Initializing database connection pool');
console.log(`Database URL: ${connectionString ? connectionString.replace(/:[^:]*@/, ':****@') : 'Not set'}`);

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test the connection
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('🔋 Database connection established');
    console.log(`Connected to database at time: ${result.rows[0].now}`);
    return true;
  } catch (err) {
    console.error('⚠️ Database connection failed:', err.message);
    return false;
  }
}

// Query function
async function query(text, params = []) {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
}

// Run migrations
async function runMigrations() {
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
    }
    
    console.log('Database migrations completed successfully');
    return true;
  } catch (error) {
    console.error('Error during migrations:', error);
    throw error;
  }
}

// Seed test data
async function seedTestUsers() {
  try {
    // Check if users table is already populated
    const usersCheck = await query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(usersCheck.rows[0].count);
    
    // Only seed users if there are none
    if (userCount === 0) {
      console.log('Creating test users...');
      
      // We'll use simple password hashing for this example
      const bcrypt = require('bcryptjs');
      
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
      
      // Test business user
      await query(
        'INSERT INTO users (email, password, name, role, verified, status) VALUES ($1, $2, $3, $4, $5, $6)',
        ['business@example.com', regularUserPassword, 'Business Account', 'business', true, 'active']
      );
      
      // Test suspended user
      await query(
        'INSERT INTO users (email, password, name, role, verified, status) VALUES ($1, $2, $3, $4, $5, $6)',
        ['suspended@example.com', regularUserPassword, 'Suspended User', 'user', true, 'suspended']
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    const connected = await testConnection();
    if (!connected) {
      console.error('Cannot proceed without database connection');
      process.exit(1);
    }
    
    await runMigrations();
    await seedTestUsers();
    
    console.log('✅ Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database setup:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
main(); 