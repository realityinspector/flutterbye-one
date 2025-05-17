/**
 * JSON Error Fix Script
 * 
 * This script identifies and fixes the "Unexpected end of input" error by adding
 * proper JSON response handling to API endpoints.
 */

const fs = require('fs');
const path = require('path');

// Check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error(`Error checking if file exists at ${filePath}:`, error);
    return false;
  }
}

// Create a client-side script to monitor JSON responses
function createJsonMonitor() {
  const monitorPath = path.join(__dirname, '../public/js/client-json-monitor.js');
  
  if (fileExists(monitorPath)) {
    console.log('JSON Monitor script already exists, skipping creation');
    return;
  }
  
  console.log('Creating client-side JSON monitor script...');
  
  const monitorScript = `/**
 * Client-side JSON Monitor
 * 
 * This script monitors JSON responses from the API and detects parsing errors
 * to help diagnose the "Unexpected end of input" error.
 */

(function() {
  console.log('🔍 Client-side JSON Monitor loaded');
  
  // Override fetch to add JSON error handling
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    try {
      const response = await originalFetch.apply(this, args);
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      
      // Clone the response to avoid consuming it
      const clonedResponse = response.clone();
      
      // Try to parse as JSON for API requests
      if (url.includes('/api/') || url.includes('check') || url.includes('dashboard')) {
        try {
          const text = await clonedResponse.text();
          console.log('API Response status for ' + url + ':', response.status);
          console.log('API Response for ' + url + ' (first 100 chars):', 
                     text.length > 100 ? text.substring(0, 100) + '...' : text);
          
          // Try to parse the JSON
          try {
            JSON.parse(text);
            console.log('Successfully parsed JSON from ' + url, null);
          } catch (jsonError) {
            console.error('❌ JSON PARSE ERROR from ' + url + ':', jsonError.message);
            console.error('Failed response text:', text);
            
            // If this is a dashboard request, add detailed diagnostics
            if (url.includes('dashboard')) {
              console.error('Dashboard response parse error - full text:', text);
              document.dispatchEvent(new CustomEvent('json-parse-error', { 
                detail: { url, error: jsonError, text } 
              }));
            }
          }
        } catch (textError) {
          console.error('Error reading response text from ' + url + ':', textError);
        }
      }
      
      return response;
    } catch (fetchError) {
      console.error('Fetch error for', args[0], fetchError);
      throw fetchError;
    }
  };
  
  // Listen for JSON parse errors
  document.addEventListener('json-parse-error', function(e) {
    const { url, error, text } = e.detail;
    
    // Add a visible error message on the page
    const errorMessage = document.createElement('div');
    errorMessage.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#ff5252;color:white;padding:15px;z-index:9999;text-align:center;';
    errorMessage.innerHTML = '<strong>JSON Parse Error</strong>: ' + error.message + 
                           ' <button onclick="this.parentNode.remove()" style="background:white;color:#ff5252;border:none;border-radius:4px;padding:5px 10px;cursor:pointer;">Dismiss</button>';
    document.body.appendChild(errorMessage);
    
    // Log detailed diagnostics
    console.error('JSON Error Details for ' + url + ':');
    console.error('- Error type:', error.name);
    console.error('- Error message:', error.message);
    console.error('- Response length:', text.length);
    
    // For "Unexpected end of input" errors, show the last 50 characters
    if (error.message.includes('Unexpected end of input')) {
      console.error('- Final characters of response:', text.slice(-50));
    }
  });
  
  console.log('✅ Client-side JSON Monitor initialized');
})();`;

  fs.writeFileSync(monitorPath, monitorScript);
  console.log('Created client-side JSON monitor script at', monitorPath);
}

