/**
 * Dashboard Debug Helper
 * 
 * This script adds enhanced error logging for dashboard API requests
 * to help diagnose the "Unexpected end of input" error.
 */

(function() {
  console.log('Dashboard debug helper loaded');
  
  // Original fetch function
  const originalFetch = window.fetch;
  
  // Override fetch to add detailed logging and error handling
  window.fetch = function(url, options) {
    // Log the request
    console.log(`API Request: ${url}`, options);
    
    // Call the original fetch
    return originalFetch(url, options)
      .then(response => {
        console.log(`API Response status for ${url}:`, response.status);
        
        // Clone the response so we can examine the body without consuming it
        const clonedResponse = response.clone();
        
        // For API requests, add special handling
        if (url && typeof url === 'string' && (url.startsWith('/api/') || url.includes('dashboard-check'))) {
          // Check for non-200 responses
          if (!response.ok) {
            console.error(`API error for ${url}:`, response.status, response.statusText);
            // Let the original promise chain handle the error
            return response;
          }
          
          // Process the response body to check for valid JSON
          return clonedResponse.text().then(text => {
            console.log(`API Response for ${url} (first 100 chars):`, text.substring(0, 100) + (text.length > 100 ? '...' : ''));
            
            // Check for empty responses
            if (!text || !text.trim()) {
              console.error(`Empty response from ${url}`);
              throw new Error(`Empty response from ${url}`);
            }
            
            try {
              // Try to parse the JSON
              const data = JSON.parse(text);
              console.log(`Successfully parsed JSON from ${url}`, data.success);
              
              // Check if the API response indicates failure
              if (data && data.success === false) {
                console.warn(`API reported failure for ${url}:`, data.message || 'No error message provided');
              }
              
              // Reconstruct a response with the parsed data
              return new Response(JSON.stringify(data), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
              });
            } catch (err) {
              console.error(`JSON parse error for ${url}:`, err.message);
              console.error('Raw response text:', text);
              throw new Error(`Failed to parse JSON from ${url}: ${err.message}`);
            }
          });
        }
        
        // For non-API requests, just return the original response
        return response;
      })
      .catch(error => {
        console.error(`Network error for ${url}:`, error.message);
        throw error;
      });
  };
  
  // Additional error handling for the global fetch
  window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled Promise Rejection:', event.reason);
    if (event.reason && event.reason.message && event.reason.message.includes('JSON')) {
      console.error('This appears to be a JSON parsing error. Check the previous API requests for details.');
    }
  });
  
  console.log('Dashboard debug helper: Enhanced fetch logging enabled');
})();