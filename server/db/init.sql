-- ─────────────────────────────────────────────────────────
-- Thikana Database Setup (PostgreSQL / Supabase)
-- Run this in the Supabase SQL Editor
-- ─────────────────────────────────────────────────────────

-- ─── Helper: auto-update updated_at trigger ─────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Users ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                     SERIAL PRIMARY KEY,
  full_name              VARCHAR(100)      NOT NULL,
  email                  VARCHAR(191)      NOT NULL UNIQUE,
  password               VARCHAR(255)      NOT NULL,
  role                   VARCHAR(10)       NOT NULL DEFAULT 'buyer'
                         CHECK (role IN ('buyer','seller','admin')),
  is_verified            BOOLEAN           NOT NULL DEFAULT FALSE,
  nid_verified           BOOLEAN           NOT NULL DEFAULT FALSE,
  is_admin               BOOLEAN           NOT NULL DEFAULT FALSE,
  avatar_url             VARCHAR(500)               DEFAULT NULL,
  phone                  VARCHAR(20)                DEFAULT NULL,
  address                VARCHAR(300)               DEFAULT NULL,
  bio                    TEXT                       DEFAULT NULL,
  otp_code               VARCHAR(6)                 DEFAULT NULL,
  otp_expires_at         TIMESTAMP                  DEFAULT NULL,
  reset_token            VARCHAR(64)                DEFAULT NULL,
  reset_token_expires_at TIMESTAMP                  DEFAULT NULL,
  points                 INTEGER           NOT NULL DEFAULT 0,
  created_at             TIMESTAMP         NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMP         NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Refresh Tokens ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(512) NOT NULL,
  expires_at TIMESTAMP    NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_token ON refresh_tokens(token);

-- ─── NID Submissions ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS nid_submissions (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nid_number      VARCHAR(30)  NOT NULL,
  nid_front_url   VARCHAR(500) NOT NULL,
  nid_selfie_url  VARCHAR(500) NOT NULL,
  status          VARCHAR(10)  NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
  admin_note      TEXT                 DEFAULT NULL,
  reviewed_at     TIMESTAMP            DEFAULT NULL,
  created_at      TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ─── Products ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  seller_id   INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category    VARCHAR(50)   NOT NULL,
  title       VARCHAR(255)  NOT NULL,
  description TEXT          NOT NULL,
  price       DECIMAL(12,2) NOT NULL,
  location    VARCHAR(255)  NOT NULL,
  lat         DECIMAL(10,8) DEFAULT NULL,
  lng         DECIMAL(11,8) DEFAULT NULL,
  status      VARCHAR(10)   NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','approved','rejected','sold','booked')),
  attributes  JSONB         DEFAULT NULL,
  views       INTEGER       NOT NULL DEFAULT 0,
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_products_status   ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_prod_cat_price    ON products(category, status, price);
CREATE INDEX IF NOT EXISTS idx_products_seller   ON products(seller_id);

-- ─── Product Images ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
  id         SERIAL PRIMARY KEY,
  product_id INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url  VARCHAR(500) NOT NULL,
  is_primary BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── Favourites ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favourites (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER   NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ─── Inquiries ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inquiries (
  id           SERIAL PRIMARY KEY,
  product_id   INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sender_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message      TEXT         NOT NULL,
  sender_name  VARCHAR(100) NOT NULL,
  sender_phone VARCHAR(20)  DEFAULT NULL,
  is_read      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── Cart Items ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER   NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INTEGER   NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ─── Orders ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                  SERIAL PRIMARY KEY,
  buyer_id            INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status              VARCHAR(12)   NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  total_amount        DECIMAL(12,2) NOT NULL DEFAULT 0,
  delivery_fee        DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_booking          BOOLEAN       NOT NULL DEFAULT FALSE,
  booking_amount      DECIMAL(12,2)          DEFAULT NULL,
  shipping_address    VARCHAR(500)  NOT NULL,
  phone               VARCHAR(20)   NOT NULL,
  note                TEXT                   DEFAULT NULL,
  cancellation_reason VARCHAR(100)           DEFAULT NULL,
  cancellation_note   TEXT                   DEFAULT NULL,
  cancelled_by        INTEGER                DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Order Items ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id             SERIAL PRIMARY KEY,
  order_id       INTEGER       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     INTEGER       NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id      INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price          DECIMAL(12,2) NOT NULL,
  quantity       INTEGER       NOT NULL DEFAULT 1,
  is_booking     BOOLEAN       NOT NULL DEFAULT FALSE,
  booking_amount DECIMAL(12,2)          DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_oi_seller_order ON order_items(seller_id, order_id);

-- ─── Reviews ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id            SERIAL PRIMARY KEY,
  order_item_id INTEGER   NOT NULL UNIQUE REFERENCES order_items(id) ON DELETE CASCADE,
  buyer_id      INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id     INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id    INTEGER   NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating        INTEGER   NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment       TEXT      DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rev_product ON reviews(product_id, created_at);

-- ─── Messages ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  sender_id   INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  INTEGER               DEFAULT NULL REFERENCES products(id) ON DELETE SET NULL,
  content     TEXT                   DEFAULT NULL,
  type        VARCHAR(10)  NOT NULL DEFAULT 'text'
              CHECK (type IN ('text','image','file','voice')),
  file_url    VARCHAR(500)           DEFAULT NULL,
  file_name   VARCHAR(255)           DEFAULT NULL,
  is_read     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_msg_conversation ON messages(sender_id, receiver_id, created_at);

-- ─── Notifications ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(50)  NOT NULL DEFAULT 'system',
  title      VARCHAR(255) NOT NULL,
  body       TEXT                  DEFAULT NULL,
  link       VARCHAR(500)          DEFAULT NULL,
  is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(user_id, is_read);
