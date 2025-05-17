/**
 * Test Specific API Endpoints for JSON Format Issues
 * 
 * This script checks for malformed JSON in specific API endpoints
 * that might be causing the "Unexpected end of input" error.
 */

const axios = require('axios');

// Base URL for the API
const baseUrl = 'http://localhost:5000';

// Function to test an endpoint and check its JSON response
async function testEndpoint(endpoint, auth = null) {
  console.log(`Testing endpoint: ${endpoint}`);
  
  try {
    const headers = {};
    if (auth) {
      headers.Authorization = `Bearer ${auth}`;
      headers.Cookie = `auth_token=${auth}`;
    }
    
    // Use raw response to avoid automatic JSON parsing
    const response = await axios.get(`${baseUrl}${endpoint}`, {
      headers,
      transformResponse: [(data) => data]  // Keep raw response
    });
    
    console.log(`Status code: ${response.status}`);
    
    // First, check if the response is empty
    if (!response.data || response.data.trim() === '') {
      console.error(`❌ Empty response from ${endpoint}`);
      return false;
    }
    
    // Log the first part of the response
    const preview = response.data.length > 150 ? 
      `${response.data.substring(0, 150)}...` : response.data;
    console.log(`Response preview: ${preview}`);
    
    // Verify that the response is valid JSON
    try {
      JSON.parse(response.data);
      console.log(`✅ Valid JSON response from ${endpoint}`);
      return true;
    } catch (error) {
      console.error(`❌ Invalid JSON from ${endpoint}: ${error.message}`);
      
      // Analyze the JSON error more closely
      const lastChar = response.data.trim().slice(-1);
      const firstChar = response.data.trim().charAt(0);
      
      if ((firstChar === '{' || firstChar === '[') && 
          !(lastChar === '}' || lastChar === ']')) {
        console.error('Truncated JSON detected - response ends unexpectedly');
      }
      
      // Count opening and closing braces to check for mismatched pairs
      const openBraces = (response.data.match(/{/g) || []).length;
      const closeBraces = (response.data.match(/}/g) || []).length;
      const openBrackets = (response.data.match(/\[/g) || []).length;
      const closeBrackets = (response.data.match(/\]/g) || []).length;
      
      console.log(`JSON structure: ${openBraces} opening braces, ${closeBraces} closing braces`);
      console.log(`JSON structure: ${openBrackets} opening brackets, ${closeBrackets} closing brackets`);
      
      if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
        console.error('Mismatched braces or brackets detected');
      }
      
      // Show the end of the response for truncation analysis
      if (response.data.length > 300) {
        const lastPart = response.data.slice(-150);
        console.log(`Last part of response: ${lastPart}`);
      }
      
      return false;
    }
  } catch (error) {
    console.error(`❌ Error testing ${endpoint}:`, error.message);
    return false;
  }
}

// Main function to test all endpoints
async function main() {
  // List of endpoints to test
  const endpoints = [
    '/dashboard-check',
    '/api/user',
    '/api/leads',
    '/api/calls',
    '/api/analytics/dashboard',
    '/api/analytics/call-outcomes',
    '/api/analytics/user-performance'
  ];
  
  console.log('Starting endpoint tests...\n');
  
  // Try to get an auth token first
  let authToken = null;
  try {
    const loginResponse = await axios.post(`${baseUrl}/api/login`, {
      username: 'test',
      password: 'test'
    });
    
    if (loginResponse.data && loginResponse.data.token) {
      authToken = loginResponse.data.token;
      console.log('✅ Successfully obtained auth token');
    }
  } catch (error) {
    console.log('❌ Could not obtain auth token, will test endpoints without authentication');
  }
  
  // Test each endpoint
  for (const endpoint of endpoints) {
    console.log('\n' + '-'.repeat(50));
    await testEndpoint(endpoint, authToken);
  }
  
  console.log('\nEndpoint tests completed.');
}

// Run the main function
main();