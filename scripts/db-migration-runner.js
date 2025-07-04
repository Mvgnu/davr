/**
 * Direct database migration runner - handling migrations directly
 * This is a CommonJS script that imports the TS functions
 */

// Import the migration functions
const { runMigrations } = require('../lib/db/migrations');

async function main() {
  console.log('Starting database migrations...');
  
  try {
    await runMigrations();
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main(); 