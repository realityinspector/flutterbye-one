/**
 * Dashboard JSON Error Tracer
 * 
 * This script traces and diagnoses the "Unexpected end of input" error
 * in the dashboard API responses.
 */

const axios = require('axios');
const http = require('http');
const https = require('https');

// Disable SSL certificate validation for local testing
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  }),
  httpAgent: new http.Agent({
    keepAlive: true
  }),
  timeout: 10000, // 10 second timeout
  validateStatus: status => true // Don't throw on any status code
});

// Set up base URL for the API
const baseUrl = 'http://localhost:5000';
let authToken = null;

// Store session cookies
let sessionCookie = null;

// Wrap the log function to prepend timestamps
function log(message, data = '') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data);
}

// Helper function to extract cookies from response
function extractCookies(response) {
  const cookies = response.headers['set-cookie'];
  if (cookies && cookies.length) {
    return cookies.join('; ');
  }
  return null;
}

// Test login to get authentication token
async function testLogin() {
  log('1. Testing login endpoint...');
  
  try {
    const response = await axiosInstance.post(`${baseUrl}/api/login`, {
      username: 'test',
      password: 'password'
    });
    
    log('Login response status:', response.status);
    
    if (response.status === 200 && response.data && response.data.token) {
      log('✓ Login successful');
      authToken = response.data.token;
      
      // Extract cookies if available
      const cookies = extractCookies(response);
      if (cookies) {
        sessionCookie = cookies;
        log('Session cookies obtained');
      }
      
      return true;
    } else {
      log('✗ Login failed - invalid credentials or server error');
      log('Response data:', response.data);
      return false;
    }
  } catch (error) {
    log('✗ Login error:', error.message);
    return false;
  }
}

// Test the dashboard-check endpoint
async function testDashboardCheck() {
  log('\n2. Testing dashboard-check endpoint...');
  
  try {
    const headers = {};
    
    // Add token if available
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    
    // Add cookie headers if available
    if (sessionCookie) {
      headers.Cookie = sessionCookie;
    }
    
    const response = await axiosInstance.get(`${baseUrl}/dashboard-check`, { 
      headers,
      validateStatus: () => true,
      transformResponse: [(data) => {
        // Return the raw string data instead of JSON parsing it
        return data;
      }]
    });
    
    log('Dashboard check response status:', response.status);
    log('Raw response data (unparsed):', response.data);
    
    // Check if the response is valid JSON by attempting to parse it
    try {
      const parsed = JSON.parse(response.data);
      log('✓ Valid JSON response from dashboard-check:', JSON.stringify(parsed, null, 2));
      
      if (parsed && parsed.authenticated) {
        log('✓ Dashboard check successful - user is authenticated');
        return true;
      } else {
        log('✗ Dashboard check failed - not authenticated');
        return false;
      }
    } catch (e) {
      log('✗ JSON parse error in dashboard-check response:', e.message);
      log('This is likely the source of the "Unexpected end of input" error');
      return false;
    }
  } catch (error) {
    log('✗ Dashboard check error:', error.message);
    return false;
  }
}

// Test the API endpoints used by the dashboard
async function testDashboardAPI() {
  log('\n3. Testing dashboard API endpoints...');
  
  const endpoints = [
    '/api/leads',
    '/api/analytics/dashboard',
    '/api/analytics/call-outcomes',
    '/api/user'
  ];
  
  const headers = {};
  
  // Add token if available
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  
  // Add cookie headers if available
  if (sessionCookie) {
    headers.Cookie = sessionCookie;
  }
  
  // Test each endpoint
  for (const endpoint of endpoints) {
    log(`Testing endpoint: ${endpoint}`);
    
    try {
      const response = await axiosInstance.get(`${baseUrl}${endpoint}`, {
        headers,
        validateStatus: () => true,
        transformResponse: [(data) => {
          // Return the raw string data instead of JSON parsing it
          return data;
        }] 
      });
      
      log(`Response status for ${endpoint}:`, response.status);
      
      // Attempt to log a preview of the raw response
      if (response.data) {
        const preview = response.data.length > 100 ? 
          `${response.data.substring(0, 100)}...` : 
          response.data;
          
        log(`Raw response from ${endpoint}:`, preview);
      }
      
      // Check if the response is valid JSON
      try {
        JSON.parse(response.data);
        log(`✓ Valid JSON response from ${endpoint}`);
      } catch (e) {
        log(`✗ Invalid JSON from ${endpoint}: ${e.message}`);
        log('This endpoint may be causing the "Unexpected end of input" error');
        
        // Analyze the raw response further
        log(`Detailed raw response from ${endpoint} (first 500 chars):`);
        console.log(response.data ? response.data.substring(0, 500) : '(empty response)');
        console.log('---End of raw response excerpt---');
        
        // Check if it's truly an empty response
        if (!response.data || response.data.trim() === '') {
          log('Response is empty, which would cause a JSON parse error');
        }
        // Check if it's incomplete JSON
        else if (response.data && 
                (response.data.endsWith('{') || 
                 response.data.endsWith('[') || 
                 response.data.endsWith(',') || 
                 response.data.endsWith(':') ||
                 response.data.includes('"') && !response.data.includes('}'))) {
          log('Response appears to be incomplete JSON');
        }
      }
    } catch (error) {
      log(`✗ Error testing ${endpoint}:`, error.message);
    }
  }
}

// Main function to run all tests
async function main() {
  log('Starting dashboard JSON error trace...');
  
  try {
    // Authenticate first
    await testLogin();
    
    // Test dashboard check
    await testDashboardCheck();
    
    // Test dashboard API endpoints
    await testDashboardAPI();
    
    log('\nTests completed. Check the logs above for potential JSON parsing issues.');
  } catch (error) {
    log('Error running tests:', error.message);
  }
}

// Run the main function
main();