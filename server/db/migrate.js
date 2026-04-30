/**
 * migrate.js
 * Run ALTER TABLE statements on an existing database without data loss.
 * Usage: node server/db/migrate.js
 */
require('dotenv').config()
const pool = require('../config/db')

async function run(label, sql) {
  try {
    await pool.query(sql)
    console.log(`✅ ${label}`)
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_KEYNAME') {
      console.log(`⏭  ${label} — already applied`)
    } else {
      console.error(`❌ ${label}:`, err.message)
    }
  }
}

async function migrate() {
  console.log('Running migrations…\n')

  // ── users: new columns ───────────────────────────────────
  await run('users.is_admin',               `ALTER TABLE users ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0 AFTER nid_verified`)
  await run('users.otp_code',               `ALTER TABLE users ADD COLUMN otp_code VARCHAR(6) DEFAULT NULL AFTER bio`)
  await run('users.otp_expires_at',         `ALTER TABLE users ADD COLUMN otp_expires_at DATETIME DEFAULT NULL AFTER otp_code`)
  await run('users.reset_token',            `ALTER TABLE users ADD COLUMN reset_token VARCHAR(64) DEFAULT NULL AFTER otp_expires_at`)
  await run('users.reset_token_expires_at', `ALTER TABLE users ADD COLUMN reset_token_expires_at DATETIME DEFAULT NULL AFTER reset_token`)
  await run('users.points',                 `ALTER TABLE users ADD COLUMN points INT UNSIGNED NOT NULL DEFAULT 0 AFTER reset_token_expires_at`)
  await run('users.role enum expand',       `ALTER TABLE users MODIFY COLUMN role ENUM('buyer','seller','owner','admin') NOT NULL DEFAULT 'buyer'`)
  await run('users.owner->seller',          `UPDATE users SET role = 'seller' WHERE role = 'owner'`)
  await run('users.admin role sync',        `UPDATE users SET role = 'admin' WHERE is_admin = 1`)
  await run('users.role enum final',        `ALTER TABLE users MODIFY COLUMN role ENUM('buyer','seller','admin') NOT NULL DEFAULT 'buyer'`)

  // ── refresh tokens table ────────────────────────────────
  await run('refresh_tokens table', `
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id    INT UNSIGNED NOT NULL,
      token      VARCHAR(512) NOT NULL,
      expires_at DATETIME     NOT NULL,
      created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY fk_rt_user (user_id),
      KEY idx_refresh_token (token),
      CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await run('refresh_tokens.token index', `ALTER TABLE refresh_tokens ADD INDEX idx_refresh_token (token)`)

  // ── nid_submissions table ────────────────────────────────
  await run('nid_submissions table', `
    CREATE TABLE IF NOT EXISTS nid_submissions (
      id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id         INT UNSIGNED NOT NULL,
      nid_number      VARCHAR(30)  NOT NULL,
      nid_front_url   VARCHAR(500) NOT NULL,
      nid_selfie_url  VARCHAR(500) NOT NULL,
      status          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
      admin_note      TEXT                 DEFAULT NULL,
      reviewed_at     DATETIME             DEFAULT NULL,
      created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY fk_nid_user (user_id),
      CONSTRAINT fk_nid_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  // ── products: add 'sold' to status ENUM + views column ───
  await run('products.status sold', `ALTER TABLE products MODIFY COLUMN status ENUM('pending','approved','rejected','sold') NOT NULL DEFAULT 'pending'`)
  await run('products.views',       `ALTER TABLE products ADD COLUMN views INT UNSIGNED NOT NULL DEFAULT 0 AFTER attributes`)
  await run('products.lat',         `ALTER TABLE products ADD COLUMN lat DECIMAL(10,8) DEFAULT NULL AFTER location`)
  await run('products.lng',         `ALTER TABLE products ADD COLUMN lng DECIMAL(11,8) DEFAULT NULL AFTER lat`)

  // ── favourites table ─────────────────────────────────────
  await run('favourites table', `
    CREATE TABLE IF NOT EXISTS favourites (
      id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id    INT UNSIGNED NOT NULL,
      product_id INT UNSIGNED NOT NULL,
      created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_fav (user_id, product_id),
      KEY fk_fav_product (product_id),
      CONSTRAINT fk_fav_user    FOREIGN KEY (user_id)    REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT fk_fav_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  // ── inquiries table ──────────────────────────────────────
  await run('inquiries table', `
    CREATE TABLE IF NOT EXISTS inquiries (
      id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
      product_id   INT UNSIGNED NOT NULL,
      sender_id    INT UNSIGNED NOT NULL,
      seller_id    INT UNSIGNED NOT NULL,
      message      TEXT         NOT NULL,
      sender_name  VARCHAR(100) NOT NULL,
      sender_phone VARCHAR(20)  DEFAULT NULL,
      is_read      TINYINT(1)   NOT NULL DEFAULT 0,
      created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY fk_inq_product (product_id),
      KEY fk_inq_sender  (sender_id),
      KEY fk_inq_seller  (seller_id),
      CONSTRAINT fk_inq_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
      CONSTRAINT fk_inq_sender  FOREIGN KEY (sender_id)  REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT fk_inq_seller  FOREIGN KEY (seller_id)  REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  // ── reviews table ─────────────────────────────────────────
  await run('reviews table', `
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

  // ── cart_items table ─────────────────────────────────────
  await run('cart_items table', `
    CREATE TABLE IF NOT EXISTS cart_items (
      id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id    INT UNSIGNED NOT NULL,
      product_id INT UNSIGNED NOT NULL,
      quantity   INT UNSIGNED NOT NULL DEFAULT 1,
      created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_cart (user_id, product_id),
      KEY fk_cart_product (product_id),
      CONSTRAINT fk_cart_user    FOREIGN KEY (user_id)    REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  // ── orders table ──────────────────────────────────────────
  await run('orders table', `
    CREATE TABLE IF NOT EXISTS orders (
      id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
      buyer_id         INT UNSIGNED NOT NULL,
      status           ENUM('pending','confirmed','shipped','delivered','cancelled') NOT NULL DEFAULT 'confirmed',
      total_amount     DECIMAL(12,2) NOT NULL DEFAULT 0,
      delivery_fee     DECIMAL(12,2) NOT NULL DEFAULT 0,
      shipping_address VARCHAR(500)  NOT NULL,
      phone            VARCHAR(20)   NOT NULL,
      note             TEXT                   DEFAULT NULL,
      created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY fk_order_buyer (buyer_id),
      CONSTRAINT fk_order_buyer FOREIGN KEY (buyer_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await run('orders.delivery_fee', `ALTER TABLE orders ADD COLUMN delivery_fee DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER total_amount`)

  // ── order_items table ─────────────────────────────────────
  await run('order_items table', `
    CREATE TABLE IF NOT EXISTS order_items (
      id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
      order_id   INT UNSIGNED  NOT NULL,
      product_id INT UNSIGNED  NOT NULL,
      seller_id  INT UNSIGNED  NOT NULL,
      price      DECIMAL(12,2) NOT NULL,
      quantity   INT UNSIGNED  NOT NULL DEFAULT 1,
      PRIMARY KEY (id),
      KEY fk_oi_order   (order_id),
      KEY fk_oi_product (product_id),
      KEY fk_oi_seller  (seller_id),
      CONSTRAINT fk_oi_order   FOREIGN KEY (order_id)   REFERENCES orders (id)   ON DELETE CASCADE,
      CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
      CONSTRAINT fk_oi_seller  FOREIGN KEY (seller_id)  REFERENCES users (id)    ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  // ── messages table ────────────────────────────────────────
  await run('messages table', `
    CREATE TABLE IF NOT EXISTS messages (
      id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
      sender_id   INT UNSIGNED NOT NULL,
      receiver_id INT UNSIGNED NOT NULL,
      product_id  INT UNSIGNED          DEFAULT NULL,
      content     TEXT         NOT NULL,
      is_read     TINYINT(1)   NOT NULL DEFAULT 0,
      created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY fk_msg_sender   (sender_id),
      KEY fk_msg_receiver (receiver_id),
      KEY fk_msg_product  (product_id),
      CONSTRAINT fk_msg_sender   FOREIGN KEY (sender_id)   REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT fk_msg_receiver FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT fk_msg_product  FOREIGN KEY (product_id)  REFERENCES products (id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  // ── notifications table ───────────────────────────────────
  await run('notifications table', `
    CREATE TABLE IF NOT EXISTS notifications (
      id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id    INT UNSIGNED NOT NULL,
      type       VARCHAR(50)  NOT NULL DEFAULT 'system',
      title      VARCHAR(255) NOT NULL,
      body       TEXT                  DEFAULT NULL,
      link       VARCHAR(500)          DEFAULT NULL,
      is_read    TINYINT(1)   NOT NULL DEFAULT 0,
      created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY fk_notif_user (user_id),
      KEY idx_notif_read (user_id, is_read),
      CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  // ── messages: add type, file_url, file_name columns ─────
  await run('messages.type',      `ALTER TABLE messages ADD COLUMN type ENUM('text','image','file','voice') NOT NULL DEFAULT 'text' AFTER content`)
  await run('messages.file_url',  `ALTER TABLE messages ADD COLUMN file_url VARCHAR(500) DEFAULT NULL AFTER type`)
  await run('messages.file_name', `ALTER TABLE messages ADD COLUMN file_name VARCHAR(255) DEFAULT NULL AFTER file_url`)
  await run('messages.content nullable', `ALTER TABLE messages MODIFY COLUMN content TEXT DEFAULT NULL`)

  // ── orders: delivery_fee ──────────────────────────────────
  await run('orders.delivery_fee', `ALTER TABLE orders ADD COLUMN delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 50.00 AFTER total_amount`)

  // ── booking support ─────────────────────────────────────
  await run('orders.is_booking',       `ALTER TABLE orders ADD COLUMN is_booking TINYINT(1) NOT NULL DEFAULT 0 AFTER delivery_fee`)
  await run('orders.booking_amount',   `ALTER TABLE orders ADD COLUMN booking_amount DECIMAL(12,2) DEFAULT NULL AFTER is_booking`)
  await run('order_items.is_booking',      `ALTER TABLE order_items ADD COLUMN is_booking TINYINT(1) NOT NULL DEFAULT 0 AFTER quantity`)
  await run('order_items.booking_amount',  `ALTER TABLE order_items ADD COLUMN booking_amount DECIMAL(12,2) DEFAULT NULL AFTER is_booking`)

  console.log('\nMigrations complete.')
  process.exit(0)
}

migrate().catch(err => {
  console.error(err)
  process.exit(1)
})
