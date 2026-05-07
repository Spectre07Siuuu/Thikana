const { Pool } = require('pg')
require('dotenv').config()

/**
 * PostgreSQL connection pool (Supabase).
 * Uses DATABASE_URL from .env
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

// Test the connection on startup
pool.query('SELECT NOW()')
  .then(() => {
    console.log('✅ PostgreSQL connected — Supabase')
  })
  .catch((err) => {
    console.error('❌ PostgreSQL connection failed:', err.message)
    process.exit(1)
  })

module.exports = pool
