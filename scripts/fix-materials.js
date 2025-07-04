#!/usr/bin/env node

import * as dotenv from 'dotenv';
dotenv.config();

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { fixMaterialsTable } from '../lib/db/materials-fix.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Environment loaded. DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

/**
 * Script to fix the materials table structure
 */

// Run the materials fix
async function runMaterialsFix() {
  try {
    console.log('Starting materials table fix...');
    await fixMaterialsTable();
    console.log('Materials table fix completed');
  } catch (error) {
    console.error('Error during materials table fix:', error);
  }
}

// Execute the fix
runMaterialsFix(); 