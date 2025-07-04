import pg from 'pg';

// Direct database connection details
const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'recycling_db',
  password: 'postgres',
  port: 5435,
};

async function fixProfileImageColumn() {
  const client = new pg.Client(dbConfig);
  
  try {
    // Connect to PostgreSQL
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Check if profile_image column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'profile_image'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ profile_image column already exists. No action needed.');
    } else {
      console.log('🔄 Adding profile_image column to users table...');
      
      // Add the profile_image column
      await client.query(`
        ALTER TABLE users
        ADD COLUMN profile_image VARCHAR(255)
      `);
      
      console.log('✅ Successfully added profile_image column to users table.');
      console.log('✅ Authentication system should now work correctly.');
    }
  } catch (error) {
    console.error('Error fixing profile_image column:', error);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
    process.exit(0);
  }
}

// Run the function
fixProfileImageColumn(); 