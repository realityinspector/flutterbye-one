/**
 * Centralized configuration for the application
 * Contains environment variables and configuration settings
 */

module.exports = {
  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || 'flutterbye-development-secret-key',
  JWT_EXPIRES_IN: '24h', // 24 hours

  // Server configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Base URL for the application
  SERVER_URL: process.env.SERVER_URL || 'http://localhost:5000',

  // Database configuration is handled via DATABASE_URL environment variable
};
