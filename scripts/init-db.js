#!/usr/bin/env node

/**
 * Script to initialize the database with tables and seed data
 * Run with: node scripts/init-db.js
 */

import https from 'https';
import http from 'http';

const protocol = process.env.NODE_ENV === 'production' ? https : http;
const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;
const seed = process.argv.includes('--seed');

console.log(`Initializing database${seed ? ' with seed data' : ''}...`);

const options = {
  hostname: host,
  port: port,
  path: `/api/db/init${seed ? '?seed=true' : ''}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = protocol.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const response = JSON.parse(data);
      console.log('\x1b[32m%s\x1b[0m', 'Database initialization successful!');
      console.log(response.message);
    } else {
      console.error('\x1b[31m%s\x1b[0m', 'Database initialization failed!');
      try {
        const response = JSON.parse(data);
        console.error('Error:', response.error);
        if (response.details) {
          console.error('Details:', response.details);
        }
      } catch (e) {
        console.error('Response:', data);
      }
    }
  });
});

req.on('error', (error) => {
  console.error('\x1b[31m%s\x1b[0m', 'Database initialization failed!');
  console.error(`Error: ${error.message}`);
  console.error('Make sure the server is running.');
});

req.end();

console.log('Request sent, waiting for response...'); 