import { query } from '../../lib/db.js';

/**
 * Fix the materials table structure to match the schema
 */
export async function fixMaterialsTable() {
  try {
    console.log('Starting materials table fix...');
    
    // Add subtype column if it doesn't exist
    const checkSubtypeColumn = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'materials' AND column_name = 'subtype'
    `;
    const subtypeResult = await query(checkSubtypeColumn);
    const subtypeExists = subtypeResult.rows.length > 0;
    
    if (!subtypeExists) {
      console.log('Adding subtype column to materials table...');
      await query(`ALTER TABLE materials ADD COLUMN subtype VARCHAR(50)`);
      console.log('Added subtype column successfully');
    } else {
      console.log('subtype column already exists');
    }
    
    // Add parent_id column if it doesn't exist
    const checkParentIdColumn = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'materials' AND column_name = 'parent_id'
    `;
    const parentIdResult = await query(checkParentIdColumn);
    const parentIdExists = parentIdResult.rows.length > 0;
    
    if (!parentIdExists) {
      console.log('Adding parent_id column to materials table...');
      await query(`ALTER TABLE materials ADD COLUMN parent_id INTEGER REFERENCES materials(id)`);
      console.log('Added parent_id column successfully');
    } else {
      console.log('parent_id column already exists');
    }
    
    // Add market_value_level column if it doesn't exist
    const checkMarketValueColumn = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'materials' AND column_name = 'market_value_level'
    `;
    const marketValueResult = await query(checkMarketValueColumn);
    const marketValueExists = marketValueResult.rows.length > 0;
    
    if (!marketValueExists) {
      console.log('Adding market_value_level column to materials table...');
      await query(`ALTER TABLE materials ADD COLUMN market_value_level VARCHAR(20)`);
      console.log('Added market_value_level column successfully');
    } else {
      console.log('market_value_level column already exists');
    }
    
    // Add approximate_min_price column if it doesn't exist
    const checkMinPriceColumn = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'materials' AND column_name = 'approximate_min_price'
    `;
    const minPriceResult = await query(checkMinPriceColumn);
    const minPriceExists = minPriceResult.rows.length > 0;
    
    if (!minPriceExists) {
      console.log('Adding approximate_min_price column to materials table...');
      await query(`ALTER TABLE materials ADD COLUMN approximate_min_price DECIMAL(10, 2)`);
      console.log('Added approximate_min_price column successfully');
    } else {
      console.log('approximate_min_price column already exists');
    }
    
    // Add approximate_max_price column if it doesn't exist
    const checkMaxPriceColumn = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'materials' AND column_name = 'approximate_max_price'
    `;
    const maxPriceResult = await query(checkMaxPriceColumn);
    const maxPriceExists = maxPriceResult.rows.length > 0;
    
    if (!maxPriceExists) {
      console.log('Adding approximate_max_price column to materials table...');
      await query(`ALTER TABLE materials ADD COLUMN approximate_max_price DECIMAL(10, 2)`);
      console.log('Added approximate_max_price column successfully');
    } else {
      console.log('approximate_max_price column already exists');
    }
    
    // Add image_url column if it doesn't exist
    const checkImageUrlColumn = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'materials' AND column_name = 'image_url'
    `;
    const imageUrlResult = await query(checkImageUrlColumn);
    const imageUrlExists = imageUrlResult.rows.length > 0;
    
    if (!imageUrlExists) {
      console.log('Adding image_url column to materials table...');
      await query(`ALTER TABLE materials ADD COLUMN image_url VARCHAR(255)`);
      console.log('Added image_url column successfully');
    } else {
      console.log('image_url column already exists');
    }
    
    console.log('Materials table structure update completed successfully');
    return true;
  } catch (error) {
    console.error('Error fixing materials table:', error);
    throw error;
  }
}

// Check if this is the main module (ESM equivalent of require.main === module)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  fixMaterialsTable()
    .then(() => {
      console.log('Materials table fix completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Materials table fix failed:', error);
      process.exit(1);
    });
} 