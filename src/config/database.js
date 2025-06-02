// src/config/database.js
const { Pool } = require('pg');
const path = require('path');

// Load environment variables
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // maximum number of clients in the pool
  connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
  idleTimeoutMillis: 30000, // close & remove clients which have been idle > 30 seconds
});

// Test the connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  process.exit(-1);
});

// Create users table if it doesn't exist
const createUsersTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  `;
  
  try {
    await pool.query(query);
    console.log('✅ Users table ready');
  } catch (error) {
    console.error('❌ Error creating users table:', error);
    throw error;
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    await createUsersTable();
    console.log('📊 Database initialization complete');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

module.exports = {
  pool,
  initializeDatabase
};