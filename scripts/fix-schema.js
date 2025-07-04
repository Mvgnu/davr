#!/usr/bin/env node

/**
 * Script to fix schema inconsistencies in the database
 */

// Import the schema fix function
const { fixRecyclingCenterOffersSchema } = require('../lib/db/schema-fix');

// Run the schema fix
async function runSchemeFix() {
  try {
    console.log('Starting schema fix...');
    await fixRecyclingCenterOffersSchema();
    console.log('Schema fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during schema fix:', error);
    process.exit(1);
  }
}

// Execute the fix
runSchemeFix(); 