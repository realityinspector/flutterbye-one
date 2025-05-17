/**
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
