import { runMigrations } from '../lib/db/migrations';

async function main() {
  console.log('Starting database migrations...');
  try {
    await runMigrations();
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main(); 