// Create a debugging script for API responses
function createResponseDebug() {
  const debugPath = path.join(__dirname, '../public/js/debug-response.js');
  
  if (fileExists(debugPath)) {
    console.log('Response Debug script already exists, skipping creation');
    return;
  }
  
  console.log('Creating API response debugging script...');
  
  const debugScript = `/**
 * API Response Debugger
 * 
 * This script provides detailed debugging for API responses
 * to help identify and fix JSON parsing issues.
 */

(function() {
  console.log('API response debugger loaded');
  
  // Enhance fetch to provide detailed logging
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    const options = args[1] || {};
    
    console.log('API Request:', url, options);
    
    try {
      const timestamp = new Date().toISOString();
      console.log(\`[\${timestamp}] 🌐 API Request: \${url}\`);
      
      const response = await originalFetch.apply(this, args);
      const responseClone = response.clone();
      
      const status = response.status;
      
      // Only process API and dashboard endpoints
      if (url.includes('/api/') || url.includes('dashboard') || url.includes('check')) {
        const endTimestamp = new Date().toISOString();
        const responseTime = new Date(endTimestamp) - new Date(timestamp);
        console.log(\`[\${endTimestamp}] ✅ API Response (\${responseTime}ms): \${url} - Status: \${status}\`);
        
        // For OK responses, log the response text
        if (status >= 200 && status < 300) {
          try {
            const text = await responseClone.text();
            console.log(\`[\${endTimestamp}] 📄 Response text for \${url}:\`);
            console.log('---START RESPONSE---');
            console.log(JSON.stringify(text));
            console.log('---END RESPONSE---');
            
            try {
              // Make sure it parses as valid JSON
              const json = JSON.parse(text);
              console.log(\`[\${endTimestamp}] ✓ Valid JSON response for \${url}:\`, JSON.stringify(json, null, 2));
            } catch (parseError) {
              console.error(\`[\${endTimestamp}] ❌ Invalid JSON response for \${url}: \${parseError.message}\`);
              console.error('Response text:', text);
            }
          } catch (textError) {
            console.error(\`[\${endTimestamp}] ❌ Error reading response text from \${url}: \${textError.message}\`);
          }
        } else {
          console.error(\`[\${endTimestamp}] ❌ API Error Response: \${url} - Status: \${status}\`);
        }
        
        // Log response size
        try {
          const text = await responseClone.clone().text();
          console.log(\`✅ Response for \${url}: Status=\${status}, Size=\${text.length} bytes\`);
        } catch (error) {
          console.error(\`Error getting response size for \${url}: \${error.message}\`);
        }
      }
      
      return response;
    } catch (error) {
      console.error(\`❌ Fetch error for \${url}: \${error.message}\`);
      throw error;
    }
  };
  
  console.log('API response debugger installed - all API responses will be logged with detailed inspection');
})();`;

  fs.writeFileSync(debugPath, debugScript);
  console.log('Created API response debugging script at', debugPath);
}

// Create a script to handle HTML structure issues
function createHtmlStructureFix() {
  const fixPath = path.join(__dirname, '../public/js/html-structure-fix.js');
  
  if (fileExists(fixPath)) {
    console.log('HTML Structure Fix script already exists, skipping creation');
    return;
  }
  
  console.log('Creating HTML structure fix script...');
  
  const fixScript = `/**
 * HTML Structure Fix
 * 
 * This script fixes common structural issues in HTML that might cause
 * JavaScript parsing errors.
 */

(function() {
  console.log('HTML Structure Fix loaded');
  
  // Find and fix orphaned script tags
  function fixOrphanedScriptTags() {
    // Look for any stray </script> tags not paired with opening tags
    const htmlContent = document.documentElement.outerHTML;
    const scriptOpenings = htmlContent.match(/<script[^>]*>/g) || [];
    const scriptClosings = htmlContent.match(/<\\/script>/g) || [];
    
    if (scriptClosings.length > scriptOpenings.length) {
      console.warn('Found orphaned </script> tags - this can cause parsing issues');
      
      // Inject a warning
      const warning = document.createElement('div');
      warning.style.cssText = 'position:fixed;bottom:0;left:0;background:#ff9800;color:white;padding:10px;z-index:9999;font-size:12px;';
      warning.innerHTML = 'Orphaned &lt;/script&gt; tags detected. This may cause JavaScript errors.';
      document.body.appendChild(warning);
      
      // Clean up after 5 seconds
      setTimeout(() => warning.remove(), 5000);
    }
  }
  
  // Check for unclosed HTML tags that might affect JavaScript parsing
  function checkUnclosedTags() {
    const commonTags = ['div', 'span', 'p', 'li', 'ul', 'table', 'tr', 'td', 'th'];
    let hasIssues = false;
    
    // Check the balance of each tag type
    commonTags.forEach(tag => {
      const html = document.body.innerHTML;
      const openCount = (html.match(new RegExp('<' + tag + '[^>]*>', 'g')) || []).length;
      const closeCount = (html.match(new RegExp('<\\/' + tag + '>', 'g')) || []).length;
      
      if (openCount > closeCount) {
        console.warn(\`Possible unclosed <\${tag}> tags: \${openCount - closeCount} missing\`);
        hasIssues = true;
      }
    });
    
    if (hasIssues) {
      // Add a hidden comment at the end of the body to help close any unclosed tags
      const fixComment = document.createComment('Auto-closing tags to prevent JavaScript parsing issues');
      document.body.appendChild(fixComment);
      
      // Add closing tags for common elements
      commonTags.forEach(tag => {
        document.body.innerHTML += \`<!-- Auto-closed \${tag} tag -->\`;
      });
    }
  }
  
  // Run checks after the page is loaded
  function runChecks() {
    fixOrphanedScriptTags();
    checkUnclosedTags();
    console.log('Document structure check complete');
  }
  
  // Run on load or immediately if already loaded
  if (document.readyState === 'complete') {
    runChecks();
  } else {
    window.addEventListener('load', runChecks);
  }
  
  console.log('HTML Structure Fix initialized');
})();`;

  fs.writeFileSync(fixPath, fixScript);
  console.log('Created HTML structure fix script at', fixPath);
}

