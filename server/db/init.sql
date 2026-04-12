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
  id          INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  full_name   VARCHAR(100)      NOT NULL,
  email       VARCHAR(191)      NOT NULL,
  password    VARCHAR(255)      NOT NULL,           -- bcrypt hash
  role        ENUM('buyer','seller','owner')
              NOT NULL DEFAULT 'buyer',
  is_verified TINYINT(1)        NOT NULL DEFAULT 0, -- email verified?
  nid_verified TINYINT(1)       NOT NULL DEFAULT 0, -- NID verified?
  avatar_url  VARCHAR(500)               DEFAULT NULL,
  phone       VARCHAR(20)                DEFAULT NULL,
  address     VARCHAR(300)               DEFAULT NULL,
  bio         TEXT                       DEFAULT NULL,
  created_at  TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP
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
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
