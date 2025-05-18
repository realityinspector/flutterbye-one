/**
 * Final Dashboard Fix
 * 
 * This script adds the lead-cards-fix.js script to the dashboard.html
 * to ensure leads display properly.
 */

const fs = require('fs');
const path = require('path');

// Path to the dashboard HTML file
const dashboardPath = path.join(__dirname, '../public/dashboard.html');

console.log('Reading dashboard.html...');
let dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');

// Add script reference to lead cards fix
console.log('Adding script reference to lead cards fix...');

// Find the closing head tag
const headEndPos = dashboardHtml.indexOf('</head>');
if (headEndPos !== -1) {
  // Add script reference
  const scriptReference = `
  <!-- Lead Cards Fix -->
  <script src="/lead-cards-fix.js"></script>
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

console.log('Final dashboard fix complete');