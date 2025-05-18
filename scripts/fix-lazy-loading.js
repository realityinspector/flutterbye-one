/**
 * Fix Lazy Loading
 * 
 * This script updates the dashboard and leads pages to load data 
 * immediately on page load rather than using lazy loading techniques.
 */

const fs = require('fs');
const path = require('path');

// Path to the dashboard HTML file
const dashboardPath = path.join(__dirname, '../public/dashboard.html');

// Read the dashboard HTML file
console.log('Reading dashboard.html...');
let dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');

// Update the dashboard initialization code to load data immediately
console.log('Updating dashboard to load data immediately...');

// Find the DOMContentLoaded event listener and insert our data loading code
const domContentLoadedPattern = /document\.addEventListener\(['"]DOMContentLoaded['"]\s*,\s*function\s*\(\s*\)\s*\{/;
const immediateDataLoadingCode = `document.addEventListener('DOMContentLoaded', function() {
  // Initialize user interface
  initializeDashboard();
  
  // Load all data immediately instead of lazy loading
  fetchDashboardData();
  
  // Load leads data if on the leads page
  if (window.location.pathname === '/leads' || window.location.pathname.startsWith('/leads/')) {
    fetchLeadsData();
  }
  
  // Add proper error handling for data loading
  function handleDataFetchError(error, dataType) {
    console.error(\`Error loading \${dataType} data:\`, error);
    showNotification('Error', \`Failed to load \${dataType} data. Please try again.\`, 'error');
    // Display empty state with retry button
    const container = document.querySelector(\`.\${dataType}-container\`);
    if (container) {
      container.innerHTML = \`
        <div class="empty-state">
          <div class="empty-state-icon"><i class="fas fa-exclamation-circle"></i></div>
          <div class="empty-state-message">Unable to load \${dataType} data</div>
          <button class="btn btn-primary retry-btn" data-type="\${dataType}">Try Again</button>
        </div>
      \`;
      // Add retry event listener
      const retryBtn = container.querySelector('.retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', function() {
          if (this.dataset.type === 'dashboard') {
            fetchDashboardData();
          } else if (this.dataset.type === 'leads') {
            fetchLeadsData();
          }
        });
      }
    }
  }
`;

// Replace the old event listener with our updated one
dashboardHtml = dashboardHtml.replace(domContentLoadedPattern, immediateDataLoadingCode);

// Fix the displayDashboardData function to properly show the leads
const displayDataReplacer = `
function displayDashboardData(data) {
  console.log('Displaying dashboard data', data);
  
  // Simple display of basic metrics
  const statsContainer = document.querySelector('.dashboard-stats');
  if (statsContainer) {
    statsContainer.innerHTML = '';
    
    if (data && data.data) {
      const metrics = data.data;
      
      // Create stat cards
      const createStatCard = (label, value, icon) => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = \`
          <div class="stat-icon"><i class="fas fa-\${icon}"></i></div>
          <div class="stat-content">
            <div class="stat-value">\${value}</div>
            <div class="stat-label">\${label}</div>
          </div>
        \`;
        return card;
      };
      
      // Add metrics
      statsContainer.appendChild(createStatCard('Total Leads', metrics.totalCalls || 0, 'users'));
      statsContainer.appendChild(createStatCard('Active Calls', metrics.activeCalls || 0, 'phone'));
      statsContainer.appendChild(createStatCard('Conversion Rate', (metrics.conversionRate || 0) + '%', 'chart-line'));
    } else {
      statsContainer.innerHTML = '<div class="no-data">No dashboard data available</div>';
    }
  }
  
  // Display leads if available
  if (data && data.data && data.data.recentLeads) {
    displayLeads(data.data.recentLeads);
  }
}

function displayLeads(leads) {
  const leadsContainer = document.querySelector('.recent-leads-list');
  if (!leadsContainer) return;
  
  console.log('Displaying leads:', leads);
  
  if (!leads || leads.length === 0) {
    leadsContainer.innerHTML = '<div class="no-data">No leads available</div>';
    return;
  }
  
  // Clear existing content
  leadsContainer.innerHTML = '';
  
  // Create lead cards
  leads.forEach(lead => {
    const leadCard = document.createElement('div');
    leadCard.className = 'lead-card';
    leadCard.dataset.leadId = lead.id;
    
    // Add priority class
    if (lead.priority >= 4) {
      leadCard.classList.add('high-priority');
    } else if (lead.priority >= 2) {
      leadCard.classList.add('medium-priority');
    } else {
      leadCard.classList.add('low-priority');
    }
    
    leadCard.innerHTML = \`
      <div class="lead-company">\${lead.companyName || 'Unnamed Company'}</div>
      <div class="lead-contact">\${lead.contactName || 'No contact name'}</div>
      <div class="lead-phone">\${lead.phoneNumber || 'No phone number'}</div>
      <div class="lead-status">\${lead.status || 'new'}</div>
      <div class="lead-actions">
        <button class="btn btn-sm btn-call" data-lead-id="\${lead.id}">
          <i class="fas fa-phone"></i> Call
        </button>
        <button class="btn btn-sm btn-view" data-lead-id="\${lead.id}">
          <i class="fas fa-eye"></i> View
        </button>
      </div>
    \`;
    
    // Add event listeners for buttons
    const callBtn = leadCard.querySelector('.btn-call');
    if (callBtn) {
      callBtn.addEventListener('click', function() {
        window.location.href = \`/call-in-progress/\${lead.id}\`;
      });
    }
    
    const viewBtn = leadCard.querySelector('.btn-view');
    if (viewBtn) {
      viewBtn.addEventListener('click', function() {
        window.location.href = \`/leads/\${lead.id}\`;
      });
    }
    
    leadsContainer.appendChild(leadCard);
  });
}`;

// Replace or append the displayDashboardData function
if (dashboardHtml.includes('function displayDashboardData')) {
  // Replace the existing function
  const funcPattern = /function\s+displayDashboardData\s*\([^)]*\)\s*\{[^]*?\}\s*(?=function|<\/script>)/;
  dashboardHtml = dashboardHtml.replace(funcPattern, displayDataReplacer);
} else {
  // Append the function at the end of the script
  const scriptEndPos = dashboardHtml.lastIndexOf('</script>');
  if (scriptEndPos !== -1) {
    dashboardHtml = 
      dashboardHtml.substring(0, scriptEndPos) + 
      displayDataReplacer +
      dashboardHtml.substring(scriptEndPos);
  }
}

// Fix the original fetchDashboardData function to better handle the nested data structure
const fetchDataPattern = /function\s+fetchDashboardData\s*\(\)\s*\{[^]*?\}/;
const updatedFetchData = `
function fetchDashboardData() {
  console.log('Fetching dashboard data from analytics endpoint');
  
  fetch('/api/analytics/dashboard', {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    },
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log('Dashboard data loaded successfully:', data);
    // Process data safely
    displayDashboardData(data);
  })
  .catch(error => {
    console.error('Error loading dashboard data:', error);
    handleDataFetchError(error, 'dashboard');
  });
}`;

// Replace the existing fetchDashboardData function
dashboardHtml = dashboardHtml.replace(fetchDataPattern, updatedFetchData);

// Add CSS for lead cards and empty states
const styleEndPos = dashboardHtml.lastIndexOf('</style>');
if (styleEndPos !== -1) {
  const leadCardStyles = `
  /* Lead card styles */
  .lead-card {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 10px;
    background-color: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .lead-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  
  .lead-company {
    font-weight: bold;
    margin-bottom: 5px;
    font-size: 1.1em;
  }
  
  .lead-contact, .lead-phone {
    margin-bottom: 3px;
    color: #555;
  }
  
  .lead-status {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 0.85em;
    margin: 5px 0;
    background-color: #e0e0e0;
  }
  
  .lead-card.high-priority {
    border-left: 4px solid #f44336;
  }
  
  .lead-card.medium-priority {
    border-left: 4px solid #ff9800;
  }
  
  .lead-card.low-priority {
    border-left: 4px solid #4caf50;
  }
  
  .lead-actions {
    margin-top: 10px;
    display: flex;
    gap: 8px;
  }
  
  /* Empty state styling */
  .empty-state {
    text-align: center;
    padding: 30px;
    background-color: #f9f9f9;
    border-radius: 8px;
    margin: 20px 0;
  }
  
  .empty-state-icon {
    font-size: 2.5em;
    color: #ccc;
    margin-bottom: 10px;
  }
  
  .empty-state-message {
    color: #666;
    margin-bottom: 15px;
  }
  
  .retry-btn {
    padding: 8px 15px;
  }
  `;
  
  dashboardHtml = 
    dashboardHtml.substring(0, styleEndPos) + 
    leadCardStyles +
    dashboardHtml.substring(styleEndPos);
}

// Write the modified content back to the file
fs.writeFileSync(dashboardPath, dashboardHtml);
console.log('Fixed dashboard.html - Updated to load data immediately on page load');

// Now let's also make sure the leads API route is properly defined
const routesPath = path.join(__dirname, '../server/routes.js');

// Check if the routes file exists and add a leads endpoint if needed
if (fs.existsSync(routesPath)) {
  console.log('Checking routes.js for leads endpoint...');
  const routesContent = fs.readFileSync(routesPath, 'utf8');
  
  // If leads endpoint is missing, add it
  if (!routesContent.includes('/api/leads')) {
    console.log('Adding leads endpoint to routes.js');
    
    // Find a good insertion point
    const insertPoint = routesContent.indexOf('app.get(\'/api');
    
    if (insertPoint !== -1) {
      // Prepare the new route
      const leadsRoute = `
  // Leads API endpoint
  app.get('/api/leads', authenticateJWT, async (req, res) => {
    try {
      // Get user ID from JWT
      const userId = req.user.id;
      
      // Get all leads for the user
      const leads = await db.query.userLeads.findMany({
        where: eq(userLeads.userId, userId),
        with: {
          globalLead: true
        },
        orderBy: [desc(userLeads.createdAt)],
      });
      
      res.json({
        success: true,
        leads
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching leads',
        error: error.message
      });
    }
  });

`;
      
      // Insert the new route
      const updatedRoutesContent = 
        routesContent.substring(0, insertPoint) + 
        leadsRoute + 
        routesContent.substring(insertPoint);
      
      // Write the updated content back to the file
      fs.writeFileSync(routesPath, updatedRoutesContent);
      console.log('Added leads endpoint to routes.js');
    } else {
      console.log('Could not find a good insertion point in routes.js');
    }
  } else {
    console.log('The leads endpoint already exists in routes.js');
  }
} else {
  console.log('routes.js file not found');
}

console.log('Fix for lazy loading completed');