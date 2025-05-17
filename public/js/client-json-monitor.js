/**
 * Client-side JSON Parsing Monitor
 * 
 * This script monitors all client-side JSON parsing attempts to identify
 * where "Unexpected end of input" errors are occurring.
 */
(function() {
  console.log('🔍 Client-side JSON Monitor loaded');

  // Store original JSON.parse method
  const originalJSONParse = JSON.parse;
  
  // Override JSON.parse to add detailed logging and error tracing
  JSON.parse = function(text) {
    try {
      // Attempt the parse with original function
      return originalJSONParse.apply(this, arguments);
    } catch (error) {
      // If this is an "Unexpected end of input" error, log detailed diagnostics
      if (error.message && error.message.includes('Unexpected end of input')) {
        console.error('🚨 JSON PARSE ERROR: Unexpected end of input');
        console.error('📄 Content that caused the error:', text);
        console.error('📐 Content length:', (text || '').length);
        console.error('📑 Stack trace:', new Error().stack);
        
        // Check for common symptoms
        if (!text || text.trim() === '') {
          console.error('⚠️ Empty response detected');
        } else if (text.length < 5) {
          console.error('⚠️ Suspiciously short response:', text);
        } else {
          // Try to analyze the structure
          const lastChar = text.trim().slice(-1);
          const firstChar = text.trim().charAt(0);
          
          if ((firstChar === '{' && lastChar !== '}') || 
              (firstChar === '[' && lastChar !== ']')) {
            console.error('⚠️ Truncated JSON detected - response ends unexpectedly');
            
            // Log the last part of the response to help diagnose truncation
            console.error('Last 50 characters:', text.slice(-50));
          }
        }
        
        // Create a visual notification for the user
        showErrorNotification({
          title: 'JSON Parse Error Detected',
          message: 'Check browser console for details',
          details: 'Unexpected end of input error when parsing JSON response',
          text: text ? (text.length > 100 ? text.substring(0, 100) + '...' : text) : '(empty)'
        });
      }
      
      // Re-throw the original error
      throw error;
    }
  };
  
  // Function to show error notifications on the page
  function showErrorNotification(info) {
    // Create container if it doesn't exist
    let container = document.getElementById('json-error-notifications');
    if (!container) {
      container = document.createElement('div');
      container.id = 'json-error-notifications';
      container.style.position = 'fixed';
      container.style.top = '10px';
      container.style.right = '10px';
      container.style.zIndex = '9999';
      container.style.maxWidth = '400px';
      document.body.appendChild(container);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.style.backgroundColor = '#f8d7da';
    notification.style.color = '#721c24';
    notification.style.padding = '12px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    notification.style.marginBottom = '10px';
    notification.style.fontSize = '14px';
    notification.style.fontFamily = 'sans-serif';
    
    // Add content
    notification.innerHTML = `
      <div style="font-weight:bold;margin-bottom:6px;">${info.title}</div>
      <div style="margin-bottom:8px;">${info.message}</div>
      <div style="font-size:12px;color:#555;margin-bottom:8px;">${info.details}</div>
      <div style="font-size:12px;background:#f5f5f5;padding:8px;overflow:auto;max-height:100px;margin-bottom:8px;word-break:break-all;border-radius:3px;">${info.text}</div>
      <div style="text-align:right;">
        <button id="errorCloseBtn-${Date.now()}" style="background:#721c24;color:white;border:none;padding:4px 8px;cursor:pointer;border-radius:3px;">Dismiss</button>
      </div>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Add event listener to close button
    const closeBtn = notification.querySelector(`[id^="errorCloseBtn-"]`);
    closeBtn.addEventListener('click', function() {
      notification.remove();
    });
    
    // Auto-remove after 15 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.remove();
      }
    }, 15000);
  }
  
  // Monitor fetch API to intercept response streams before they're parsed
  const originalFetch = window.fetch;
  
  window.fetch = function(resource, options) {
    const url = resource instanceof Request ? resource.url : resource;
    
    return originalFetch.apply(this, arguments)
      .then(response => {
        // Only process API responses to avoid intercepting all requests
        if (typeof url === 'string' && 
            (url.startsWith('/api/') || url.includes('dashboard-check'))) {
          
          // Clone the response to examine it
          const cloned = response.clone();
          
          // Process the text first to log raw content
          return cloned.text().then(text => {
            console.log(`Fetch response for ${url}:`, 
              text.length > 100 ? `${text.substring(0, 100)}... (${text.length} chars)` : text);
            
            // Check for empty/invalid responses
            if (!text || text.trim() === '') {
              console.warn(`Empty response from ${url}`);
            }
            
            try {
              // Try parsing it to verify it's valid JSON
              const data = JSON.parse(text);
              console.log(`✅ Valid JSON from ${url}`);
              
              // Return new response with the parsed data
              return new Response(text, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
              });
            } catch (error) {
              console.error(`❌ Invalid JSON from ${url}:`, error.message);
              
              // Return original response to let normal error handling take over
              return response;
            }
          }).catch(error => {
            console.error(`Error processing response from ${url}:`, error);
            return response;
          });
        }
        
        // Return normal response for non-API requests
        return response;
      });
  };
  
  console.log('✅ Client-side JSON Monitor initialized');
})();