const pool = require('./server/config/db')

async function run() {
  try {
    console.log('Adding points to users...')
    await pool.query('ALTER TABLE users ADD COLUMN points INT UNSIGNED NOT NULL DEFAULT 0')
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') console.error(err.message)
  }

  try {
    console.log('Creating reviews table...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
        order_item_id INT UNSIGNED NOT NULL,
        buyer_id      INT UNSIGNED NOT NULL,
        seller_id     INT UNSIGNED NOT NULL,
        product_id    INT UNSIGNED NOT NULL,
        rating        INT UNSIGNED NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment       TEXT         DEFAULT NULL,
        created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_order_item_review (order_item_id),
        KEY fk_rev_buyer   (buyer_id),
        KEY fk_rev_seller  (seller_id),
        KEY fk_rev_product (product_id),
        CONSTRAINT fk_rev_oi      FOREIGN KEY (order_item_id) REFERENCES order_items (id) ON DELETE CASCADE,
        CONSTRAINT fk_rev_buyer   FOREIGN KEY (buyer_id)      REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_rev_seller  FOREIGN KEY (seller_id)     REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_rev_product FOREIGN KEY (product_id)    REFERENCES products (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
  } catch (err) {
    console.error(err.message)
  }

  console.log('Done.')
  process.exit(0)
}

run()
