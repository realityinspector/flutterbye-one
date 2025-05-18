/**
 * Final JavaScript Syntax Fix
 * 
 * This script fixes the remaining JavaScript syntax error in the dashboard HTML
 * causing the "Unexpected token ','" error.
 */

const fs = require('fs');
const path = require('path');

// Path to the dashboard HTML file
const dashboardPath = path.join(__dirname, '../public/dashboard.html');

// Helper function to find syntax errors
function detectSyntaxError(code) {
  try {
    // Try to parse the JavaScript
    Function(code);
    return null;
  } catch (error) {
    return {
      message: error.message,
      // Extract line number if available
      line: error.lineNumber,
      // Try to get some context around the error
      context: error.message.match(/at line (\d+)/)?.[1]
    };
  }
}

// Read dashboard HTML
console.log('Reading dashboard.html...');
let dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');

// Extract all script blocks for testing
console.log('Extracting script blocks for testing...');
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/g;
let match;
let scriptBlocks = [];
let offsets = [];

while ((match = scriptRegex.exec(dashboardHtml)) !== null) {
  scriptBlocks.push(match[1]);
  offsets.push({
    start: match.index + match[0].indexOf(match[1]),
    end: match.index + match[0].indexOf(match[1]) + match[1].length
  });
}

// Test each script block for syntax errors
console.log('Testing script blocks for syntax errors...');
let blockWithError = -1;
let errorDetails = null;

for (let i = 0; i < scriptBlocks.length; i++) {
  const error = detectSyntaxError(scriptBlocks[i]);
  if (error) {
    console.log(`Found syntax error in script block #${i + 1}:`, error.message);
    blockWithError = i;
    errorDetails = error;
    break;
  }
}

if (blockWithError !== -1) {
  // Fix the problematic script block
  console.log(`Fixing script block #${blockWithError + 1}...`);
  
  // Get the problematic code
  const problematicCode = scriptBlocks[blockWithError];
  
  // Look for the specific issue: Unexpected token ',' in document.addEventListener function
  if (problematicCode.includes('document.addEventListener')) {
    console.log('Fixing DOMContentLoaded event listener...');
    
    // Create a fixed version of the block
    let fixedBlock = problematicCode;
    
    // Fix common syntax issues with the event listener
    // 1. Check for missing function body braces
    if (fixedBlock.includes('// Initialize user interface')) {
      fixedBlock = fixedBlock.replace(
        /document\.addEventListener\(['"]DOMContentLoaded['"]\s*,\s*function\s*\(\s*\)\s*\{[\s\n]*\/\/\s*Initialize\s*user\s*interface/,
        `document.addEventListener('DOMContentLoaded', function() {
  // Initialize user interface`
      );
    }
    
    // 2. Fix missing semicolons
    fixedBlock = fixedBlock.replace(/\)\n\s*fetchDashboardData\(\)/g, ');\n  fetchDashboardData()');
    fixedBlock = fixedBlock.replace(/\)\n\s*fetchLeadsData\(\)/g, ');\n  fetchLeadsData()');
    
    // 3. Fix function declarations and closing braces
    fixedBlock = fixedBlock.replace(/function handleDataFetchError\(error, dataType\) \{/g, 
      `  function handleDataFetchError(error, dataType) {`);
    
    // Make sure the event listener is closed properly
    if (!fixedBlock.match(/\}\s*\)\s*;?\s*$/)) {
      fixedBlock += '\n});';
    }
    
    // Replace the problematic block with the fixed version
    dashboardHtml = 
      dashboardHtml.substring(0, offsets[blockWithError].start) + 
      fixedBlock + 
      dashboardHtml.substring(offsets[blockWithError].end);
    
    console.log('Fixed event listener in script block');
  } else {
    console.log('Could not identify specific issue to fix automatically');
  }
}

// Final comprehensive fix: Look for any incomplete displayDashboardData function
console.log('Ensuring displayDashboardData function is complete...');

// Define a complete and fixed displayDashboardData function
const completeDisplayFunction = `
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
      statsContainer.appendChild(createStatCard('Total Calls', metrics.totalCalls || 0, 'phone-alt'));
      statsContainer.appendChild(createStatCard('Calls This Month', metrics.callsLastMonth || 0, 'calendar-alt'));
      statsContainer.appendChild(createStatCard('Unique Leads Called', metrics.uniqueLeadsCalled || 0, 'users'));
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

// Replace any problematic displayDashboardData functions with our complete version
const displayFunctionRegex = /function\s+displayDashboardData\s*\([^)]*\)\s*\{[^]*?(\}\s*function|\}<\/script>)/;
if (displayFunctionRegex.test(dashboardHtml)) {
  dashboardHtml = dashboardHtml.replace(displayFunctionRegex, completeDisplayFunction + (dashboardHtml.match(displayFunctionRegex)[1]));
  console.log('Updated displayDashboardData function');
}

// Write the fixed content back to the file
fs.writeFileSync(dashboardPath, dashboardHtml);
console.log('Fixed dashboard.html - updated script to resolve syntax error');

// Add a small helper script to the dashboard
console.log('Adding error handler helper script...');
const helperScript = `
<script>
  // Error handler helper
  window.addEventListener('error', function(event) {
    console.error('JavaScript error caught:', event.message);
    
    // Log details to help diagnose issues
    if (event.error && event.error.stack) {
      console.error('Error stack:', event.error.stack);
    }
    
    // Prevent the error from breaking the whole page
    event.preventDefault();
  });
  
  // Make sure all fetch operations have proper error handling
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    return originalFetch(...args)
      .catch(error => {
        console.error('Fetch error:', error.message);
        // Re-throw the error for the calling code to handle
        throw error;
      });
  };
</script>
`;

// Add the helper script at the end of the head section
const headEndPos = dashboardHtml.indexOf('</head>');
if (headEndPos !== -1) {
  dashboardHtml = 
    dashboardHtml.substring(0, headEndPos) + 
    helperScript + 
    dashboardHtml.substring(headEndPos);
  
  // Write the updated content back to the file
  fs.writeFileSync(dashboardPath, dashboardHtml);
  console.log('Added error handler helper script');
}

console.log('Final JavaScript fix completed');