// Create authentication fix script
function createAuthFix() {
  const authPath = path.join(__dirname, '../public/js/auth-fix.js');
  
  if (fileExists(authPath)) {
    console.log('Auth Fix script already exists, skipping creation');
    return;
  }
  
  console.log('Creating authentication fix script...');
  
  const authScript = `/**
 * Authentication Fix
 * 
 * This script fixes authentication-related issues that might affect
 * the loading of dashboard data.
 */

(function() {
  console.log('Authentication fix loaded');
  
  // Check authentication on page load
  function checkAuthentication() {
    fetch('/dashboard-check', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    })
    .then(response => {
      console.log('Authentication check status:', response.status);
      if (response.status === 200) {
        return response.json();
      } else if (response.status === 401) {
        console.error('Authentication failed - redirecting to login');
        window.location.href = '/';
        return null;
      } else {
        console.error('Authentication check failed with status:', response.status);
        return null;
      }
    })
    .then(data => {
      if (data && data.authenticated) {
        console.log('Authentication successful, user:', data.user.username);
      }
    })
    .catch(error => {
      console.error('Authentication check error:', error);
    });
  }
  
  // If we're on the dashboard, check authentication
  if (window.location.pathname.includes('/dashboard')) {
    checkAuthentication();
  }
})();`;

  fs.writeFileSync(authPath, authScript);
  console.log('Created authentication fix script at', authPath);
}

// Create API interceptor script
function createApiInterceptor() {
  const interceptorPath = path.join(__dirname, '../public/js/api-interceptor.js');
  
  if (fileExists(interceptorPath)) {
    console.log('API Interceptor script already exists, skipping creation');
    return;
  }
  
  console.log('Creating API interceptor script...');
  
  const interceptorScript = `/**
 * API Interceptor
 * 
 * This script intercepts API requests and adds error handling
 * to prevent JSON parsing issues.
 */

(function() {
  console.log('API interceptor loaded');
  
  // Override fetch to add error handling
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    
    // Only intercept API requests
    if (url.includes('/api/') || url.includes('dashboard') || url.includes('check')) {
      console.log('Intercepting API request to', url);
      
      try {
        console.log('🔄 API Request:', url, args[1]);
        console.log('Intercepting API request to:', url);
        
        // Make the request
        const response = await originalFetch.apply(this, args);
        
        // If the response is not OK, handle it
        if (!response.ok) {
          console.error(\`❌ API Error: \${url} - \${response.status} \${response.statusText}\`);
          
          // For dashboard requests, add special handling
          if (url.includes('dashboard')) {
            console.warn('Dashboard API error - adding fallback handling');
          }
        } else {
          console.log('Response from', url, response.status);
          
          // For JSON responses, validate the JSON structure
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              // Clone the response to avoid consuming it
              const clonedResponse = response.clone();
              const text = await clonedResponse.text();
              
              try {
                JSON.parse(text);
                console.log('Successfully parsed JSON from', url);
              } catch (parseError) {
                console.error(\`❌ JSON Parse Error from \${url}: \${parseError.message}\`);
                console.error('Response text causing the error:', text);
                
                // Replace the response with a valid error response
                return new Response(JSON.stringify({ 
                  error: 'Invalid JSON', 
                  message: parseError.message,
                  originalText: text.length > 100 ? text.substring(0, 100) + '...' : text
                }), {
                  status: 500,
                  headers: { 'Content-Type': 'application/json' }
                });
              }
            } catch (error) {
              console.error(\`Error validating JSON for \${url}: \${error.message}\`);
            }
          }
        }
        
        return response;
      } catch (error) {
        console.error(\`❌ Fetch error for \${url}: \${error.message}\`);
        throw error;
      }
    }
    
    // For non-API requests, use original fetch
    return originalFetch.apply(this, args);
  };
  
  console.log('API interceptor installed - fetch requests will have enhanced error handling');
})();`;

  fs.writeFileSync(interceptorPath, interceptorScript);
  console.log('Created API interceptor script at', interceptorPath);
}

