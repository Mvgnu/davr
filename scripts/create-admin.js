require('dotenv').config();
const { query } = require('../lib/db');
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function createAdminUser() {
  try {
    console.log('Creating a new admin user...');
    
    // Prompt for admin details
    const name = await prompt('Enter admin name: ');
    const email = await prompt('Enter admin email: ');
    const password = await prompt('Enter admin password (min 12 characters): ');
    
    // Validate inputs
    if (!name || !email || !password) {
      console.error('Error: All fields are required');
      process.exit(1);
    }
    
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
    
    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.error('Error: A user with this email already exists');
      process.exit(1);
    }
    
    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert the admin user
    const result = await query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, hashedPassword, 'admin']
    );
    
    if (result.rows.length > 0) {
      console.log(`✅ Admin user created successfully! ID: ${result.rows[0].id}`);
      console.log(`Email: ${email}`);
      console.log('Role: admin');
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

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Run the function
createAdminUser(); 