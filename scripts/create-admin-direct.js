import pg from 'pg';
import bcrypt from 'bcrypt';
import readline from 'readline';

// Direct database connection details
const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'recycling_db',
  password: 'postgres',
  port: 5435,
};

const client = new pg.Client(dbConfig);

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
    // Connect to PostgreSQL
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    console.log('👑 Creating a new admin user...');
    
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
    
    // Check if user already exists
    const checkResult = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkResult.rows.length > 0) {
      console.error('Error: A user with this email already exists');
      process.exit(1);
    }
    
    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert the admin user
    const result = await client.query(
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
    // Close the database connection
    await client.end();
    rl.close();
    process.exit(0);
  }
}

// Run the function
createAdminUser(); 