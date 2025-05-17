/**
 * FLUTTERBYE CRM - Simple Lead Cards
 * A minimal approach to transform leads table into cards
 */

// Add styles for card-based layout when the document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Add card styles
  addCardStyles();
  
  // Transform leads table after the page loads
  setTimeout(transformLeadsTable, 1000);
});

// Add CSS styles for cards
function addCardStyles() {
  const styles = document.createElement('style');
  styles.textContent = `
    .lead-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 15px;
      overflow: hidden;
      transition: transform 0.2s;
    }
    
    .lead-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .lead-header {
      display: flex;
      justify-content: space-between;
      padding: 12px 15px;
      border-bottom: 1px solid #eee;
    }
    
    .lead-status {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    
    .status-pill {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      color: white;
    }
    
    .status-new {
      background-color: #17a2b8;
    }
    
    .status-contacted {
      background-color: #0066ff;
    }
    
    .status-qualified {
      background-color: #28a745;
    }
    
    .status-unqualified {
      background-color: #dc3545;
    }
    
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
    
    .lead-body {
      padding: 15px;
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
    
    .lead-cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
  `;
  document.head.appendChild(styles);
}

// Transform the leads table into cards
function transformLeadsTable() {
  // Find tables that might contain leads
  const tables = document.querySelectorAll('table');
  
  tables.forEach(table => {
    // Check if this is a leads table
    const headers = Array.from(table.querySelectorAll('thead th'))
                    .map(th => th.textContent.trim().toLowerCase());
    
    if (headers.includes('company') || 
        headers.includes('status') || 
        headers.includes('lead') || 
        headers.includes('contact')) {
      
      console.log('Found leads table, converting to cards');
      
      // Create container for cards
      const cardsContainer = document.createElement('div');
      cardsContainer.className = 'lead-cards-container';
      
      // Get all lead rows
      const rows = table.querySelectorAll('tbody tr');
      
      // Process each row into a card
      rows.forEach((row, index) => {
        // Get cells from row
        const cells = row.querySelectorAll('td');
        if (cells.length < 3) return; // Skip if not enough data
        
        // Get lead ID
        const leadId = row.getAttribute('data-id') || row.getAttribute('data-lead-id') || `lead-${index}`;
        
        // Get company name, contact name, and status from cells
        // This depends on your table structure, adjust indices as needed
        const companyName = cells[0]?.textContent?.trim() || 'Unknown Company';
        const contactName = cells[1]?.textContent?.trim() || 'Unknown Contact';
        const contactPhone = cells[2]?.textContent?.trim() || 'N/A';
        const status = cells[3]?.textContent?.trim()?.toLowerCase() || 'new';
        
        // Create a card for this lead
        const card = document.createElement('div');
        card.className = 'lead-card';
        card.setAttribute('data-id', leadId);
        
        // Determine status class
        let statusClass = 'status-new';
        if (status.includes('contact')) statusClass = 'status-contacted';
        if (status.includes('qualif') && !status.includes('unqualif')) statusClass = 'status-qualified';
        if (status.includes('unqualif')) statusClass = 'status-unqualified';
        
        // Determine if shared with organization
        const isShared = row.classList.contains('shared-lead') || row.getAttribute('data-shared') === 'true';
        const orgName = row.getAttribute('data-org-name') || 'Team';
        
        // Determine priority
        let priority = 'medium';
        let priorityClass = 'priority-medium';
        if (row.classList.contains('priority-high') || row.getAttribute('data-priority') === 'high') {
          priority = 'high';
          priorityClass = 'priority-high';
        } else if (row.classList.contains('priority-low') || row.getAttribute('data-priority') === 'low') {
          priority = 'low';
          priorityClass = 'priority-low';
        }
        
        // Set card HTML
        card.innerHTML = `
          <div class="lead-header">
            <div class="lead-status">
              <span class="status-pill ${statusClass}">${status}</span>
              <span class="priority-badge ${priorityClass}">${priority}</span>
              ${isShared ? `<div class="org-pill"><i class="fas fa-building"></i> ${orgName}</div>` : ''}
            </div>
            <div class="lead-actions">
              <button class="action-btn view-btn"><i class="fas fa-eye"></i></button>
              <button class="action-btn call-btn"><i class="fas fa-phone"></i></button>
              <button class="action-btn edit-btn"><i class="fas fa-edit"></i></button>
              <button class="action-btn delete-btn"><i class="fas fa-trash"></i></button>
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
        
        // Add event listeners for buttons
        addCardEventListeners(card, row, leadId, companyName, contactName, contactPhone);
        
        // Add card to container
        cardsContainer.appendChild(card);
      });
      
      // Insert cards container after table
      if (cardsContainer.children.length > 0) {
        const tableParent = table.parentNode;
        // Hide the original table
        table.style.display = 'none';
        // Add cards after table
        tableParent.insertBefore(cardsContainer, table.nextSibling);
      }
    }
  });
}

// Add event listeners to card buttons
function addCardEventListeners(card, originalRow, leadId, companyName, contactName, contactPhone) {
  // View button
  const viewBtn = card.querySelector('.view-btn');
  if (viewBtn) {
    viewBtn.addEventListener('click', function() {
      // Try to find and click the original view button
      const originalBtn = originalRow.querySelector('button.btn-view, button.view-btn, button[data-action="view"]');
      if (originalBtn) {
        originalBtn.click();
      } else {
        // Fallback behavior
        console.log('View lead:', leadId);
      }
    });
  }
  
  // Call button
  const callBtn = card.querySelector('.call-btn');
  if (callBtn) {
    callBtn.addEventListener('click', function() {
      // Use call tracking if available
      if (typeof window.startCall === 'function') {
        window.startCall(leadId, contactName, companyName, contactPhone);
      } else {
        // Try to find and click the original call button
        const originalBtn = originalRow.querySelector('button.btn-call, button.call-btn, button[data-action="call"]');
        if (originalBtn) {
          originalBtn.click();
        } else {
          // Fallback behavior
          console.log('Call lead:', leadId, contactPhone);
        }
      }
    });
  }
  
  // Edit button
  const editBtn = card.querySelector('.edit-btn');
  if (editBtn) {
    editBtn.addEventListener('click', function() {
      // Try to find and click the original edit button
      const originalBtn = originalRow.querySelector('button.btn-edit, button.edit-btn, button[data-action="edit"]');
      if (originalBtn) {
        originalBtn.click();
      } else {
        // Fallback behavior
        console.log('Edit lead:', leadId);
      }
    });
  }
  
  // Delete button
  const deleteBtn = card.querySelector('.delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', function() {
      // Try to find and click the original delete button
      const originalBtn = originalRow.querySelector('button.btn-delete, button.delete-btn, button[data-action="delete"]');
      if (originalBtn) {
        originalBtn.click();
      } else {
        // Fallback behavior
        console.log('Delete lead:', leadId);
      }
    });
  }
}