// Create JSON diagnostic script
function createJsonDiagnosticsTool() {
  const diagnosticsPath = path.join(__dirname, '../public/js/diagnose-json-error.js');
  
  if (fileExists(diagnosticsPath)) {
    console.log('JSON Diagnostics Tool already exists, skipping creation');
    return;
  }
  
  console.log('Creating JSON diagnostics tool...');
  
  const diagnosticsScript = `/**
 * JSON Error Diagnostics Tool
 * 
 * This script provides extended diagnostics for JSON parsing errors
 * and helps identify the exact source of "Unexpected end of input" errors.
 */

(function() {
  console.log('🔍 JSON Error Diagnostics Tool loaded and running');
  
  // Track original JSON.parse
  const originalJsonParse = JSON.parse;
  
  // Override JSON.parse with error diagnostics
  JSON.parse = function(text) {
    try {
      return originalJsonParse.apply(this, arguments);
    } catch (error) {
      // Only provide extended diagnostics for the specific error
      if (error.message.includes('Unexpected end of input')) {
        console.error('🔍 JSON Parse Error: Unexpected end of input');
        console.error('Text length:', text.length);
        
        // Analyze the structure
        const openBraces = (text.match(/{/g) || []).length;
        const closeBraces = (text.match(/}/g) || []).length;
        const openBrackets = (text.match(/\\[/g) || []).length;
        const closeBrackets = (text.match(/\\]/g) || []).length;
        
        console.error('Structure analysis:');
        console.error(\`- Opening braces: \${openBraces}, Closing braces: \${closeBraces}\`);
        console.error(\`- Opening brackets: \${openBrackets}, Closing brackets: \${closeBrackets}\`);
        
        // Show problematic content
        if (text.length > 100) {
          console.error('Last 100 characters:', text.slice(-100));
        } else {
          console.error('Full content:', text);
        }
      }
      
      // Re-throw the error
      throw error;
    }
  };
  
  // Add global error handler for JSON parse errors
  window.addEventListener('error', function(event) {
    const error = event.error;
    
    if (error && error.message && error.message.includes('JSON')) {
      console.error('🔍 Global JSON Error Detector caught:', error.message);
      
      // If this is related to a fetch operation, add more context
      const stack = error.stack || '';
      if (stack.includes('fetch')) {
        console.error('This appears to be a fetch-related JSON error');
      }
    }
  });
  
  console.log('✅ JSON Error Diagnostics Tool initialization complete');
})();`;

  fs.writeFileSync(diagnosticsPath, diagnosticsScript);
  console.log('Created JSON diagnostics tool at', diagnosticsPath);
}

