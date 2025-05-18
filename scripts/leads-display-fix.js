/**
 * Leads Display Fix
 * 
 * This script adds a simple card-based layout for leads display
 * that loads directly rather than using lazy loading.
 */

const fs = require('fs');
const path = require('path');

// Path to the dashboard HTML file
const dashboardPath = path.join(__dirname, '../public/dashboard.html');

console.log('Reading dashboard.html...');
let dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');

// First, add the necessary styles for lead cards
console.log('Adding lead card styles...');

const leadCardStyles = `
/* Lead card styles */
.lead-card {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 12px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
}

.lead-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.lead-company {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 6px;
  color: #333;
}

.lead-contact, .lead-phone {
  font-size: 14px;
  margin-bottom: 4px;
  color: #666;
}

.lead-status {
  display: inline-block;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  background-color: #f0f0f0;
  color: #666;
  margin: 6px 0;
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
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.lead-actions .btn {
  font-size: 12px;
  padding: 4px 10px;
}

.dashboard-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  flex: 1;
  min-width: 200px;
  padding: 16px;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
}

.stat-icon {
  font-size: 24px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: #3f51b5;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.no-data {
  text-align: center;
  padding: 24px;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 4px;
  font-style: italic;
}

.recent-leads-container .section-title {
  margin-bottom: 16px;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 8px;
}
`;

// Insert the styles at the end of the style section
const styleInsertPoint = dashboardHtml.lastIndexOf('</style>');
if (styleInsertPoint !== -1) {
  dashboardHtml = 
    dashboardHtml.substring(0, styleInsertPoint) + 
    leadCardStyles +
    dashboardHtml.substring(styleInsertPoint);
}

// Now add a simple lead cards transform script
console.log('Adding lead cards transformation script...');

const leadCardsScript = `
<script>
// Simple lead cards script that runs immediately
(function() {
  console.log('Lead cards display enhancement loaded');
  
  // Add immediate execution to transform cards when page loads
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing lead cards');
    setTimeout(convertLeadsToCards, 100);
  });
  
  // Function to convert leads table to cards
  function convertLeadsToCards() {
    console.log('Converting leads to cards');
    
    // Clear existing content in the recent leads section
    const recentLeadsContainer = document.querySelector('.recent-leads-list');
    if (!recentLeadsContainer) {
      console.log('Recent leads container not found');
      return;
    }
    
    // First check if we already have API data
    if (window.dashboardData && window.dashboardData.data && window.dashboardData.data.recentLeads) {
      displayLeads(window.dashboardData.data.recentLeads);
      return;
    }
    
    // Otherwise, fetch data directly
    console.log('Fetching leads data directly');
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
      console.log('Lead data loaded successfully:', data);
      window.dashboardData = data;
      
      if (data && data.data && data.data.recentLeads) {
        displayLeads(data.data.recentLeads);
      } else {
        recentLeadsContainer.innerHTML = '<div class="no-data">No leads available</div>';
      }
    })
    .catch(error => {
      console.error('Error loading lead data:', error);
      recentLeadsContainer.innerHTML = '<div class="no-data">Error loading leads. Please refresh the page.</div>';
    });
  }
  
  // Display leads as cards
  function displayLeads(leads) {
    const leadsContainer = document.querySelector('.recent-leads-list');
    if (!leadsContainer) return;
    
    console.log('Displaying leads as cards:', leads);
    
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
          <button class="btn btn-sm btn-primary btn-call" data-lead-id="\${lead.id}">
            <i class="fas fa-phone"></i> Call
          </button>
          <button class="btn btn-sm btn-outline-secondary btn-view" data-lead-id="\${lead.id}">
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
  }
})();
</script>
`;

// Add the script right before the closing body tag
const scriptInsertPoint = dashboardHtml.lastIndexOf('</body>');
if (scriptInsertPoint !== -1) {
  dashboardHtml = 
    dashboardHtml.substring(0, scriptInsertPoint) + 
    leadCardsScript +
    dashboardHtml.substring(scriptInsertPoint);
}

// Ensure we have a placeholder for the recent leads
console.log('Ensuring recent leads structure exists...');
if (!dashboardHtml.includes('recent-leads-list')) {
  // Find a good spot to insert our container
  const containerInsertPoint = dashboardHtml.indexOf('<div class="dashboard-content">');
  
  if (containerInsertPoint !== -1) {
    const recentLeadsContainer = `
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
    
    // Find position right after dashboard-content div
    const contentStart = dashboardHtml.indexOf('>', containerInsertPoint) + 1;
    
    dashboardHtml = 
      dashboardHtml.substring(0, contentStart) + 
      recentLeadsContainer +
      dashboardHtml.substring(contentStart);
    
    console.log('Added recent leads container to dashboard');
  }
}

// Ensure our CSS has important meta tags in the head
if (!dashboardHtml.includes('viewport')) {
  const headInsertPoint = dashboardHtml.indexOf('</head>');
  if (headInsertPoint !== -1) {
    const metaTags = `
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    `;
    
    dashboardHtml = 
      dashboardHtml.substring(0, headInsertPoint) + 
      metaTags +
      dashboardHtml.substring(headInsertPoint);
    
    console.log('Added viewport meta tags');
  }
}

// Write the updated content back to the file
fs.writeFileSync(dashboardPath, dashboardHtml);
console.log('Fixed lead display in dashboard.html');