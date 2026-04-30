-- ─────────────────────────────────────────────────────────
-- Thikana Database Setup
-- Run this in phpMyAdmin or MySQL CLI:
--   mysql -u root -p < server/db/init.sql
-- ─────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS thikana_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE thikana_db;

-- ─── Users ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                    INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  full_name             VARCHAR(100)      NOT NULL,
  email                 VARCHAR(191)      NOT NULL,
  password              VARCHAR(255)      NOT NULL,           -- bcrypt hash
  role                  ENUM('buyer','seller','admin')
                        NOT NULL DEFAULT 'buyer',
  is_verified           TINYINT(1)        NOT NULL DEFAULT 0, -- email verified?
  nid_verified          TINYINT(1)        NOT NULL DEFAULT 0, -- NID verified?
  is_admin              TINYINT(1)        NOT NULL DEFAULT 0, -- admin flag
  avatar_url            VARCHAR(500)               DEFAULT NULL,
  phone                 VARCHAR(20)                DEFAULT NULL,
  address               VARCHAR(300)               DEFAULT NULL,
  bio                   TEXT                       DEFAULT NULL,
  otp_code              VARCHAR(6)                 DEFAULT NULL,
  otp_expires_at        DATETIME                   DEFAULT NULL,
  reset_token           VARCHAR(64)                DEFAULT NULL,
  reset_token_expires_at DATETIME                  DEFAULT NULL,
  points                INT UNSIGNED               NOT NULL DEFAULT 0,
  created_at            TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Refresh Tokens (optional, for future use) ───────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  token      VARCHAR(512) NOT NULL,
  expires_at DATETIME     NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY fk_rt_user (user_id),
  KEY idx_refresh_token (token),
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── NID Submissions ─────────────────────────────────────
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
  CONSTRAINT fk_nid_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Products ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  seller_id   INT UNSIGNED NOT NULL,
  category    VARCHAR(50)  NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT         NOT NULL,
  price       DECIMAL(12,2) NOT NULL,
  location    VARCHAR(255) NOT NULL,
  lat         DECIMAL(10,8) DEFAULT NULL,
  lng         DECIMAL(11,8) DEFAULT NULL,
  status      ENUM('pending','approved','rejected','sold','booked') NOT NULL DEFAULT 'pending',
  attributes  JSON         DEFAULT NULL,
  views       INT UNSIGNED NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_products_status   (status),
  KEY idx_products_category (category),
  KEY idx_prod_cat_price    (category, status, price),
  KEY idx_products_seller   (seller_id),
  CONSTRAINT fk_product_seller FOREIGN KEY (seller_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Product Images ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id INT UNSIGNED NOT NULL,
  image_url  VARCHAR(500) NOT NULL,
  is_primary TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY fk_product_image (product_id),
  CONSTRAINT fk_product_image FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Favourites ───────────────────────────────────────────
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Inquiries (contact seller) ───────────────────────────
CREATE TABLE IF NOT EXISTS inquiries (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id  INT UNSIGNED NOT NULL,
  sender_id   INT UNSIGNED NOT NULL,
  seller_id   INT UNSIGNED NOT NULL,
  message     TEXT         NOT NULL,
  sender_name VARCHAR(100) NOT NULL,
  sender_phone VARCHAR(20) DEFAULT NULL,
  is_read     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY fk_inq_product (product_id),
  KEY fk_inq_sender  (sender_id),
  KEY fk_inq_seller  (seller_id),
  CONSTRAINT fk_inq_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT fk_inq_sender  FOREIGN KEY (sender_id)  REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_inq_seller  FOREIGN KEY (seller_id)  REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Cart Items ───────────────────────────────────────────
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Orders ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  buyer_id         INT UNSIGNED  NOT NULL,
  status           ENUM('pending','confirmed','shipped','delivered','cancelled')
                   NOT NULL DEFAULT 'pending',
  total_amount     DECIMAL(12,2) NOT NULL DEFAULT 0,
  delivery_fee     DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_booking       TINYINT(1)    NOT NULL DEFAULT 0,
  booking_amount   DECIMAL(12,2)          DEFAULT NULL,
  shipping_address VARCHAR(500)  NOT NULL,
  phone            VARCHAR(20)   NOT NULL,
  note             TEXT                   DEFAULT NULL,
  cancellation_reason VARCHAR(100)        DEFAULT NULL,
  cancellation_note   TEXT                DEFAULT NULL,
  cancelled_by     INT UNSIGNED           DEFAULT NULL,
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                   ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY fk_order_buyer (buyer_id),
  KEY fk_order_cancelled_by (cancelled_by),
  CONSTRAINT fk_order_buyer FOREIGN KEY (buyer_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_order_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Order Items ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  order_id   INT UNSIGNED  NOT NULL,
  product_id INT UNSIGNED  NOT NULL,
  seller_id  INT UNSIGNED  NOT NULL,
  price      DECIMAL(12,2) NOT NULL,
  quantity   INT UNSIGNED  NOT NULL DEFAULT 1,
  is_booking TINYINT(1)    NOT NULL DEFAULT 0,
  booking_amount DECIMAL(12,2) DEFAULT NULL,

  PRIMARY KEY (id),
  KEY fk_oi_order   (order_id),
  KEY fk_oi_product (product_id),
  KEY fk_oi_seller  (seller_id),
  KEY idx_oi_seller_order (seller_id, order_id),
  CONSTRAINT fk_oi_order   FOREIGN KEY (order_id)   REFERENCES orders (id)   ON DELETE CASCADE,
  CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_seller  FOREIGN KEY (seller_id)  REFERENCES users (id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Reviews ──────────────────────────────────────────────
-- (must come after order_items because of fk_rev_oi)
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
  KEY idx_rev_product (product_id, created_at),
  CONSTRAINT fk_rev_oi      FOREIGN KEY (order_item_id) REFERENCES order_items (id) ON DELETE CASCADE,
  CONSTRAINT fk_rev_buyer   FOREIGN KEY (buyer_id)      REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_rev_seller  FOREIGN KEY (seller_id)     REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_rev_product FOREIGN KEY (product_id)    REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Messages ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sender_id   INT UNSIGNED NOT NULL,
  receiver_id INT UNSIGNED NOT NULL,
  product_id  INT UNSIGNED          DEFAULT NULL,
  content     TEXT                  DEFAULT NULL,
  type        ENUM('text','image','file','voice') NOT NULL DEFAULT 'text',
  file_url    VARCHAR(500)          DEFAULT NULL,
  file_name   VARCHAR(255)          DEFAULT NULL,
  is_read     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY fk_msg_sender   (sender_id),
  KEY fk_msg_receiver (receiver_id),
  KEY fk_msg_product  (product_id),
  KEY idx_msg_conversation (sender_id, receiver_id, created_at),
  CONSTRAINT fk_msg_sender   FOREIGN KEY (sender_id)   REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_receiver FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_product  FOREIGN KEY (product_id)  REFERENCES products (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Notifications ────────────────────────────────────────
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
