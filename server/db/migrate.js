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

  console.log('\nMigrations complete.')
  process.exit(0)
}

migrate().catch(err => {
  console.error(err)
  process.exit(1)
})
