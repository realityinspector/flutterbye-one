/**
 * Add Leads Display Route
 * 
 * This script adds a route to the server to serve the leads display page
 */

const fs = require('fs');
const path = require('path');

// Path to the routes file
const routesPath = path.join(__dirname, '../server/routes.js');

console.log('Reading routes.js...');
let routesContent = fs.readFileSync(routesPath, 'utf8');

// Check if the route already exists
if (routesContent.includes('/leads-display')) {
  console.log('Leads display route already exists');
} else {
  console.log('Adding leads display route...');
  
  // Find a good insertion point - after another route
  const insertPoint = routesContent.indexOf("app.get('/dashboard'");
  
  if (insertPoint !== -1) {
    // Create the new route
    const newRoute = `
  // Leads display route
  app.get('/leads-display', authenticateJWT, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/leads-display.html'));
  });

`;
    
    // Insert the new route
    routesContent = 
      routesContent.substring(0, insertPoint) + 
      newRoute +
      routesContent.substring(insertPoint);
    
    // Write the updated content back to the file
    fs.writeFileSync(routesPath, routesContent);
    console.log('Added leads display route to routes.js');
  } else {
    console.log('Could not find a suitable insertion point');
  }
}

// Now let's also create a small link in the dashboard to access this page
const dashboardPath = path.join(__dirname, '../public/dashboard.html');

console.log('Checking dashboard.html...');
if (fs.existsSync(dashboardPath)) {
  let dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');
  
  // Check if there's already a link to leads display
  if (!dashboardHtml.includes('/leads-display')) {
    console.log('Adding leads display link to dashboard...');
    
    // Find the navbar or a good insertion point
    const navbarPos = dashboardHtml.indexOf('<nav');
    
    if (navbarPos !== -1) {
      // Find the ul element within the navbar
      const ulPos = dashboardHtml.indexOf('<ul', navbarPos);
      
      if (ulPos !== -1) {
        // Find the closing tag of the ul
        const ulEndPos = dashboardHtml.indexOf('</ul>', ulPos);
        
        if (ulEndPos !== -1) {
          // Insert our new nav link
          const navLink = `
              <li class="nav-item">
                <a class="nav-link" href="/leads-display">
                  <i class="fas fa-users"></i> Leads Display
                </a>
              </li>
            `;
          
          dashboardHtml = 
            dashboardHtml.substring(0, ulEndPos) + 
            navLink +
            dashboardHtml.substring(ulEndPos);
          
          // Write the updated content back to the file
          fs.writeFileSync(dashboardPath, dashboardHtml);
          console.log('Added leads display link to dashboard navbar');
        }
      }
    } else {
      console.log('Could not find navbar in dashboard.html');
      
      // As a fallback, add a simple link at the top of the body
      const bodyPos = dashboardHtml.indexOf('<body');
      
      if (bodyPos !== -1) {
        const bodyEndPos = dashboardHtml.indexOf('>', bodyPos) + 1;
        
        // Add a simple link
        const linkHtml = `
          <div style="padding: 10px; background-color: #f8f9fa; text-align: center;">
            <a href="/leads-display" style="color: #3f51b5; text-decoration: none; font-weight: bold;">
              <i class="fas fa-users"></i> View Leads Display
            </a>
          </div>
        `;
        
        dashboardHtml = 
          dashboardHtml.substring(0, bodyEndPos) + 
          linkHtml +
          dashboardHtml.substring(bodyEndPos);
        
        // Write the updated content back to the file
        fs.writeFileSync(dashboardPath, dashboardHtml);
        console.log('Added leads display link at top of dashboard');
      }
    }
  } else {
    console.log('Leads display link already exists in dashboard');
  }
} else {
  console.log('Dashboard HTML file not found');
}

console.log('Leads display route and link setup complete');