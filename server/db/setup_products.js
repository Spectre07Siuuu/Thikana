const pool = require('../config/db')

async function setupDatabase() {
  try {
    console.log('Connecting to database to setup products tables...')
    
    // 1. Create table `products`
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
        seller_id   INT UNSIGNED NOT NULL,
        category    VARCHAR(50)  NOT NULL, -- house_sale, house_rent, furniture, appliance
        title       VARCHAR(255) NOT NULL,
        description TEXT         NOT NULL,
        price       DECIMAL(12,2) NOT NULL,
        location    VARCHAR(255) NOT NULL,
        status      ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        attributes  JSON         DEFAULT NULL, -- dynamic fields like beds, baths, condition
        created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        PRIMARY KEY (id),
        CONSTRAINT fk_product_seller FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)
    console.log('✅ products table created (or exists)')

    // 2. Create table `product_images`
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
        product_id  INT UNSIGNED NOT NULL,
        image_url   VARCHAR(500) NOT NULL,
        is_primary  TINYINT(1)   NOT NULL DEFAULT 0,
        created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        PRIMARY KEY (id),
        CONSTRAINT fk_product_image FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)
    console.log('✅ product_images table created (or exists)')

    console.log('Database setup complete.')
    process.exit(0)
  } catch (err) {
    console.error('Error setting up database:', err)
    process.exit(1)
  }
}

setupDatabase()
