/**
 * clean_db.js
 * Wipes all data from the Thikana database while keeping the schema intact.
 * Resets all AUTO_INCREMENT IDs.
 * Usage: node server/db/clean_db.js
 */
require('dotenv').config();
const pool = require('../config/db');

async function cleanDatabase() {
  console.log('🧹 Starting database cleanup...');
  
  const tables = [
    'notifications',
    'messages',
    'order_items',
    'orders',
    'cart_items',
    'reviews',
    'inquiries',
    'favourites',
    'product_images',
    'products',
    'nid_submissions',
    'users'
  ];

  try {
    // Disable foreign key checks to allow truncation
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    
    for (const table of tables) {
      console.log(`   - Wiping table: ${table}`);
      await pool.query(`TRUNCATE TABLE ${table}`);
    }
    
    // Re-enable foreign key checks
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('\n✨ Database is now completely clean and IDs have been reset.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
}

cleanDatabase();
