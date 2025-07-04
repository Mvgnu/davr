#!/usr/bin/env node

/**
 * Simple script to run database migrations and seeding directly using exec instead of imports
 */

const { exec } = require('child_process');

// Run the migrations using ts-node
console.log('🔧 Running database migrations...');

exec('npx ts-node --transpile-only scripts/db-migration-runner.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing migrations: ${error.message}`);
    console.error(stdout);
    console.error(stderr);
    process.exit(1);
    return;
  }
  
  if (stderr) {
    console.warn(`stderr: ${stderr}`);
  }
  
  console.log(stdout);
  console.log('✅ Database setup completed successfully!');
}); 