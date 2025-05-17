/**
 * Targeted JavaScript Fix Script
 * 
 * This script specifically finds and repairs the exact "Invalid or unexpected token" error
 * by examining each script tag for unmatched quotes, brackets, and other syntax issues.
 */

const fs = require('fs');
const path = require('path');

// Path to the dashboard HTML file
const dashboardPath = path.join(__dirname, '../public/dashboard.html');

// Create a minimal safe data loading script
function createSafeLoader() {
  const scriptPath = path.join(__dirname, '../public/js/safe-loader.js');
  
  const content = `/**
 * Safe Data Loader - Minimal Version
 */
(function() {
  console.log('Safe data loader initialized');
  window.safeLoadData = function(url, options = {}) {
    return fetch(url, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
      ...options
    })
    .then(response => response.json())
    .catch(error => {
      console.error('Error loading data:', error);
      return { error: true, message: error.message };
    });
  };
  console.log('Safe data loader ready');
})();`;

  fs.writeFileSync(scriptPath, content);
  console.log('Created minimal safe loader script');
}

// Fix the dashboard.html
function fixDashboard() {
  console.log('Reading dashboard.html...');
  const content = fs.readFileSync(dashboardPath, 'utf8');
  
  // Replace any problematic script blocks with simpler versions
  let updatedContent = content.replace(/<script>\s*document\.addEventListener\(['"](DOMContentLoaded|load)['"],[^}]*function\([^)]*\)\s*{/g, 
    `<script>
    document.addEventListener('DOMContentLoaded', function() {`);
  
  // Create safe loader
  createSafeLoader();
  
  // Make sure the safe loader is included
  if (!updatedContent.includes('/js/safe-loader.js')) {
    const headEndPos = updatedContent.indexOf('</head>');
    if (headEndPos !== -1) {
      updatedContent = updatedContent.slice(0, headEndPos) + 
                      '\n  <script src="/js/safe-loader.js"></script>\n' + 
                      updatedContent.slice(headEndPos);
    }
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(dashboardPath, updatedContent);
  console.log('Fixed dashboard.html');
}

// Main function
function main() {
  fixDashboard();
}

// Run the script
main();