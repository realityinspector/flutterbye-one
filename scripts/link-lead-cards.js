/**
 * Link Lead Cards Script
 * 
 * This script adds the necessary script reference to the dashboard HTML
 * so the lead cards display properly.
 */

const fs = require('fs');
const path = require('path');

// Path to the dashboard HTML file
const dashboardPath = path.join(__dirname, '../public/dashboard.html');

console.log('Reading dashboard.html...');
let dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');

// Add script reference to our lead cards solution
console.log('Adding script reference to lead cards solution...');

// Find the closing head tag
const headEndPos = dashboardHtml.indexOf('</head>');
if (headEndPos !== -1) {
  // Add script reference
  const scriptReference = `
  <!-- Lead Cards Display -->
  <script src="/lead-cards-solution.js" defer></script>
`;
  
  dashboardHtml = 
    dashboardHtml.substring(0, headEndPos) + 
    scriptReference +
    dashboardHtml.substring(headEndPos);
  
  // Write the updated content back to the file
  fs.writeFileSync(dashboardPath, dashboardHtml);
  console.log('Added script reference to dashboard.html');
} else {
  console.log('Could not find </head> tag in dashboard.html');
}

// Ensure the proper container structure exists in the dashboard
console.log('Ensuring container structure exists...');

// Look for dashboard-content div
const dashboardContentPos = dashboardHtml.indexOf('<div class="dashboard-content">');
if (dashboardContentPos !== -1) {
  // Check if recent-leads-list container exists
  if (!dashboardHtml.includes('recent-leads-list')) {
    // Find where to insert the container
    const dashboardContentEndPos = dashboardHtml.indexOf('>', dashboardContentPos) + 1;
    
    // Add the container structure
    const containerHtml = `
      <div class="container mt-4">
        <div class="row">
          <div class="col-md-12">
            <div class="dashboard-stats">
              <!-- Stats cards will be inserted here -->
            </div>
          </div>
        </div>
        <div class="row mt-4">
          <div class="col-md-12">
            <div class="recent-leads-container">
              <h3 class="section-title">Recent Leads</h3>
              <div class="recent-leads-list">
                <!-- Leads will be displayed here -->
                <div class="loading-indicator">Loading leads...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    dashboardHtml = 
      dashboardHtml.substring(0, dashboardContentEndPos) + 
      containerHtml +
      dashboardHtml.substring(dashboardContentEndPos);
    
    // Write the updated content back to the file
    fs.writeFileSync(dashboardPath, dashboardHtml);
    console.log('Added container structure to dashboard.html');
  } else {
    console.log('Container structure already exists');
  }
} else {
  console.log('Could not find dashboard-content div');
}

console.log('Done linking lead cards script');