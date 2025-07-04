import { query } from '@/lib/db';

/**
 * Fix schema inconsistency between active and is_active columns in recycling_center_offers table
 */
export async function fixRecyclingCenterOffersSchema() {
  try {
    console.log('Starting schema fix for recycling_center_offers table...');
    
    // Check if is_active column exists
    const checkIsActiveColumn = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'recycling_center_offers' AND column_name = 'is_active'
    `;
    const isActiveResult = await query(checkIsActiveColumn);
    const isActiveExists = isActiveResult.rows.length > 0;
    
    // Check if active column exists
    const checkActiveColumn = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'recycling_center_offers' AND column_name = 'active'
    `;
    const activeResult = await query(checkActiveColumn);
    const activeExists = activeResult.rows.length > 0;
    
    console.log(`Column check results: is_active exists: ${isActiveExists}, active exists: ${activeExists}`);
    
    if (isActiveExists && !activeExists) {
      // Only is_active exists, rename to active
      await query(`ALTER TABLE recycling_center_offers RENAME COLUMN is_active TO active`);
      console.log('Renamed is_active column to active');
    } else if (!isActiveExists && activeExists) {
      // Only active exists, no action needed
      console.log('Only active column exists, no changes needed');
    } else if (isActiveExists && activeExists) {
      // Both columns exist, need to merge and drop is_active
      await query(`
        UPDATE recycling_center_offers 
        SET active = true 
        WHERE is_active = true AND active = false
      `);
      await query(`ALTER TABLE recycling_center_offers DROP COLUMN is_active`);
      console.log('Merged is_active into active column and dropped is_active');
    } else {
      // Neither column exists, create active
      await query(`ALTER TABLE recycling_center_offers ADD COLUMN active BOOLEAN DEFAULT TRUE`);
      console.log('Added active column (neither column existed)');
    }
    
    // Verify column structure after changes
    const verifyColumns = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'recycling_center_offers' AND column_name IN ('active', 'is_active')
    `;
    const verifyResult = await query(verifyColumns);
    console.log('Final columns:', verifyResult.rows.map(row => row.column_name));
    
    console.log('Schema fix completed successfully');
    return true;
  } catch (error) {
    console.error('Error during schema fix:', error);
    throw error;
  }
}

// Execute the fix if this file is run directly
if (require.main === module) {
  fixRecyclingCenterOffersSchema()
    .then(() => {
      console.log('Schema fix completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Schema fix failed:', error);
      process.exit(1);
    });
} 