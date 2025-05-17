/**
 * Dashboard API Response Debugger
 * 
 * This script will log the exact response from API endpoints to help diagnose
 * the "Unexpected end of input" error.
 */

(function() {
  console.log('API response debugger loaded');
  
  // Function to safely stringify objects for logging
  function safeStringify(obj) {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return `[Error stringifying: ${e.message}]`;
    }
  }
  
  // Add a global error handler for JSON parse errors
  window.addEventListener('error', function(event) {
    const errorMsg = event.message || '';
    if (errorMsg.includes('JSON') || errorMsg.includes('Unexpected end of input')) {
      console.error('=== JSON PARSE ERROR DETECTED ===');
      console.error('Error message:', errorMsg);
      console.error('Error location:', event.filename, 'Line:', event.lineno, 'Column:', event.colno);
      console.error('See above logs for API response details that may have triggered this error');
      
      // Prevent the default error handling
      event.preventDefault();
      
      // Display a user-friendly message on the page
      const errorContainer = document.createElement('div');
      errorContainer.style.position = 'fixed';
      errorContainer.style.top = '0';
      errorContainer.style.left = '0';
      errorContainer.style.right = '0';
      errorContainer.style.padding = '10px';
      errorContainer.style.backgroundColor = '#f8d7da';
      errorContainer.style.color = '#721c24';
      errorContainer.style.textAlign = 'center';
      errorContainer.style.zIndex = '9999';
      errorContainer.innerHTML = `
        <p>Error loading dashboard data. Technical details: ${errorMsg}</p>
        <button id="errorDismiss" style="background: #721c24; color: white; border: none; padding: 5px 10px; cursor: pointer;">
          Dismiss
        </button>
      `;
      document.body.appendChild(errorContainer);
      
      document.getElementById('errorDismiss').addEventListener('click', function() {
        errorContainer.remove();
      });
      
      return true;
    }
  });
  
  // Capture API responses for detailed logging
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    // Timestamp for tracking request timing
    const requestStart = new Date().getTime();
    
    // Only log API calls
    if (typeof url === 'string' && (url.startsWith('/api/') || url.includes('dashboard-check'))) {
      console.log(`[${new Date().toISOString()}] 🌐 API Request: ${url}`);
      
      return originalFetch(url, options)
        .then(response => {
          const requestDuration = new Date().getTime() - requestStart;
          console.log(`[${new Date().toISOString()}] ✅ API Response (${requestDuration}ms): ${url} - Status: ${response.status}`);
          
          // Clone the response to inspect its body without consuming it
          const cloned = response.clone();
          
          // Extract the raw response text
          cloned.text().then(text => {
            console.log(`[${new Date().toISOString()}] 📄 Response text for ${url}:`);
            console.log('---START RESPONSE---');
            console.log(text || '(empty response)');
            console.log('---END RESPONSE---');
            
            // Try to parse as JSON to see if it's valid
            try {
              if (text && text.trim()) {
                const json = JSON.parse(text);
                console.log(`[${new Date().toISOString()}] ✓ Valid JSON response for ${url}:`, safeStringify(json));
              } else {
                console.warn(`[${new Date().toISOString()}] ⚠️ Empty response for ${url}`);
              }
            } catch (error) {
              console.error(`[${new Date().toISOString()}] ❌ Invalid JSON for ${url}:`, error.message);
            }
          }).catch(err => {
            console.error(`[${new Date().toISOString()}] 💥 Error reading response text from ${url}:`, err.message);
          });
          
          return response;
        })
        .catch(error => {
          console.error(`[${new Date().toISOString()}] 💥 Network error for ${url}:`, error.message);
          throw error;
        });
    }
    
    // For non-API calls, just use the original fetch
    return originalFetch(url, options);
  };
  
  // Also monitor XMLHttpRequest (for any code not using fetch)
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    const url = arguments[1];
    
    if (typeof url === 'string' && (url.startsWith('/api/') || url.includes('dashboard-check'))) {
      const requestStart = new Date().getTime();
      console.log(`[${new Date().toISOString()}] 🌐 XHR Request: ${url}`);
      
      this.addEventListener('load', function() {
        const requestDuration = new Date().getTime() - requestStart;
        console.log(`[${new Date().toISOString()}] ✅ XHR Response (${requestDuration}ms): ${url} - Status: ${this.status}`);
        
        // Log response text
        console.log(`[${new Date().toISOString()}] 📄 XHR Response text for ${url}:`);
        console.log('---START XHR RESPONSE---');
        console.log(this.responseText || '(empty response)');
        console.log('---END XHR RESPONSE---');
        
        // Try to parse as JSON
        try {
          if (this.responseText && this.responseText.trim()) {
            const json = JSON.parse(this.responseText);
            console.log(`[${new Date().toISOString()}] ✓ Valid XHR JSON response for ${url}:`, safeStringify(json));
          } else {
            console.warn(`[${new Date().toISOString()}] ⚠️ Empty XHR response for ${url}`);
          }
        } catch (error) {
          console.error(`[${new Date().toISOString()}] ❌ Invalid XHR JSON for ${url}:`, error.message);
        }
      });
      
      this.addEventListener('error', function() {
        console.error(`[${new Date().toISOString()}] 💥 XHR error for ${url}`);
      });
    }
    
    return originalXHROpen.apply(this, arguments);
  };

  console.log('API response debugger installed - all API responses will be logged with detailed inspection');
})();