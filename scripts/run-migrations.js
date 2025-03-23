#!/usr/bin/env node

/**
 * Simple script to run database migrations and seeding directly
 */

const { spawn } = require('child_process');

// Run Node.js with TypeScript support
const command = 'npx';
const args = ['ts-node', '-e', `
const { runMigrations, seedDatabase } = require('./lib/db/migrations');

async function init() {
  try {
    console.log('Starting database migrations...');
    await runMigrations();
    console.log('Database migrations completed successfully!');
    
    console.log('\\nStarting database seeding...');
    await seedDatabase();
    console.log('Database seeding completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  }
}

init();
`];

const child = spawn(command, args, {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  if (code !== 0) {
    console.error(`Process exited with code ${code}`);
  }
}); 