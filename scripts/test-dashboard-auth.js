/**
 * Dashboard Authentication Test Script
 * 
 * This script tests the authentication flow for dashboard API requests
 * and fixes any issues preventing the dashboard from loading correctly.
 */

// Fetch a valid auth token and store it for testing
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);

const baseUrl = 'http://localhost:5000';

// Helper to extract token from cookie string
function extractTokenFromCookie(cookieStr) {
  const match = /auth_token=([^;]+)/.exec(cookieStr);
  return match ? match[1] : null;
}

// Test login and store token
async function testLoginAndGetToken() {
  try {
    console.log('1. Testing login to get authentication token...');
    
    const loginRes = await axios.post(`${baseUrl}/api/login`, {
      username: 'realityinspector', // Using the username from the logs
      password: 'password123'       // Default test password - update if needed
    }, {
      withCredentials: true
    });
    
    if (loginRes.data.success && loginRes.data.token) {
      console.log('✓ Login successful, received token');
      
      // Get the auth_token cookie
      const cookies = loginRes.headers['set-cookie'];
      if (cookies && cookies.length > 0) {
        const authCookie = cookies.find(cookie => cookie.startsWith('auth_token='));
        if (authCookie) {
          const token = extractTokenFromCookie(authCookie);
          if (token) {
            console.log('✓ Successfully extracted token from cookies');
            
            // Save token to file for curl tests
            await writeFileAsync(path.join(__dirname, '../token.txt'), token);
            console.log('✓ Token saved to token.txt for testing');
            
            return token;
          }
        }
      }
      
      // If headers don't have the cookie but we have a token in the response
      if (loginRes.data.token) {
        console.log('✓ Token found in response body');
        await writeFileAsync(path.join(__dirname, '../token.txt'), loginRes.data.token);
        console.log('✓ Token saved to token.txt for testing');
        return loginRes.data.token;
      }
      
      throw new Error('No auth_token cookie found in response');
    } else {
      throw new Error('Login failed: ' + (loginRes.data.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('✗ Login test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

// Test API endpoints with token
async function testApiEndpoints(token) {
  if (!token) {
    console.error('✗ Cannot test API endpoints without token');
    return;
  }
  
  try {
    console.log('\n2. Testing API endpoints with auth token...');
    
    // Test dashboard-check endpoint
    console.log('\nTesting /dashboard-check endpoint:');
    const dashboardCheckRes = await axios.get(`${baseUrl}/dashboard-check`, {
      headers: {
        Cookie: `auth_token=${token}`
      }
    });
    
    if (dashboardCheckRes.data.authenticated) {
      console.log('✓ Dashboard check successful, user is authenticated');
      console.log('User:', dashboardCheckRes.data.user);
    } else {
      console.error('✗ Dashboard check failed: Not authenticated');
    }
    
    // Test user endpoint
    console.log('\nTesting /api/user endpoint:');
    const userRes = await axios.get(`${baseUrl}/api/user`, {
      headers: {
        Cookie: `auth_token=${token}`
      }
    });
    
    if (userRes.data.success) {
      console.log('✓ User API successful');
      console.log('User:', userRes.data.user);
    } else {
      console.error('✗ User API failed');
    }
    
    // Test leads endpoint
    console.log('\nTesting /api/leads endpoint:');
    const leadsRes = await axios.get(`${baseUrl}/api/leads`, {
      headers: {
        Cookie: `auth_token=${token}`
      }
    });
    
    if (leadsRes.data.success) {
      console.log('✓ Leads API successful');
      console.log(`Retrieved ${leadsRes.data.data.length} leads`);
    } else {
      console.error('✗ Leads API failed');
    }
    
    // Test calls endpoint
    console.log('\nTesting /api/calls endpoint:');
    const callsRes = await axios.get(`${baseUrl}/api/calls`, {
      headers: {
        Cookie: `auth_token=${token}`
      }
    });
    
    if (callsRes.data.success) {
      console.log('✓ Calls API successful');
      console.log(`Retrieved ${callsRes.data.data.length} calls`);
    } else {
      console.error('✗ Calls API failed');
    }
    
  } catch (error) {
    console.error('✗ API endpoint tests failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Fix cookie handling in dashboard.html
async function fixDashboardAuthentication() {
  console.log('\n3. Checking dashboard.html for auth issues...');
  
  try {
    // Read the dashboard.html file
    const dashboardPath = path.join(__dirname, '../public/dashboard.html');
    const dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');
    
    // Look for potential issues
    const issuesToFix = [];
    
    // 1. Check for proper credentials inclusion in API requests
    if (!/credentials:\s*['"]include['"]/.test(dashboardHtml)) {
      issuesToFix.push('Missing credentials: include in API requests');
    }
    
    // 2. Check for proper error handling
    const badErrorHandling = dashboardHtml.includes('JSON.parse') && 
                            !dashboardHtml.includes('try {') && 
                            !dashboardHtml.includes('catch');
    if (badErrorHandling) {
      issuesToFix.push('Improper JSON parsing error handling');
    }
    
    // Fix the identified issues
    if (issuesToFix.length > 0) {
      console.log(`✗ Found ${issuesToFix.length} issues to fix:`);
      issuesToFix.forEach(issue => console.log(`  - ${issue}`));
      
      // Implement fixes (this will be specific to each issue)
      // This is a simplified approach - real fix would be more targeted
      console.log('\nApplying fixes...');
      
      let updatedHtml = dashboardHtml;
      
      // Add credentials: include to API requests that might be missing it
      if (issuesToFix.includes('Missing credentials: include in API requests')) {
        const apiRequestRegex = /fetch\(['"]\/api\/([^'"]+)['"]\s*(?:\)|,\s*\{([^}]*))/g;
        updatedHtml = updatedHtml.replace(apiRequestRegex, (match, endpoint, options) => {
          if (!options || !options.includes('credentials')) {
            return options ? 
              `fetch('/api/${endpoint}', ${options.trim()}, credentials: 'include')` :
              `fetch('/api/${endpoint}', { credentials: 'include' })`;
          }
          return match;
        });
      }
      
      // Add try/catch for JSON parsing
      if (issuesToFix.includes('Improper JSON parsing error handling')) {
        const jsonParseRegex = /(\w+)\s*=\s*JSON\.parse\(([^)]+)\)/g;
        updatedHtml = updatedHtml.replace(jsonParseRegex, 
          'try { $1 = JSON.parse($2); } catch (e) { console.error("JSON parse error:", e); }');
      }
      
      // Save the updated file
      if (updatedHtml !== dashboardHtml) {
        fs.writeFileSync(dashboardPath, updatedHtml);
        console.log('✓ Applied fixes to dashboard.html');
      } else {
        console.log('! No changes made to dashboard.html');
      }
    } else {
      console.log('✓ No authentication issues found in dashboard.html');
    }
    
  } catch (error) {
    console.error('✗ Error fixing dashboard authentication:', error);
  }
}

// Modified fix that specifically targets the SyntaxError: Unexpected end of input
async function fixJsonParsingIssue() {
  console.log('\n3. Fixing the JSON parsing issue in dashboard.html...');
  
  try {
    // Read the dashboard.html file
    const dashboardPath = path.join(__dirname, '../public/dashboard.html');
    const dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');
    
    // Look for API fetch calls that don't properly handle errors
    let updatedHtml = dashboardHtml;
    
    // Find all fetch calls and add proper error handling
    const fetchRegex = /(fetch\(['"][^'"]+['"][^)]*\))\s*\.then\(\s*response\s*=>\s*(?:{\s*(?:if\s*\([^{]+\)\s*{[^}]*}\s*)?)*\s*return\s+response\.json\(\)/g;
    
    updatedHtml = updatedHtml.replace(fetchRegex, (match, fetchCall) => {
      return `${fetchCall}
        .then(response => {
          if (!response.ok) {
            throw new Error(\`API request failed: \${response.status} \${response.statusText}\`);
          }
          return response.json().catch(error => {
            console.error('JSON parsing error:', error);
            throw new Error('Failed to parse JSON response');
          });
        })`;
    });
    
    // Save the updated file if changes were made
    if (updatedHtml !== dashboardHtml) {
      fs.writeFileSync(dashboardPath, updatedHtml);
      console.log('✓ Applied JSON parsing error handling fixes to dashboard.html');
      return true;
    } else {
      console.log('! No changes needed for JSON parsing handling');
      return false;
    }
    
  } catch (error) {
    console.error('✗ Error fixing JSON parsing issue:', error);
    return false;
  }
}

// Create a simple data validator script
async function createDataValidator() {
  console.log('\n4. Creating API data validator script...');
  
  try {
    const validatorPath = path.join(__dirname, '../public/js/api-validator.js');
    
    const validatorScript = `/**
 * API Data Validator
 * 
 * This script adds robust error handling for API requests
 * to prevent "Unexpected end of input" errors when parsing JSON.
 */

(function() {
  // Store the original fetch function
  const originalFetch = window.fetch;
  
  // Override the fetch function to add error handling
  window.fetch = function(...args) {
    return originalFetch.apply(this, args)
      .then(response => {
        // Clone the response so we can still use it
        const clone = response.clone();
        
        // Process API requests (skip for other requests like static assets)
        if (args[0] && typeof args[0] === 'string' && 
            (args[0].startsWith('/api/') || args[0].includes('dashboard-check'))) {
          
          // Return a Promise that safely handles JSON parsing
          return clone.text().then(text => {
            if (!text.trim()) {
              console.error('Empty response from API');
              throw new Error('Empty response from API');
            }
            
            try {
              const data = JSON.parse(text);
              return new Response(JSON.stringify(data), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
              });
            } catch (e) {
              console.error('JSON parsing error:', e, 'Response text:', text);
              throw new Error('Failed to parse API response as JSON');
            }
          });
        }
        
        // For non-API requests, just return the original response
        return response;
      });
  };
  
  console.log('API validator initialized - improved JSON error handling');
})();
`;

    // Create the directory if it doesn't exist
    const jsDir = path.join(__dirname, '../public/js');
    if (!fs.existsSync(jsDir)) {
      fs.mkdirSync(jsDir, { recursive: true });
    }
    
    // Write the validator script
    fs.writeFileSync(validatorPath, validatorScript);
    console.log('✓ Created API validator script at public/js/api-validator.js');
    
    // Update the dashboard.html to include this script
    const dashboardPath = path.join(__dirname, '../public/dashboard.html');
    let dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');
    
    // Check if the script is already included
    if (!dashboardHtml.includes('api-validator.js')) {
      // Insert the script tag before the first existing script
      const scriptTagPos = dashboardHtml.indexOf('<script');
      if (scriptTagPos !== -1) {
        dashboardHtml = dashboardHtml.slice(0, scriptTagPos) + 
                       '<script src="/js/api-validator.js"></script>\n  ' + 
                       dashboardHtml.slice(scriptTagPos);
        
        // Save the updated file
        fs.writeFileSync(dashboardPath, dashboardHtml);
        console.log('✓ Added API validator script to dashboard.html');
        return true;
      } else {
        console.log('! Could not find a suitable position to add script tag');
        return false;
      }
    } else {
      console.log('✓ API validator script already included in dashboard.html');
      return false;
    }
    
  } catch (error) {
    console.error('✗ Error creating data validator:', error);
    return false;
  }
}

// Main function to run all tests
async function main() {
  console.log('\n======== DASHBOARD AUTHENTICATION TEST ========\n');
  
  // Test 1: Login and get token
  const token = await testLoginAndGetToken();
  
  // Test 2: Test API endpoints
  if (token) {
    await testApiEndpoints(token);
  }
  
  // Fix 1: General authentication issues
  await fixDashboardAuthentication();
  
  // Fix 2: Specific JSON parsing issue
  const jsonFixApplied = await fixJsonParsingIssue();
  
  // Fix 3: Create API validator
  const validatorCreated = await createDataValidator();
  
  console.log('\n======== TEST SUMMARY ========\n');
  console.log('Authentication token obtained:', !!token);
  console.log('JSON parsing fix applied:', jsonFixApplied);
  console.log('API validator created:', validatorCreated);
  
  console.log('\nAll tests and fixes completed. Please restart the server and try accessing the dashboard again.');
}

// Run the main function
main().catch(console.error);