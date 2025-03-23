require('dotenv').config();
const { query } = require('../lib/db');
const bcrypt = require('bcrypt');

// This script is for creating an admin user in production without user prompts
// It reads values from environment variables for security

async function createProductionAdmin() {
  try {
    // Get values from environment variables
    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    
    if (!name || !email || !password) {
      console.error('Error: Missing required environment variables: ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD');
      console.error('Please set these variables before running this script.');
      process.exit(1);
    }
    
    // Validate password strength
    if (password.length < 12) {
      console.error('Error: Password must be at least 12 characters long');
      process.exit(1);
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Error: Invalid email format');
      process.exit(1);
    }
    
    console.log(`Creating admin user with email: ${email}`);
    
    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.log('Admin user already exists. Updating role to admin...');
      
      // Update existing user to have admin role
      await query(
        'UPDATE users SET role = $1 WHERE email = $2 RETURNING id',
        ['admin', email]
      );
      
      console.log('✅ User role updated to admin');
      process.exit(0);
    }
    
    // Hash the password with a secure salt
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert the admin user
    const result = await query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, hashedPassword, 'admin']
    );
    
    if (result.rows.length > 0) {
      console.log(`✅ Admin user created successfully! ID: ${result.rows[0].id}`);
    } else {
      console.error('Error: Failed to create admin user');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the function
createProductionAdmin().then(() => {
  console.log('Admin user creation process completed.');
  setTimeout(() => process.exit(0), 1000); // Give time for DB connection to close
}); 