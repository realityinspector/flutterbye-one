/**
 * Dashboard JSON Error Diagnostic Tool
 * 
 * This script can be added to dashboard.html to trace and log every API call
 * and detect JSON parsing errors in real-time.
 */
(function() {
  console.log("🔍 JSON Error Diagnostics Tool loaded and running");
  
  // Save original methods
  const originalFetch = window.fetch;
  const originalJSONParse = JSON.parse;
  
  // Track all API responses for logging
  const apiResponses = {};
  
  // Replace JSON.parse with a wrapped version to catch errors
  JSON.parse = function(text) {
    try {
      return originalJSONParse.call(this, text);
    } catch (error) {
      console.error("🚨 JSON PARSE ERROR:", error.message);
      console.error("🔍 Problematic JSON content:", text.substring(0, 500) + (text.length > 500 ? "..." : ""));
      
      // Log the stack trace to find where the error is occurring
      console.error("📑 Stack trace:", new Error().stack);
      
      // Create a visible error notification
      showErrorNotification({
        title: "JSON Parse Error Detected",
        message: `Error message: ${error.message}\nCheck console for details.`,
        text: text.substring(0, 100) + (text.length > 100 ? "..." : "")
      });
      
      throw error; // Re-throw to maintain original behavior
    }
  };
  
  // Replace fetch to monitor API responses
  window.fetch = function(url, options) {
    const requestData = {
      url: url,
      options: options,
      timestamp: new Date().toISOString()
    };
    
    console.log(`🔄 API Request: ${url}`, options);
    
    return originalFetch.call(this, url, options)
      .then(response => {
        const clonedResponse = response.clone();
        
        // Only process certain API endpoints
        if (typeof url === 'string' && 
            (url.startsWith('/api/') || url.includes('dashboard') || url.includes('leads'))) {
          
          requestData.status = response.status;
          
          // Get the raw text response
          return clonedResponse.text().then(text => {
            requestData.rawResponse = text;
            requestData.responseSize = text.length;
            
            console.log(`✅ Response for ${url}: Status=${response.status}, Size=${text.length} bytes`);
            
            // Check for empty or suspiciously short responses
            if (!text || text.trim() === '') {
              console.error(`⚠️ Empty response for ${url}`);
              requestData.error = 'Empty response';
            } else if (text.length < 5) {
              console.error(`⚠️ Suspicious short response for ${url}: "${text}"`);
              requestData.error = 'Suspiciously short response';
            }
            
            // Check if the text is valid JSON
            try {
              const jsonData = originalJSONParse.call(window, text);
              requestData.parsedSuccessfully = true;
              
              // Store the response for later analysis
              const key = url.toString();
              apiResponses[key] = apiResponses[key] || [];
              apiResponses[key].push(requestData);
              
              // Reconstruct response with the parsed data
              return new Response(text, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
              });
            } catch (error) {
              console.error(`❌ JSON parse error for ${url}:`, error.message);
              console.error(`💾 Raw response (first 200 chars): ${text.substring(0, 200)}`);
              
              requestData.parsedSuccessfully = false;
              requestData.parseError = error.message;
              
              // Store the problematic response
              const key = url.toString();
              apiResponses[key] = apiResponses[key] || [];
              apiResponses[key].push(requestData);
              
              // Show error notification
              showErrorNotification({
                title: "API Response Error",
                message: `Failed to parse response from ${url}\nError: ${error.message}`,
                text: text.substring(0, 100) + (text.length > 100 ? "..." : "")
              });
              
              // Return the original response so the application can handle it
              return new Response(text, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
              });
            }
          }).catch(error => {
            console.error(`❌ Error processing response for ${url}:`, error);
            return response;
          });
        }
        
        // For non-API requests just return the original response
        return response;
      });
  };
  
  // Create a function to show error notifications on the page
  function showErrorNotification(details) {
    // Create the notification element
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '10px';
    notification.style.right = '10px';
    notification.style.maxWidth = '400px';
    notification.style.backgroundColor = '#ffebee';
    notification.style.color = '#b71c1c';
    notification.style.padding = '15px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notification.style.zIndex = '9999';
    notification.style.fontFamily = 'sans-serif';
    
    // Add content
    notification.innerHTML = `
      <div style="font-weight:bold;margin-bottom:5px;">${details.title}</div>
      <div style="font-size:14px;margin-bottom:10px;">${details.message}</div>
      ${details.text ? `<div style="font-size:12px;padding:5px;background:#f5f5f5;overflow:auto;max-height:100px;word-break:break-all;">${details.text}</div>` : ''}
      <div style="text-align:right;margin-top:10px;">
        <button id="errorDetailBtn" style="background:none;border:1px solid #b71c1c;color:#b71c1c;padding:3px 8px;margin-right:5px;cursor:pointer;">Details</button>
        <button id="errorCloseBtn" style="background:#b71c1c;color:white;border:none;padding:3px 8px;cursor:pointer;">Close</button>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Add event listeners
    document.getElementById('errorDetailBtn').addEventListener('click', function() {
      console.log('📊 Complete API response log:', apiResponses);
      alert('Detailed logs have been printed to the console');
    });
    
    document.getElementById('errorCloseBtn').addEventListener('click', function() {
      notification.remove();
    });
    
    // Remove notification after a timeout
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.remove();
      }
    }, 30000);
  }
  
  // Expose a global function to check all API calls
  window.checkApiResponses = function() {
    console.log('📊 Complete API response log:', apiResponses);
    
    // Check for problematic responses
    let problemFound = false;
    for (const url in apiResponses) {
      for (const request of apiResponses[url]) {
        if (!request.parsedSuccessfully) {
          console.error(`❌ Problem with ${url}:`, request.parseError);
          problemFound = true;
        }
      }
    }
    
    if (!problemFound) {
      console.log('✅ No JSON parsing problems found in recorded API calls');
    }
    
    return apiResponses;
  };
  
  // Add global error handler for uncaught errors
  window.addEventListener('error', function(event) {
    if (event.message && event.message.includes('JSON') && 
        (event.message.includes('Unexpected end of input') || event.message.includes('Unterminated'))) {
      
      console.error('⚠️ Global JSON Parse Error detected:', event);
      
      // Check for URL in the stack trace
      const stack = event.error ? event.error.stack : '';
      const lines = stack.split('\n');
      let possibleApi = 'unknown';
      
      for (const line of lines) {
        if (line.includes('/api/')) {
          const match = line.match(/\/api\/[\w\/-]+/);
          if (match) {
            possibleApi = match[0];
            break;
          }
        }
      }
      
      showErrorNotification({
        title: "Global JSON Parse Error",
        message: `Error: ${event.message}\nPossible API: ${possibleApi}\nLocation: ${event.filename} (${event.lineno}:${event.colno})`,
        text: null
      });
    }
  });
  
  console.log("✅ JSON Error Diagnostics Tool initialization complete");
})();