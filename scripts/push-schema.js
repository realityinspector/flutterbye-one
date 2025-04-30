// Script to push the database schema
require('dotenv').config();
const { pool } = require('../server/db');
const { users, globalLeads, userLeads, calls } = require('../shared/schema');

async function pushSchema() {
  console.log('Pushing schema to database...');
  
  try {
    // Create tables if they don't exist
    const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      full_name VARCHAR(100) NOT NULL,
      company_name VARCHAR(100),
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      has_completed_setup BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS global_leads (
      id SERIAL PRIMARY KEY,
      company_name VARCHAR(100) NOT NULL,
      contact_name VARCHAR(100) NOT NULL,
      phone_number VARCHAR(20) NOT NULL,
      email VARCHAR(100),
      address VARCHAR(200),
      city VARCHAR(50),
      state VARCHAR(50),
      zip_code VARCHAR(20),
      industry VARCHAR(50),
      website VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_leads (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      global_lead_id INTEGER NOT NULL REFERENCES global_leads(id),
      status VARCHAR(20) NOT NULL DEFAULT 'new',
      priority INTEGER NOT NULL DEFAULT 5,
      notes TEXT,
      last_contacted_at TIMESTAMP,
      reminder_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calls (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_lead_id INTEGER NOT NULL REFERENCES user_leads(id) ON DELETE CASCADE,
      call_date TIMESTAMP NOT NULL,
      duration INTEGER,
      outcome VARCHAR(20),
      notes TEXT,
      reminder_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session (
      sid VARCHAR NOT NULL PRIMARY KEY,
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL
    );
    `;
    
    await pool.query(query);
    
    console.log('Schema pushed successfully');
  } catch (error) {
    console.error('Error pushing schema:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

pushSchema();
