import pg from 'pg';

// Direct database connection details
const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'recycling_db',
  password: 'postgres',
  port: 5435,
};

async function fixPasswordColumn() {
  const client = new pg.Client(dbConfig);
  
  try {
    // Connect to PostgreSQL
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Check if password_hash column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'password_hash'
    `);
    
    // Check if password column exists
    const passwordColumnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'password'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ password_hash column already exists. No action needed.');
    } else if (passwordColumnCheck.rows.length > 0) {
      console.log('🔄 Renaming password column to password_hash...');
      
      // First, copy existing password values to a new password_hash column
      await client.query(`
        ALTER TABLE users
        ADD COLUMN password_hash VARCHAR(255)
      `);
      
      await client.query(`
        UPDATE users
        SET password_hash = password
      `);
      
      console.log('✅ Successfully added password_hash column and copied values from password column.');
      console.log('⚠️ Keeping the original password column for backward compatibility.');
      console.log('✅ Users should now be able to log in correctly.');
    } else {
      console.log('❌ Neither password nor password_hash column exists. Database schema may be inconsistent.');
      console.log('Please check your schema.sql file and ensure the users table is properly defined.');
    }
  } catch (error) {
    console.error('Error fixing password column:', error);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
    process.exit(0);
  }
}

// Run the function
fixPasswordColumn(); 