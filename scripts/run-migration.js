#!/usr/bin/env node

/**
 * Database migration runner
 * 
 * This script helps to execute the database migration process in the correct order:
 * 1. Set up PostgreSQL schema
 * 2. Migrate data from MongoDB to PostgreSQL
 * 
 * Usage:
 * node scripts/run-migration.js [options]
 * 
 * Options:
 *   --schema-only    Run only the schema creation (default: false)
 *   --data-only      Run only the data migration (default: false)
 *   --force          Force run without confirmation (default: false)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Pool } = require('pg');
const { migrateRecyclingCenters } = require('./migrate-recycling-centers');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  schemaOnly: args.includes('--schema-only'),
  dataOnly: args.includes('--data-only'),
  force: args.includes('--force')
};

// If both options are specified, it's ambiguous
if (options.schemaOnly && options.dataOnly) {
  console.error('Error: Cannot specify both --schema-only and --data-only');
  process.exit(1);
}

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check for required environment variables
function checkEnvironment() {
  if (!options.schemaOnly && !process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI environment variable is required');
    console.error('Please add it to your .env file or export it in your shell');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is required');
    console.error('Please add it to your .env file or export it in your shell');
    process.exit(1);
  }
}

// Run PostgreSQL schema migration
async function runSchemaMigration() {
  console.log('Running PostgreSQL schema migration...');
  
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('Error: Schema file not found:', schemaPath);
    process.exit(1);
  }
  
  try {
    // Connect to database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Read and execute the schema file
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    
    console.log('Schema migration completed successfully!');
    await pool.end();
    return true;
  } catch (error) {
    console.error('Schema migration failed:', error);
    return false;
  }
}

// Run the data migration from MongoDB to PostgreSQL
async function runDataMigration() {
  console.log('Running data migration from MongoDB to PostgreSQL...');
  
  try {
    await migrateRecyclingCenters();
    console.log('Data migration completed successfully!');
    return true;
  } catch (error) {
    console.error('Data migration failed:', error);
    return false;
  }
}

// Main function to run the migrations
async function runMigrations() {
  // Check environment variables
  checkEnvironment();
  
  // Ask for confirmation unless --force is specified
  if (!options.force) {
    const warning = [
      '⚠️  WARNING: This will modify your database. Make sure you have a backup.',
      '⚠️  Are you sure you want to continue? (yes/no)'
    ].join('\n');
    
    await new Promise((resolve) => {
      rl.question(`${warning}\n> `, (answer) => {
        if (answer.toLowerCase() !== 'yes') {
          console.log('Migration aborted.');
          rl.close();
          process.exit(0);
        }
        resolve();
      });
    });
  }
  
  let success = true;
  
  // Run schema migration if not --data-only
  if (!options.dataOnly) {
    success = await runSchemaMigration();
    if (!success) {
      rl.close();
      process.exit(1);
    }
  }
  
  // Run data migration if not --schema-only
  if (!options.schemaOnly && success) {
    success = await runDataMigration();
    if (!success) {
      rl.close();
      process.exit(1);
    }
  }
  
  console.log('🎉 Migration process completed!');
  rl.close();
  process.exit(0);
}

// Run the script
require('dotenv').config();
runMigrations().catch(err => {
  console.error('Unexpected error during migration:', err);
  process.exit(1);
}); 