/**
 * React Native App Configuration
 * 
 * This file contains configuration settings for the FlutterBye CRM React Native app.
 * It uses the same shared models and services as the web version.
 */

// API configuration
export const API_CONFIG = {
  // Base URL for the API
  // For development with Expo, you might use the local network IP of your dev machine
  BASE_URL: 'https://api.flutterbye.com',
  
  // API timeout in milliseconds
  TIMEOUT: 30000,
  
  // API version
  VERSION: 'v1',
  
  // API endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/login',
      REGISTER: '/api/register',
      LOGOUT: '/api/logout',
      VERIFY: '/api/user'
    },
    LEADS: {
      LIST: '/api/leads',
      DETAIL: '/api/leads/:id',
      CREATE: '/api/leads',
      UPDATE: '/api/leads/:id',
      DELETE: '/api/leads/:id'
    },
    CALLS: {
      LIST: '/api/calls',
      DETAIL: '/api/calls/:id',
      CREATE: '/api/calls',
      UPDATE: '/api/calls/:id',
      DELETE: '/api/calls/:id',
      LEAD_CALLS: '/api/leads/:leadId/calls'
    },
    ANALYTICS: {
      DASHBOARD: '/api/analytics/dashboard',
      PERFORMANCE: '/api/analytics/user-performance',
      CALL_OUTCOMES: '/api/analytics/call-outcomes'
    }
  }
};

// Storage keys for consistent data storage
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  LEADS_CACHE: 'leads_cache',
  CALLS_CACHE: 'calls_cache',
  SETTINGS: 'app_settings',
  OFFLINE_QUEUE: 'offline_queue',
  LAST_SYNC: 'last_sync'
};

// App theme configuration - should match web app styling
export const THEME = {
  COLORS: {
    PRIMARY: '#4a6cf7',
    PRIMARY_DARK: '#3a5cd7',
    PRIMARY_LIGHT: '#6a8cf7',
    SECONDARY: '#5fd3f3',
    ACCENT: '#f76a8c',
    SUCCESS: '#27ae60',
    WARNING: '#f39c12',
    DANGER: '#e74c3c',
    DARK: '#333333',
    LIGHT: '#f5f7fa',
    GRAY: '#9E9E9E',
    GRAY_LIGHT: '#e0e0e0',
    TEXT_DARK: '#333333',
    TEXT_LIGHT: '#f4f4f4',
    BACKGROUND: '#f5f7fa',
    CARD: '#FFFFFF'
  },
  TYPOGRAPHY: {
    FONT_FAMILY: {
      REGULAR: 'System',
      BOLD: 'System-Bold'
    },
    FONT_SIZE: {
      SMALL: 12,
      MEDIUM: 14,
      REGULAR: 16,
      LARGE: 18,
      XLARGE: 20,
      XXLARGE: 24,
      HEADING: 28
    }
  },
  SPACING: {
    SMALL: 8,
    MEDIUM: 16,
    LARGE: 24,
    XLARGE: 32
  },
  BORDER_RADIUS: {
    SMALL: 4,
    MEDIUM: 8,
    LARGE: 16,
    CIRCLE: 999
  },
  SHADOW: {
    SMALL: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2
    },
    MEDIUM: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
      elevation: 4
    },
    LARGE: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8
    }
  }
};

// App settings
export const APP_SETTINGS = {
  // Default number of items per page
  PAGE_SIZE: 20,
  
  // Default language
  DEFAULT_LANGUAGE: 'en',
  
  // Cache duration in milliseconds
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  
  // Sync interval in milliseconds
  SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
  
  // Enable offline mode
  ENABLE_OFFLINE_MODE: true,
  
  // Enable auto-sync
  ENABLE_AUTO_SYNC: true,
  
  // Auto-logout after inactivity (milliseconds)
  AUTO_LOGOUT_TIME: 30 * 60 * 1000, // 30 minutes
  
  // Default sort for leads list
  DEFAULT_LEAD_SORT: {
    field: 'createdAt',
    direction: 'desc'
  }
};

// Authentication settings
export const AUTH_SETTINGS = {
  // Token expiry in milliseconds (matches server setting)
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  
  // Enable biometric authentication
  ENABLE_BIOMETRIC: true,
  
  // Remember user credentials
  ENABLE_REMEMBER_ME: true
};

// Default export with all configurations
export default {
  API: API_CONFIG,
  STORAGE: STORAGE_KEYS,
  THEME,
  SETTINGS: APP_SETTINGS,
  AUTH: AUTH_SETTINGS
};