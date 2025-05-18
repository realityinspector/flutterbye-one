/**
 * FLUTTERBYE CRM - Unified Lead Card Implementation
 * This single file handles displaying leads as cards across the application
 */

document.addEventListener('DOMContentLoaded', function() {
  // Make sure our CSS is loaded
  if (!document.querySelector('link[href="/css/lead-card.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/lead-card.css';
    document.head.appendChild(link);
  }

  // Find and transform any lead tables or containers on the page
  initializeLeadCards();

  // Listen for dynamic page changes that might add new lead containers
  // This helps with single-page application navigation
  observePageChanges();
});

/**
 * Initialize lead cards on the page
 */
function initializeLeadCards() {
  // Check if we're on the dashboard page
  const isDashboard = window.location.pathname === '/dashboard' || window.location.pathname === '/';
  
  // Check if we're on the leads page
  const isLeadsPage = window.location.pathname === '/leads';
  
  // Find any container with the .leads-container class
  const containers = document.querySelectorAll('.leads-container');
  
  if (containers.length > 0) {
    containers.forEach(container => {
      // Check if this container should show a limited number of leads (for dashboard)
      const limit = isDashboard ? 5 : null;
      loadLeadsIntoContainer(container, limit);
    });
  } else {
    // If no containers found, look for any legacy lead tables
    const leadTables = document.querySelectorAll('.leads-table, #leadsTable, table.leads');
    
    if (leadTables.length > 0) {
      console.log('Found legacy lead tables. Converting to card layout.');
      convertLegacyTablesToCards(leadTables);
    } else if (isDashboard || isLeadsPage) {
      // Create a leads container if we're on relevant pages but no container exists
      createLeadsContainer();
    }
  }
}

/**
 * Load leads data into a container
 * @param {HTMLElement} container - The container element
 * @param {number|null} limit - Optional limit on number of leads to display
 */
function loadLeadsIntoContainer(container, limit = null) {
  // Set a loading state
  container.innerHTML = '<div class="loading">Loading leads...</div>';
  
  // Determine which API endpoint to use
  let apiEndpoint = '/api/leads';
  
  // Make the API request
  fetch(apiEndpoint)
    .then(response => response.json())
    .then(data => {
      if (data.success && data.data && data.data.length > 0) {
        let leads = data.data;
        
        // Apply limit if specified (for dashboard)
        if (limit && leads.length > limit) {
          leads = leads.slice(0, limit);
        }
        
        // Clear the container
        container.innerHTML = '';
        
        // Create lead cards
        leads.forEach(lead => {
          const card = createLeadCard(lead);
          container.appendChild(card);
        });
      } else {
        // Show no data message
        container.innerHTML = '<div class="no-data">No leads available</div>';
      }
    })
    .catch(error => {
      console.error('Error loading leads:', error);
      container.innerHTML = '<div class="no-data">Error loading leads. Please refresh the page.</div>';
    });
}

/**
 * Create a lead card element
 * @param {Object} lead - The lead data object
 * @returns {HTMLElement} - The lead card element
 */
function createLeadCard(lead) {
  const card = document.createElement('div');
  card.className = 'lead-card';
  card.dataset.leadId = lead.id;
  
  // Add priority class if available
  if (lead.priority) {
    if (lead.priority >= 4) {
      card.classList.add('high-priority');
    } else if (lead.priority >= 2) {
      card.classList.add('medium-priority');
    } else {
      card.classList.add('low-priority');
    }
  }
  
  // Simplified card content - just the company name for now
  card.innerHTML = `
    <div class="lead-company">${lead.companyName || 'Unnamed Company'}</div>
  `;
  
  return card;
}

/**
 * Create a leads container if one doesn't exist
 */
function createLeadsContainer() {
  // Find a suitable location to add our container
  const mainContent = document.querySelector('.main-content, main, #content, .content');
  
  if (mainContent) {
    // Check if we're on the dashboard
    const isDashboard = window.location.pathname === '/dashboard' || window.location.pathname === '/';
    
    // Create container with appropriate heading
    const containerWrapper = document.createElement('div');
    containerWrapper.className = 'leads-section';
    
    containerWrapper.innerHTML = `
      <h2>${isDashboard ? 'Recent Leads' : 'All Leads'}</h2>
      <div class="leads-container"></div>
    `;
    
    mainContent.appendChild(containerWrapper);
    
    // Initialize the leads in this new container
    const container = containerWrapper.querySelector('.leads-container');
    loadLeadsIntoContainer(container, isDashboard ? 5 : null);
  }
}

/**
 * Convert legacy lead tables to card layout
 * @param {NodeList} tables - Collection of lead tables to convert
 */
function convertLegacyTablesToCards(tables) {
  tables.forEach(table => {
    // Create a container to replace the table
    const container = document.createElement('div');
    container.className = 'leads-container';
    
    // Insert the container after the table
    table.parentNode.insertBefore(container, table.nextSibling);
    
    // Extract leads data from the table
    const leads = extractLeadsFromTable(table);
    
    // Create lead cards
    if (leads.length > 0) {
      leads.forEach(lead => {
        const card = createLeadCard(lead);
        container.appendChild(card);
      });
      
      // Hide the original table
      table.style.display = 'none';
    }
  });
}

/**
 * Extract leads data from a table
 * @param {HTMLElement} table - The table element
 * @returns {Array} - Array of lead objects
 */
function extractLeadsFromTable(table) {
  const leads = [];
  const rows = table.querySelectorAll('tbody tr');
  
  rows.forEach((row, index) => {
    // Create a minimal lead object with just the company name
    // This simplified version just gets text from the first cell
    const cells = row.querySelectorAll('td');
    if (cells.length > 0) {
      leads.push({
        id: row.dataset.id || `lead-${index}`,
        companyName: cells[0].textContent.trim()
      });
    }
  });
  
  return leads;
}

/**
 * Observe page changes to reinitialize lead cards when needed
 * This helps with single-page applications
 */
function observePageChanges() {
  // Create a mutation observer to watch for DOM changes
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if any leads containers were added
        setTimeout(() => {
          const newContainers = document.querySelectorAll('.leads-container:empty');
          newContainers.forEach(container => {
            loadLeadsIntoContainer(container);
          });
        }, 100);
      }
    });
  });
  
  // Start observing the entire document
  observer.observe(document.body, { childList: true, subtree: true });
}