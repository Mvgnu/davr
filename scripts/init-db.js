#!/usr/bin/env node

/**
 * Script to initialize the database with tables and seed data
 * Run with: node scripts/init-db.js
 */

import { runMigrations, seedDatabase } from '../lib/db/migrations.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createRequire } from 'module';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Setup require for loading .env
const require = createRequire(import.meta.url);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '..', '.env') });

// Check if --seed flag is provided
const shouldSeed = process.argv.includes('--seed');

async function init() {
  try {
    console.log('Running database migrations...');
    await runMigrations();
    console.log('✅ Database migrations completed successfully');
    
    if (shouldSeed) {
      console.log('Seeding database with sample data...');
      await seedDatabase();
      console.log('✅ Database seeded successfully');
    }
    
    console.log('\x1b[32m%s\x1b[0m', '🎉 Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Database initialization failed!');
    console.error(`Error: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

init(); 