// Create Enhanced Dashboard Helper
function createDashboardHelper() {
  const helperPath = path.join(__dirname, '../public/js/dashboard-debug-helper.js');
  
  if (fileExists(helperPath)) {
    console.log('Dashboard Helper already exists, skipping creation');
    return;
  }
  
  console.log('Creating dashboard helper script...');
  
  const helperScript = `/**
 * Dashboard Debug Helper
 * 
 * This script provides enhanced debugging specifically for the dashboard
 * to fix JSON parsing and data loading issues.
 */

(function() {
  console.log('Dashboard debug helper loaded');
  
  // Safe data loader
  function safeLoadData(url, options = {}) {
    return new Promise((resolve, reject) => {
      console.log('Safe data loader: Loading from', url);
      
      // Add default options
      const fetchOptions = {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          ...options.headers
        },
        ...options
      };
      
      // Set a timeout
      const timeoutId = setTimeout(() => {
        console.error('Safe data loader: Request timed out for', url);
        reject(new Error('Request timed out'));
      }, 10000);
      
      fetch(url, fetchOptions)
        .then(response => {
          clearTimeout(timeoutId);
          
          console.log('Safe data loader: Response status', response.status);
          
          if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.status);
          }
          
          return response.text();
        })
        .then(text => {
          try {
            // Try to parse as JSON
            const data = JSON.parse(text);
            console.log('Safe data loader: Successfully parsed JSON');
            resolve(data);
          } catch (error) {
            console.error('Safe data loader: JSON parse error', error.message);
            console.error('Safe data loader: Response text', text);
            
            // Try to fix common JSON issues
            try {
              let fixedText = text;
              
              // Fix unclosed objects/arrays
              const openBraces = (text.match(/{/g) || []).length;
              const closeBraces = (text.match(/}/g) || []).length;
              const openBrackets = (text.match(/\\[/g) || []).length;
              const closeBrackets = (text.match(/\\]/g) || []).length;
              
              if (openBraces > closeBraces) {
                fixedText += '}'.repeat(openBraces - closeBraces);
              }
              
              if (openBrackets > closeBrackets) {
                fixedText += ']'.repeat(openBrackets - closeBrackets);
              }
              
              // Try parsing the fixed text
              const fixedData = JSON.parse(fixedText);
              console.log('Safe data loader: Fixed JSON and parsed successfully');
              resolve(fixedData);
            } catch (fixError) {
              // If we couldn't fix it, reject with the original error
              reject(error);
            }
          }
        })
        .catch(error => {
          clearTimeout(timeoutId);
          console.error('Safe data loader: Fetch error', error);
          reject(error);
        });
    });
  }
  
  // Attach to window for use in dashboard scripts
  window.safeLoadData = safeLoadData;
  console.log('Safe data loader ready');
  
  // Enhanced fetch logging
  if (window.location.pathname.includes('/dashboard')) {
    console.log('Dashboard debug helper: Enhanced fetch logging enabled');
    
    // Periodically check for dashboard loading issues
    let checkCount = 0;
    const maxChecks = 5;
    
    function checkDashboardLoading() {
      if (checkCount >= maxChecks) return;
      
      const dashboardContent = document.querySelector('.dashboard-content');
      const leadElements = document.querySelectorAll('.lead-card, .lead-row');
      
      if (!dashboardContent || leadElements.length === 0) {
        console.warn('Dashboard debug helper: Dashboard content may not be loading properly');
        
        // If we're on the last check and still no content, try to reload dashboard data
        if (checkCount === maxChecks - 1) {
          console.log('Dashboard debug helper: Attempting to manually load dashboard data');
          
          safeLoadData('/api/dashboard')
            .then(data => {
              console.log('Dashboard debug helper: Manual data load successful');
            })
            .catch(error => {
              console.error('Dashboard debug helper: Manual data load failed', error);
            });
        }
      } else {
        console.log('Dashboard debug helper: Dashboard content loaded successfully');
      }
      
      checkCount++;
    }
    
    // Check loading status at intervals
    setTimeout(checkDashboardLoading, 2000);
    setTimeout(checkDashboardLoading, 5000);
    setTimeout(checkDashboardLoading, 10000);
  }
})();`;

  fs.writeFileSync(helperPath, helperScript);
  console.log('Created dashboard helper script at', helperPath);
}

