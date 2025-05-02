// Script to push the database schema
require('dotenv').config();
const { pool } = require('../server/db');
const { 
  users, 
  globalLeads, 
  userLeads, 
  calls, 
  aiConfigs, 
  aiInteractions, 
  aiTools, 
  aiToolExecutions 
} = require('../shared/db/schema');

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
    
    CREATE TABLE IF NOT EXISTS ai_configs (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      default_model VARCHAR(100) NOT NULL,
      web_search_model VARCHAR(100) NOT NULL DEFAULT 'openai/gpt-4o:online',
      fallback_models JSONB,
      system_prompt TEXT,
      max_tokens INTEGER DEFAULT 2000,
      temperature REAL DEFAULT 0.7,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS ai_interactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      config_id INTEGER REFERENCES ai_configs(id) ON DELETE SET NULL,
      model VARCHAR(100) NOT NULL,
      prompt TEXT NOT NULL,
      response TEXT,
      used_web_search BOOLEAN DEFAULT FALSE,
      search_query TEXT,
      search_results JSONB,
      token_count INTEGER,
      duration INTEGER,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      error TEXT,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS ai_tools (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT NOT NULL,
      parameters JSONB NOT NULL,
      handler_function VARCHAR(100) NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS ai_tool_executions (
      id SERIAL PRIMARY KEY,
      interaction_id INTEGER REFERENCES ai_interactions(id) ON DELETE CASCADE NOT NULL,
      tool_id INTEGER REFERENCES ai_tools(id) ON DELETE SET NULL,
      arguments JSONB NOT NULL,
      result JSONB,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      error TEXT,
      duration INTEGER,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
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
