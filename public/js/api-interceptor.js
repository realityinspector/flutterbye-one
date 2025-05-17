/**
 * API Interceptor
 * 
 * This script fixes the "Unexpected end of input" error on the dashboard
 * by intercepting API requests and adding robust error handling for JSON parsing.
 */

(function() {
  console.log('API interceptor loaded');
  
  // Original fetch method
  const originalFetch = window.fetch;
  
  // Override fetch with our interceptor
  window.fetch = function(resource, options = {}) {
    const url = resource.toString();
    
    // Only intercept API calls to add special handling
    if (url.startsWith('/api/') || url.includes('dashboard-check')) {
      console.log(`Intercepting API request to: ${url}`);
      
      // Ensure we have options object
      options = options || {};
      
      // Make sure credentials are included for API calls
      options.credentials = 'include';
      
      // Make the API call with our enhanced options
      return originalFetch(resource, options)
        .then(response => {
          console.log(`Response from ${url}:`, response.status);
          
          // For failed responses, handle gracefully
          if (!response.ok) {
            console.error(`API error from ${url}:`, response.status, response.statusText);
            
            // Special handling for authentication errors
            if (response.status === 401 || response.status === 403) {
              console.error('Authentication error - redirecting to login page');
              // Don't redirect during initial page load to avoid redirect loops
              if (document.readyState === 'complete') {
                window.location.href = '/?auth=required';
              }
            }
            
            return response;
          }
          
          // For successful responses, safely handle JSON parsing
          // Clone the response so we can read the body text
          const clonedResponse = response.clone();
          
          // Return a modified response promise
          return clonedResponse.text().then(text => {
            // If response is empty, return empty object to avoid parsing errors
            if (!text || text.trim() === '') {
              console.warn(`Empty response from ${url} - returning empty data`);
              // Return a synthetic Response with empty JSON object
              return new Response(JSON.stringify({ 
                success: false, 
                data: null, 
                message: 'Empty response from server'
              }), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
              });
            }
            
            // Try to parse the JSON safely
            try {
              const data = JSON.parse(text);
              console.log(`Successfully parsed JSON response from ${url}`);
              
              // Return a new Response with the parsed data
              return new Response(JSON.stringify(data), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
              });
            } catch (error) {
              console.error(`JSON parsing error for ${url}:`, error.message);
              console.error('Response text (first 100 chars):', text.substring(0, 100));
              
              // Return a synthetic Response with error info
              return new Response(JSON.stringify({
                success: false,
                data: null,
                message: 'Invalid JSON response from server',
                error: error.message,
                originalText: text.substring(0, 100) + '...'
              }), {
                status: 200,
                statusText: 'OK',
                headers: new Headers({
                  'Content-Type': 'application/json'
                })
              });
            }
          });
        })
        .catch(error => {
          console.error(`Network error for ${url}:`, error.message);
          throw error;
        });
    }
    
    // For non-API requests, use original fetch
    return originalFetch(resource, options);
  };
  
  console.log('API interceptor installed - fetch requests will have enhanced error handling');
})();