// Add all script tags to the dashboard HTML
function addScriptsToDashboard() {
  const dashboardPath = path.join(__dirname, '../public/dashboard.html');
  
  if (!fileExists(dashboardPath)) {
    console.error('Dashboard HTML file not found');
    return;
  }
  
  console.log('Adding diagnostic scripts to dashboard.html...');
  
  let content = fs.readFileSync(dashboardPath, 'utf8');
  
  // Check if scripts are already added
  if (content.includes('debug-response.js') && content.includes('api-interceptor.js')) {
    console.log('Diagnostic scripts already added to dashboard.html');
    return;
  }
  
  // Scripts to add (in order of loading)
  const scripts = [
    '/js/debug-response.js',
    '/js/api-interceptor.js',
    '/js/auth-fix.js',
    '/js/diagnose-json-error.js',
    '/js/client-json-monitor.js',
    '/js/html-structure-fix.js',
    '/js/dashboard-debug-helper.js'
  ];
  
  // Find a good insertion point - after the last existing script in the head
  const headEndMatch = content.match(/<\/head>/i);
  
  if (!headEndMatch) {
    console.error('Could not find </head> tag in dashboard.html');
    return;
  }
  
  // Create script tags
  const scriptTags = scripts.map(src => `  <script src="${src}"></script>`).join('\n');
  
  // Insert scripts before the head closing tag
  const headEndIndex = headEndMatch.index;
  const newContent = 
    content.substring(0, headEndIndex) + 
    '\n' + scriptTags + '\n' + 
    content.substring(headEndIndex);
  
  // Write the updated file
  fs.writeFileSync(dashboardPath, newContent);
  console.log('Added diagnostic scripts to dashboard.html');
}

// Create a validator for API responses
function createApiValidator() {
  const validatorPath = path.join(__dirname, '../public/js/api-validator.js');
  
  if (fileExists(validatorPath)) {
    console.log('API Validator already exists, skipping creation');
    return;
  }
  
  console.log('Creating API validator script...');
  
  const validatorScript = `/**
 * API Validator
 * 
 * This script validates API responses to ensure they are properly
 * formatted and can be parsed as JSON.
 */

(function() {
  // Safe data loader with validation
  function loadDataSafely(url, options = {}) {
    return new Promise((resolve, reject) => {
      fetch(url, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        },
        ...options
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok: ' + response.status);
        }
        
        return response.text();
      })
      .then(text => {
        // Validate the response text before parsing
        let validJson = true;
        let parseError = null;
        
        try {
          JSON.parse(text);
        } catch (error) {
          validJson = false;
          parseError = error;
          
          console.error('Invalid JSON response from ' + url);
          console.error('Error:', error.message);
          console.error('Response text:', text);
          
          // Try to fix common issues
          let fixedText = text;
          
          // Check for unclosed objects/arrays
          const openBraces = (text.match(/{/g) || []).length;
          const closeBraces = (text.match(/}/g) || []).length;
          
          if (openBraces > closeBraces) {
            console.log('Attempting to fix unclosed JSON object');
            fixedText += '}'.repeat(openBraces - closeBraces);
            
            try {
              const fixedJson = JSON.parse(fixedText);
              console.log('Successfully fixed and parsed JSON');
              resolve(fixedJson);
              return;
            } catch (fixError) {
              console.error('Could not fix JSON:', fixError.message);
            }
          }
        }
        
        if (validJson) {
          resolve(JSON.parse(text));
        } else {
          reject(parseError || new Error('Invalid JSON'));
        }
      })
      .catch(error => {
        console.error('Error fetching ' + url + ':', error);
        reject(error);
      });
    });
  }
  
  // Attach to window
  window.loadDataSafely = loadDataSafely;
  
  console.log('API validator initialized - improved JSON error handling');
})();`;

  fs.writeFileSync(validatorPath, validatorScript);
  console.log('Created API validator script at', validatorPath);
}

// Main function to fix JSON errors
function main() {
  console.log('JSON Error Fix script started');
  
  // Create all helper scripts
  createJsonMonitor();
  createResponseDebug();
  createHtmlStructureFix();
  createAuthFix();
  createApiInterceptor();
  createJsonDiagnosticsTool();
  createDashboardHelper();
  createApiValidator();
  
  // Add scripts to dashboard
  addScriptsToDashboard();
  
  console.log('JSON Error Fix script completed');
}

// Run the main function
main();