/**
 * Authentication Fix for Dashboard
 * 
 * This script fixes authentication issues that cause "Unexpected end of input" errors
 * by properly handling token storage and API requests.
 */

(function() {
  console.log('Authentication fix loaded');
  
  // Function to redirect to login if not authenticated
  function redirectToLogin() {
    console.log('Authentication required, redirecting to login page');
    window.location.href = '/?auth=required';
  }
  
  // Wait for DOM to be loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Check if we're already on the login page
    if (window.location.pathname === '/') {
      return;
    }
    
    // Use a safer method to check authentication without relying on JSON parsing
    fetch('/dashboard-check', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    })
    .then(response => {
      console.log('Authentication check status:', response.status);
      
      if (!response.ok) {
        console.error('Authentication check failed with status:', response.status);
        redirectToLogin();
        return null;
      }
      
      // Safely handle JSON parsing
      return response.text().then(text => {
        try {
          if (!text || text.trim() === '') {
            throw new Error('Empty response from authentication check');
          }
          return JSON.parse(text);
        } catch (err) {
          console.error('Failed to parse authentication response:', err);
          console.error('Response text:', text);
          redirectToLogin();
          return null;
        }
      });
    })
    .then(data => {
      if (!data) return; // Already handled in previous step
      
      if (!data.authenticated) {
        console.log('Not authenticated according to server response');
        redirectToLogin();
        return;
      }
      
      console.log('Authentication successful, user:', data.user?.username || 'unknown');
      
      // Once authenticated, set up API interceptors for all fetch calls
      const originalFetch = window.fetch;
      window.fetch = function(url, options = {}) {
        // Only intercept API calls
        if (typeof url === 'string' && url.startsWith('/api/')) {
          // Ensure options is an object
          options = options || {};
          
          // Ensure headers exist
          options.headers = options.headers || {};
          
          // Always include credentials for API calls
          options.credentials = 'include';
          
          console.log(`Sending API request to ${url} with credentials included`);
        }
        
        // Call original fetch with potentially modified options
        return originalFetch.call(this, url, options)
          .then(response => {
            // For API endpoints, add better error handling
            if (typeof url === 'string' && url.startsWith('/api/')) {
              if (response.status === 401) {
                console.error('API authentication error:', url);
                redirectToLogin();
                throw new Error('Authentication required');
              }
            }
            return response;
          });
      };
    })
    .catch(error => {
      console.error('Authentication check error:', error);
      redirectToLogin();
    });
  });
})();