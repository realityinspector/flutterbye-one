/**
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
              const openBrackets = (text.match(/\[/g) || []).length;
              const closeBrackets = (text.match(/\]/g) || []).length;
              
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
})();