/**
 * FLUTTERBYE CRM - Lead Card Transform
 * Transforms the leads table into a card-based layout
 */

document.addEventListener('DOMContentLoaded', function() {
  // Add card styles
  addCardStyles();
  
  // Run transformation after a short delay to ensure the page is loaded
  setTimeout(transformLeadsToCards, 1000);
  
  // Listen for navigation events to retransform when needed
  document.addEventListener('click', function(e) {
    if (e.target.matches('.nav-link') || e.target.closest('.nav-link')) {
      setTimeout(transformLeadsToCards, 500);
    }
  });
});

// Add styles for the card layout
function addCardStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Lead Cards Container */
    .lead-cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 16px;
      width: 100%;
    }
    
    /* Lead Card */
    .lead-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .lead-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    /* Card Header with Status */
    .lead-header {
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #eee;
    }
    
    .lead-status-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    
    /* Status Pills */
    .status-pill {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .status-new {
      background-color: #17a2b8;
      color: white;
    }
    
    .status-contacted {
      background-color: #0066ff;
      color: white;
    }
    
    .status-qualified {
      background-color: #28a745;
      color: white;
    }
    
    .status-unqualified {
      background-color: #dc3545;
      color: white;
    }
    
    /* Priority Badges */
    .priority-badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
    }
    
    .priority-high {
      background-color: #ffc107;
      color: #333;
    }
    
    .priority-medium {
      background-color: #17a2b8;
      color: white;
    }
    
    .priority-low {
      background-color: #999;
      color: white;
    }
    
    /* Organization Pill */
    .org-pill {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      background: linear-gradient(90deg, #7a5cf1, #9b75f0);
      color: white;
    }
    
    /* Card Actions */
    .lead-actions {
      display: flex;
      gap: 6px;
    }
    
    .action-btn {
      background: none;
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #555;
      transition: background-color 0.2s, color 0.2s;
    }
    
    .action-btn:hover {
      background-color: rgba(0,0,0,0.05);
    }
    
    .view-btn:hover {
      color: #0066ff;
    }
    
    .call-btn:hover {
      color: #28a745;
    }
    
    .edit-btn:hover {
      color: #ffc107;
    }
    
    .delete-btn:hover {
      color: #dc3545;
    }
    
    /* Card Body */
    .lead-body {
      padding: 16px;
    }
    
    .company-name {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
    
    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .contact-name, .contact-phone {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #555;
      font-size: 14px;
    }
    
    .contact-name i, .contact-phone i {
      color: #777;
      width: 16px;
    }
  `;
  document.head.appendChild(style);
}

// Transform the leads table into a card layout
function transformLeadsToCards() {
  // Find all tables in the document
  const tables = document.querySelectorAll('table');
  
  // Process each table that appears to contain leads
  tables.forEach(table => {
    // Check if this table is likely a leads table
    const headerCells = table.querySelectorAll('thead th');
    const headerTexts = Array.from(headerCells).map(cell => cell.textContent.trim().toLowerCase());
    
    // If this table has headers that match what we'd expect for leads, transform it
    if (headerTexts.includes('company') || 
        headerTexts.includes('contact') || 
        headerTexts.includes('status') ||
        headerTexts.includes('actions')) {
      
      // Create container for cards
      const cardContainer = document.createElement('div');
      cardContainer.className = 'lead-cards-container';
      
      // Get table rows (skip header)
      const rows = table.querySelectorAll('tbody tr');
      
      // Skip if no rows
      if (rows.length === 0) return;
      
      // Process each row into a card
      rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 3) return; // Skip rows without enough data
        
        // Get data from row
        const leadId = row.getAttribute('data-id') || row.getAttribute('data-lead-id') || `lead-${index}`;
        
        // Extract cell data assuming common column order
        // Customize these indices based on the actual table structure
        const companyCell = findCellByHeaderText(headerTexts, cells, ['company', 'company name']);
        const contactCell = findCellByHeaderText(headerTexts, cells, ['contact', 'name']);
        const phoneCell = findCellByHeaderText(headerTexts, cells, ['phone', 'contact phone']);
        const statusCell = findCellByHeaderText(headerTexts, cells, ['status']);
        const actionsCell = findCellByHeaderText(headerTexts, cells, ['actions', 'action']);
        
        const companyName = companyCell ? companyCell.textContent.trim() : 'Unknown Company';
        const contactName = contactCell ? contactCell.textContent.trim() : 'Unknown Contact';
        const contactPhone = phoneCell ? phoneCell.textContent.trim() : 'No Phone';
        const statusText = statusCell ? statusCell.textContent.trim().toLowerCase() : 'new';
        
        // Determine if lead is shared (look for organization info)
        const isShared = row.getAttribute('data-shared') === 'true' || 
                        row.classList.contains('shared-lead') ||
                        row.innerHTML.includes('fa-building');
        const orgName = row.getAttribute('data-org-name') || row.getAttribute('data-organization') || 'Team';
        
        // Determine priority (look for priority info or infer from styling)
        let priority = 'medium';
        if (row.classList.contains('priority-high') || row.getAttribute('data-priority') === 'high') {
          priority = 'high';
        } else if (row.classList.contains('priority-low') || row.getAttribute('data-priority') === 'low') {
          priority = 'low';
        }
        
        // Create the card
        const card = createLeadCard(
          leadId, 
          companyName, 
          contactName, 
          contactPhone, 
          statusText, 
          priority, 
          isShared, 
          orgName
        );
        
        // Set up action handlers that will trigger original buttons
        setupCardActions(card, actionsCell, leadId, contactName, companyName, contactPhone);
        
        // Add the card to the container
        cardContainer.appendChild(card);
      });
      
      // Replace the table with our card container
      const tableContainer = table.closest('.table-container') || table.parentNode;
      
      // Save original table for potential toggling
      const originalTable = table.cloneNode(true);
      originalTable.style.display = 'none';
      originalTable.id = 'original-table';
      
      // Insert card container before hiding the table
      tableContainer.appendChild(cardContainer);
      
      // Hide the original table
      table.style.display = 'none';
    }
  });
}

// Helper to find a cell based on its corresponding header text
function findCellByHeaderText(headerTexts, cells, possibleHeaders) {
  for (const header of possibleHeaders) {
    const index = headerTexts.findIndex(h => h.includes(header));
    if (index !== -1 && cells[index]) {
      return cells[index];
    }
  }
  return null;
}

// Create a lead card element
function createLeadCard(leadId, companyName, contactName, contactPhone, statusText, priority, isShared, orgName) {
  const card = document.createElement('div');
  card.className = 'lead-card';
  card.setAttribute('data-id', leadId);
  
  // Determine status class
  let statusClass = 'status-new';
  if (statusText.includes('contacted')) statusClass = 'status-contacted';
  if (statusText.includes('qualified')) statusClass = 'status-qualified';
  if (statusText.includes('unqualified')) statusClass = 'status-unqualified';
  
  // Determine priority class
  let priorityClass = 'priority-medium';
  if (priority === 'high') priorityClass = 'priority-high';
  if (priority === 'low') priorityClass = 'priority-low';
  
  // Create card HTML
  card.innerHTML = `
    <div class="lead-header">
      <div class="lead-status-container">
        <span class="status-pill ${statusClass}">${statusText || 'New'}</span>
        <span class="priority-badge ${priorityClass}">${priority}</span>
        ${isShared ? `<div class="org-pill"><i class="fas fa-building"></i> ${orgName}</div>` : ''}
      </div>
      <div class="lead-actions">
        <button class="action-btn view-btn" title="View Details"><i class="fas fa-eye"></i></button>
        <button class="action-btn call-btn" title="Call Lead"><i class="fas fa-phone"></i></button>
        <button class="action-btn edit-btn" title="Edit Lead"><i class="fas fa-edit"></i></button>
        <button class="action-btn delete-btn" title="Delete Lead"><i class="fas fa-trash"></i></button>
      </div>
    </div>
    <div class="lead-body">
      <h3 class="company-name">${companyName}</h3>
      <div class="contact-info">
        <div class="contact-name">
          <i class="fas fa-user"></i>
          <span>${contactName}</span>
        </div>
        <div class="contact-phone">
          <i class="fas fa-phone"></i>
          <span>${contactPhone}</span>
        </div>
      </div>
    </div>
  `;
  
  return card;
}

// Set up action handlers for the card buttons
function setupCardActions(card, actionsCell, leadId, contactName, companyName, contactPhone) {
  // View button
  card.querySelector('.view-btn')?.addEventListener('click', () => {
    if (actionsCell) {
      const viewBtn = actionsCell.querySelector('.btn-view, .view-btn, [data-action="view"], .fa-eye');
      if (viewBtn) {
        // Click the original button
        viewBtn.click();
        return;
      }
    }
    
    // Fallback behavior if no original button found
    console.log(`View lead ${leadId}`);
    window.location.href = `/leads/${leadId}`;
  });
  
  // Call button
  card.querySelector('.call-btn')?.addEventListener('click', () => {
    // Check if we have our call tracking system available
    if (typeof window.startCall === 'function') {
      window.startCall(leadId, contactName, companyName, contactPhone);
      return;
    }
    
    // Otherwise try to find and click original button
    if (actionsCell) {
      const callBtn = actionsCell.querySelector('.btn-call, .call-btn, [data-action="call"], .fa-phone');
      if (callBtn) {
        callBtn.click();
        return;
      }
    }
    
    // Fallback behavior
    console.log(`Call lead ${leadId}`);
    alert(`Calling ${contactName} at ${contactPhone}`);
  });
  
  // Edit button
  card.querySelector('.edit-btn')?.addEventListener('click', () => {
    if (actionsCell) {
      const editBtn = actionsCell.querySelector('.btn-edit, .edit-btn, [data-action="edit"], .fa-edit');
      if (editBtn) {
        editBtn.click();
        return;
      }
    }
    
    // Fallback behavior
    console.log(`Edit lead ${leadId}`);
    window.location.href = `/leads/${leadId}/edit`;
  });
  
  // Delete button
  card.querySelector('.delete-btn')?.addEventListener('click', () => {
    if (actionsCell) {
      const deleteBtn = actionsCell.querySelector('.btn-delete, .delete-btn, [data-action="delete"], .fa-trash');
      if (deleteBtn) {
        deleteBtn.click();
        return;
      }
    }
    
    // Fallback behavior
    console.log(`Delete lead ${leadId}`);
    if (confirm(`Are you sure you want to delete ${companyName}?`)) {
      fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      }).then(response => {
        if (response.ok) {
          card.remove();
        } else {
          alert('Failed to delete lead');
        }
      });
    }
  });
}