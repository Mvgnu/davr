#!/usr/bin/env node

/**
 * Script to fix materials table structure and seed it with proper data
 */

// Import the materials fix function and child_process using ES modules
import { fixMaterialsTable } from '../lib/db/materials-fix.js';
import { execSync } from 'child_process';

// Run the materials fix and then seed
async function runFixAndSeed() {
  try {
    console.log('===== Starting materials table fix =====');
    await fixMaterialsTable();
    console.log('Materials table fix completed successfully');
    
    console.log('\n===== Starting materials seeding =====');
    // Use execSync to run the seed-materials.js script
    execSync('node scripts/seed-materials.js --force', { stdio: 'inherit' });
    
    console.log('\nFix and seed process completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during fix and seed process:', error);
    process.exit(1);
  }
}

// Execute the fix and seed
runFixAndSeed(); 