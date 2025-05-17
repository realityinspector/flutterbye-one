/**
 * Test API Endpoints
 * 
 * This script tests the API endpoints directly to help diagnose
 * the "Unexpected end of input" error on the dashboard.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const baseUrl = 'http://localhost:5000';

// Try to read a valid token from the token.txt file
let authToken;
try {
  const tokenPath = path.join(__dirname, '../token.txt');
  if (fs.existsSync(tokenPath)) {
    authToken = fs.readFileSync(tokenPath, 'utf8').trim();
  }
} catch (error) {
  console.error('Error reading token file:', error.message);
}

// Store a session cookie for testing
let sessionCookie;

// Test login to get a token
async function testLogin() {
  try {
    console.log('\n1. Testing login...');
    const loginData = {
      username: 'test',
      password: 'password123' 
    };
    
    console.log(`Attempting login with username: ${loginData.username}`);
    
    const response = await axios.post(`${baseUrl}/api/login`, loginData);
    
    if (response.data && response.data.success) {
      console.log('✓ Login successful');
      
      // Check for token in response
      if (response.data.token) {
        console.log('✓ Received auth token');
        authToken = response.data.token;
        
        // Save token to file for future use
        fs.writeFileSync(path.join(__dirname, '../token.txt'), authToken);
        console.log('✓ Token saved to token.txt');
      }
      
      // Check for auth_token cookie
      if (response.headers['set-cookie']) {
        const cookies = response.headers['set-cookie'];
        const authCookie = cookies.find(c => c.startsWith('auth_token='));
        if (authCookie) {
          sessionCookie = authCookie;
          console.log('✓ Received auth_token cookie');
        }
      }
      
      return true;
    } else {
      console.log('✗ Login failed:', response.data.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('✗ Login error:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Response:', error.response.data);
    }
    return false;
  }
}

// Test the dashboard check endpoint
async function testDashboardCheck() {
  console.log('\n2. Testing dashboard-check endpoint...');
  
  try {
    const headers = {};
    
    // Add cookie headers if available
    if (sessionCookie) {
      headers.Cookie = sessionCookie;
    }
    
    const response = await axios.get(`${baseUrl}/dashboard-check`, { headers });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    if (response.data && response.data.authenticated) {
      console.log('✓ Dashboard check successful - user is authenticated');
      return true;
    } else {
      console.log('✗ Dashboard check failed - not authenticated');
      return false;
    }
  } catch (error) {
    console.error('✗ Dashboard check error:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Response:', error.response.data);
    }
    return false;
  }
}

// Test the leads API endpoint
async function testLeadsAPI() {
  console.log('\n3. Testing /api/leads endpoint...');
  
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add auth token or cookie
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    
    if (sessionCookie) {
      headers.Cookie = sessionCookie;
    }
    
    console.log('Request headers:', headers);
    
    const response = await axios.get(`${baseUrl}/api/leads`, { headers });
    
    console.log('Response status:', response.status);
    console.log('Data type:', typeof response.data);
    
    if (typeof response.data === 'object') {
      console.log('Success field:', response.data.success);
      
      if (response.data.data && Array.isArray(response.data.data)) {
        console.log(`✓ Successfully retrieved ${response.data.data.length} leads`);
        
        // Show a preview of first lead if available
        if (response.data.data.length > 0) {
          const firstLead = response.data.data[0];
          console.log('\nSample lead:');
          console.log(' - ID:', firstLead.id);
          console.log(' - Company:', firstLead.globalLead?.companyName || 'N/A');
          console.log(' - Contact:', firstLead.globalLead?.contactName || 'N/A');
          console.log(' - Status:', firstLead.status);
        }
        
        return true;
      } else {
        console.log('✗ Invalid response format - missing or empty data array');
        console.log('Response data:', response.data);
        return false;
      }
    } else {
      console.log('✗ Invalid response format - not an object');
      console.log('Response data (raw):', response.data);
      return false;
    }
  } catch (error) {
    console.error('✗ Leads API error:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Response:', error.response.data);
    }
    return false;
  }
}

// Test the calls API endpoint
async function testCallsAPI() {
  console.log('\n4. Testing /api/calls endpoint...');
  
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add auth token or cookie
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    
    if (sessionCookie) {
      headers.Cookie = sessionCookie;
    }
    
    const response = await axios.get(`${baseUrl}/api/calls`, { headers });
    
    console.log('Response status:', response.status);
    console.log('Data type:', typeof response.data);
    
    if (typeof response.data === 'object') {
      console.log('Success field:', response.data.success);
      
      if (response.data.data && Array.isArray(response.data.data)) {
        console.log(`✓ Successfully retrieved ${response.data.data.length} calls`);
        
        // Show a preview of first call if available
        if (response.data.data.length > 0) {
          const firstCall = response.data.data[0];
          console.log('\nSample call:');
          console.log(' - ID:', firstCall.id);
          console.log(' - Date:', firstCall.callDate);
          console.log(' - Duration:', firstCall.duration);
          console.log(' - Outcome:', firstCall.outcome);
        }
        
        return true;
      } else {
        console.log('✗ Invalid response format - missing or empty data array');
        console.log('Response data:', response.data);
        return false;
      }
    } else {
      console.log('✗ Invalid response format - not an object');
      console.log('Response data (raw):', response.data);
      return false;
    }
  } catch (error) {
    console.error('✗ Calls API error:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Response:', error.response.data);
    }
    return false;
  }
}

// Main function to run all tests
async function main() {
  console.log('\n======== API ENDPOINT TEST ========\n');
  
  // First try to use existing token
  if (authToken) {
    console.log(`Using existing token from token.txt: ${authToken.substring(0, 10)}...`);
  }
  
  // Run tests in sequence
  let loggedIn = false;
  
  if (!authToken) {
    loggedIn = await testLogin();
  }
  
  const dashboardCheckPassed = await testDashboardCheck();
  const leadsApiPassed = await testLeadsAPI();
  const callsApiPassed = await testCallsAPI();
  
  // Print summary
  console.log('\n======== TEST RESULTS ========\n');
  console.log('Dashboard Check API:', dashboardCheckPassed ? '✓ PASSED' : '✗ FAILED');
  console.log('Leads API:', leadsApiPassed ? '✓ PASSED' : '✗ FAILED');
  console.log('Calls API:', callsApiPassed ? '✓ PASSED' : '✗ FAILED');
  
  if (!dashboardCheckPassed || !leadsApiPassed || !callsApiPassed) {
    console.log('\nSome tests failed. Please check the authentication setup and API endpoints.');
  } else {
    console.log('\nAll tests passed! The API endpoints are working correctly.');
  }
}

// Run the tests
main().catch(error => {
  console.error('Unhandled error in test script:', error);
});