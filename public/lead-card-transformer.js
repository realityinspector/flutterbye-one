/**
 * FLUTTERBYE CRM - Lead Card Transformer
 * Transforms lead tables into card-based layout
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add the CSS link if not already present
  if (!document.querySelector('link[href="/lead-card-styles.css"]')) {
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = '/lead-card-styles.css';
    document.head.appendChild(cssLink);
  }
  
  // Transform tables on initial load with a slight delay
  setTimeout(transformLeadTables, 800);
  
  // Also transform when navigation happens
  document.addEventListener('click', function(event) {
    const navLink = event.target.closest('.nav-link');
    if (navLink) {
      setTimeout(transformLeadTables, 800);
    }
  });
});

/**
 * Find and transform lead tables to card layout
 */
function transformLeadTables() {
  console.log('Searching for lead tables to transform...');
  
  // Find all tables
  const tables = document.querySelectorAll('table');
  tables.forEach(function(table) {
    // Check if this looks like a leads table
    const headers = Array.from(table.querySelectorAll('thead th'))
      .map(th => th.textContent.trim().toLowerCase());
    
    // If it has company or contact headers, it's likely a leads table
    if (headers.includes('company') || headers.includes('contact') || 
        headers.includes('lead') || headers.includes('status')) {
      console.log('Found a leads table. Converting to cards...');
      
      // Create a container for cards
      const cardGrid = document.createElement('div');
      cardGrid.className = 'lead-grid';
      
      // Process each row
      const rows = table.querySelectorAll('tbody tr');
      console.log(`Found ${rows.length} leads to transform`);
      
      // Transform each row into a card
      rows.forEach(function(row) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 3) return;
        
        // Extract data from cells
        // Adjust indices based on your actual table structure if needed
        const companyName = cells[0]?.textContent.trim() || 'Unknown Company';
        const contactName = cells[1]?.textContent.trim() || 'Unknown Contact';
        const contactPhone = cells[2]?.textContent.trim() || 'No Phone';
        const status = cells[3]?.textContent.trim().toLowerCase() || 'new';
        
        // Get lead ID and other attributes
        const leadId = row.getAttribute('data-id') || row.id || generateLeadId();
        const isShared = row.classList.contains('shared-lead') || 
                         row.getAttribute('data-shared') === 'true';
        const orgName = row.getAttribute('data-org-name') || 'Team';
        const priority = getPriorityFromRow(row);
        
        // Create card element
        const card = createLeadCard(
          leadId, companyName, contactName, contactPhone, 
          status, priority, isShared, orgName
        );
        
        // Set up event listeners for the card actions
        setupCardActions(card, row, leadId, companyName, contactName, contactPhone);
        
        // Add card to grid
        cardGrid.appendChild(card);
      });
      
      // Only replace if we created cards
      if (cardGrid.children.length > 0) {
        // Get table container or parent
        const tableContainer = table.closest('.table-container') || table.parentNode;
        
        // Hide the original table but keep it in DOM for future reference
        table.style.display = 'none';
        
        // Add card grid after table
        tableContainer.parentNode.insertBefore(cardGrid, tableContainer.nextSibling);
        console.log(`Successfully transformed ${cardGrid.children.length} leads to cards`);
      }
    }
  });
}

/**
 * Create a lead card element
 */
function createLeadCard(leadId, companyName, contactName, contactPhone, status, priority, isShared, orgName) {
  // Create card element
  const card = document.createElement('div');
  card.className = 'lead-card';
  card.setAttribute('data-id', leadId);
  
  // Determine status class
  let statusClass = 'status-new';
  if (status.includes('contact')) statusClass = 'status-contacted';
  if (status.includes('qualif') && !status.includes('unqualif')) statusClass = 'status-qualified';
  if (status.includes('unqualif')) statusClass = 'status-unqualified';
  
  // Determine priority class
  let priorityClass = 'priority-medium';
  if (priority === 'high') priorityClass = 'priority-high';
  if (priority === 'low') priorityClass = 'priority-low';
  
  // Create card HTML
  card.innerHTML = `
    <div class="card-header">
      <div class="status-container">
        <span class="status-pill ${statusClass}">${status || 'New'}</span>
        <span class="priority-badge ${priorityClass}">${priority}</span>
        ${isShared ? `<div class="org-pill"><i class="fas fa-building"></i> ${orgName}</div>` : ''}
      </div>
      <div class="card-actions">
        <button class="card-btn view-btn" title="View Details"><i class="fas fa-eye"></i></button>
        <button class="card-btn call-btn" title="Call Lead"><i class="fas fa-phone"></i></button>
        <button class="card-btn edit-btn" title="Edit Lead"><i class="fas fa-edit"></i></button>
        <button class="card-btn delete-btn" title="Delete Lead"><i class="fas fa-trash"></i></button>
      </div>
    </div>
    <div class="card-body">
      <h3 class="company-name">${companyName}</h3>
      <div class="contact-info">
        <div class="contact-row">
          <i class="fas fa-user"></i>
          <span>${contactName}</span>
        </div>
        <div class="contact-row">
          <i class="fas fa-phone"></i>
          <span>${contactPhone}</span>
        </div>
      </div>
    </div>
  `;
  
  return card;
}

/**
 * Set up action buttons on the card
 */
function setupCardActions(card, originalRow, leadId, companyName, contactName, contactPhone) {
  // Call button
  const callBtn = card.querySelector('.call-btn');
  if (callBtn) {
    callBtn.addEventListener('click', function() {
      // Use call tracking system if available
      if (typeof window.startCall === 'function') {
        window.startCall(leadId, contactName, companyName, contactPhone);
      } else {
        // Find and click original call button
        const originalCallBtn = originalRow.querySelector('.btn-call, [data-action="call"]');
        if (originalCallBtn) {
          originalCallBtn.click();
        } else {
          console.log('Call:', contactName, contactPhone);
        }
      }
    });
  }
  
  // View button
  setupActionButton(card, '.view-btn', originalRow, '.btn-view, [data-action="view"]');
  
  // Edit button
  setupActionButton(card, '.edit-btn', originalRow, '.btn-edit, [data-action="edit"]');
  
  // Delete button
  setupActionButton(card, '.delete-btn', originalRow, '.btn-delete, [data-action="delete"]');
}

/**
 * Helper to set up an action button
 */
function setupActionButton(card, cardButtonSelector, originalRow, originalButtonSelector) {
  const cardButton = card.querySelector(cardButtonSelector);
  if (cardButton) {
    cardButton.addEventListener('click', function() {
      const originalButton = originalRow.querySelector(originalButtonSelector);
      if (originalButton) {
        originalButton.click();
      } else {
        console.log('Action:', cardButtonSelector);
      }
    });
  }
}

/**
 * Get priority from row attributes or classes
 */
function getPriorityFromRow(row) {
  if (row.classList.contains('priority-high') || row.getAttribute('data-priority') === 'high') {
    return 'high';
  } else if (row.classList.contains('priority-low') || row.getAttribute('data-priority') === 'low') {
    return 'low';
  } else {
    return 'medium';
  }
}

/**
 * Generate a unique lead ID if none exists
 */
function generateLeadId() {
  return 'lead-' + Math.random().toString(36).substring(2, 9);
}