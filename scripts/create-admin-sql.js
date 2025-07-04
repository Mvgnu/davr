import { query } from '../lib/db.js';
import bcrypt from 'bcrypt';
import readline from 'readline';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt for user input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createAdminUser() {
  try {
    console.log('👑 Creating a new admin user...');
    console.log('Using database connection: ' + (process.env.DATABASE_URL || 'Not set').replace(/:[^:]*@/, ':****@'));
    
    // Prompt for admin details
    const name = await prompt('Enter admin name: ');
    const email = await prompt('Enter admin email: ');
    const password = await prompt('Enter admin password (min 8 characters): ');
    
    // Validate inputs
    if (!name || !email || !password) {
      console.error('Error: All fields are required');
      process.exit(1);
    }
    
    if (password.length < 8) {
      console.error('Error: Password must be at least 8 characters long');
      process.exit(1);
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Error: Invalid email format');
      process.exit(1);
    }
    
    // First check if the users table exists
    try {
      // Check if user already exists
      const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        console.error('Error: A user with this email already exists');
        process.exit(1);
      }
    } catch (err) {
      if (err.code === '42P01') { // Relation does not exist error
        console.error('Error: The users table does not exist. Make sure your database is properly set up.');
        process.exit(1);
      }
      throw err;
    }
    
    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert the admin user
    const result = await query(
      'INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id',
      [name, email, hashedPassword, 'admin']
    );
    
    if (result.rows.length > 0) {
      console.log(`✅ Admin user created successfully! ID: ${result.rows[0].id}`);
      console.log(`Email: ${email}`);
      console.log('Role: admin');
      console.log('\nYou can now log in with these credentials.');
    } else {
      console.error('Error: Failed to create admin user');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Run the function
createAdminUser(); 