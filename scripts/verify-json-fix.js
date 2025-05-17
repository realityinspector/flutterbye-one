/**
 * Verify JSON Error Fix
 * 
 * This script tests all dashboard API endpoints to confirm that the
 * "Unexpected end of input" error has been resolved.
 */

const axios = require('axios');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Create a test agent with longer timeout
const agent = new http.Agent({ keepAlive: true, timeout: 60000 });

// Define the base URL for the tests
const baseUrl = 'http://localhost:5000';

// Function to verify a specific API endpoint
async function verifyEndpoint(endpoint, authToken = null) {
  console.log(`Testing endpoint: ${endpoint}`);
  
  try {
    const headers = {};
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
      headers.Cookie = `auth_token=${authToken}`;
    }
    
    // Use raw response to avoid automatic JSON parsing
    const response = await axios.get(`${baseUrl}${endpoint}`, {
      headers,
      httpAgent: agent,
      validateStatus: () => true,
      transformResponse: [(data) => data]  // Keep raw response
    });
    
    console.log(`Status code: ${response.status}`);
    
    // Log a preview of the response
    if (response.data) {
      const preview = response.data.length > 100 ? 
        `${response.data.substring(0, 100)}...` : response.data;
      console.log(`Response preview: ${preview}`);
    } else {
      console.log('No response data received');
    }
    
    // Try to parse the response as JSON
    try {
      const parsedData = JSON.parse(response.data);
      console.log('✅ Response is valid JSON');
      return { valid: true, endpoint };
    } catch (error) {
      console.error(`❌ Invalid JSON: ${error.message}`);
      
      // If it's an "Unexpected end of input" error, log more details
      if (error.message.includes('Unexpected end of input')) {
        console.error('This is the error we are looking for!');
        console.error('Raw response data:');
        console.error(response.data);
      }
      
      return { valid: false, endpoint, error: error.message };
    }
  } catch (error) {
    console.error(`❌ Request error: ${error.message}`);
    return { valid: false, endpoint, error: error.message };
  }
}

// Main function to verify all API endpoints
async function main() {
  console.log('Starting verification of JSON endpoint fixes...');
  
  // Endpoints to test
  const endpoints = [
    '/dashboard-check',
    '/api/user',
    '/api/leads',
    '/api/calls',
    '/api/analytics/dashboard',
    '/api/analytics/call-outcomes'
  ];
  
  // Test all endpoints
  console.log('\nTesting without authentication:');
  
  const results = [];
  for (const endpoint of endpoints) {
    const result = await verifyEndpoint(endpoint);
    results.push(result);
    console.log('-'.repeat(50));
  }
  
  // Login to get an authentication token
  console.log('\nAttempting to login for authenticated testing:');
  
  try {
    const loginResponse = await axios.post(`${baseUrl}/api/login`, {
      username: 'test',
      password: 'password'
    });
    
    if (loginResponse.data && loginResponse.data.token) {
      const token = loginResponse.data.token;
      console.log('✅ Successfully obtained auth token');
      
      // Test all endpoints with authentication
      console.log('\nTesting with authentication:');
      
      for (const endpoint of endpoints) {
        const result = await verifyEndpoint(endpoint, token);
        results.push(result);
        console.log('-'.repeat(50));
      }
    } else {
      console.log('❌ Could not obtain auth token');
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
  }
  
  // Log summary results
  console.log('\nResults Summary:');
  
  let allValid = true;
  let unexpectedEndErrors = false;
  
  for (const result of results) {
    const status = result.valid ? '✅ Valid' : '❌ Invalid';
    console.log(`${status}: ${result.endpoint}`);
    
    if (!result.valid) {
      allValid = false;
      if (result.error && result.error.includes('Unexpected end of input')) {
        unexpectedEndErrors = true;
      }
    }
  }
  
  console.log('\nVerification completed.');
  console.log(`All endpoints returning valid JSON: ${allValid ? 'Yes' : 'No'}`);
  console.log(`"Unexpected end of input" errors still present: ${unexpectedEndErrors ? 'Yes' : 'No'}`);
  
  if (unexpectedEndErrors) {
    console.log('\n⚠️ The "Unexpected end of input" error is still occurring.');
    console.log('Check the logs above to see which endpoints are affected.');
  } else {
    console.log('\n✅ No "Unexpected end of input" errors detected in API responses.');
    console.log('The fixes appear to be working correctly.');
  }
}

// Run the main function
main();