// Basic Lead Cards Implementation

document.addEventListener('DOMContentLoaded', function() {
  console.log("Basic cards script loaded");
  
  // Add basic styles
  var style = document.createElement('style');
  style.textContent = `
    .lead-cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    
    .lead-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .lead-card-header {
      padding: 12px;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #eee;
    }
    
    .status-container {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .lead-status {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      color: white;
    }
    
    .status-new { background-color: #17a2b8; }
    .status-contacted { background-color: #0066ff; }
    .status-qualified { background-color: #28a745; }
    .status-unqualified { background-color: #dc3545; }
    
    .priority-tag {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
    }
    
    .priority-high { background-color: #ffc107; color: #333; }
    .priority-medium { background-color: #17a2b8; color: white; }
    .priority-low { background-color: #6c757d; color: white; }
    
    .org-tag {
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      background: linear-gradient(90deg, #7a5cf1, #9b75f0);
      color: white;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .card-actions {
      display: flex;
      gap: 6px;
    }
    
    .action-button {
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
    
    .action-button:hover {
      background-color: rgba(0,0,0,0.05);
    }
    
    .view-btn:hover { color: #0066ff; }
    .call-btn:hover { color: #28a745; }
    .edit-btn:hover { color: #ffc107; }
    .delete-btn:hover { color: #dc3545; }
    
    .lead-card-body {
      padding: 15px;
    }
    
    .company-title {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
    
    .contact-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .contact-row {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #555;
      font-size: 14px;
    }
    
    .contact-row i {
      color: #777;
      width: 16px;
    }
  `;
  document.head.appendChild(style);
  
  // Transform leads tables with a delay to ensure page is loaded
  setTimeout(findAndTransformLeadsTables, 1000);
});

// Find and transform leads tables
function findAndTransformLeadsTables() {
  // Find all tables
  var tables = document.querySelectorAll('table');
  console.log("Found " + tables.length + " tables");
  
  // Check each table to see if it contains leads
  tables.forEach(function(table) {
    // Get table headers
    var headers = [];
    var headerRow = table.querySelector('thead tr');
    if (headerRow) {
      var headerCells = headerRow.querySelectorAll('th');
      headerCells.forEach(function(cell) {
        headers.push(cell.textContent.trim().toLowerCase());
      });
    }
    
    // Check if this looks like a leads table
    if (headers.includes('company') || headers.includes('contact') || 
        headers.includes('status') || headers.includes('lead')) {
      
      console.log("Found a leads table - transforming to cards");
      
      // Create container for cards
      var cardsContainer = document.createElement('div');
      cardsContainer.className = 'lead-cards-container';
      
      // Process each row
      var rows = table.querySelectorAll('tbody tr');
      rows.forEach(function(row, index) {
        var cells = row.querySelectorAll('td');
        if (cells.length < 3) return; // Skip if not enough data
        
        // Extract data from cells
        var companyName = cells[0]?.textContent.trim() || 'Unknown Company';
        var contactName = cells[1]?.textContent.trim() || 'Unknown Contact';
        var contactPhone = cells[2]?.textContent.trim() || 'No Phone';
        var status = cells[3]?.textContent.trim().toLowerCase() || 'new';
        
        // Determine status class
        var statusClass = 'status-new';
        if (status.includes('contact')) statusClass = 'status-contacted';
        if (status.includes('qualif') && !status.includes('unqualif')) statusClass = 'status-qualified';
        if (status.includes('unqualif')) statusClass = 'status-unqualified';
        
        // Create card
        var card = document.createElement('div');
        card.className = 'lead-card';
        
        // Set card HTML
        card.innerHTML = `
          <div class="lead-card-header">
            <div class="status-container">
              <span class="lead-status ${statusClass}">${status}</span>
              <span class="priority-tag priority-medium">Medium</span>
              <span class="org-tag"><i class="fas fa-building"></i> Team</span>
            </div>
            <div class="card-actions">
              <button class="action-button view-btn"><i class="fas fa-eye"></i></button>
              <button class="action-button call-btn"><i class="fas fa-phone"></i></button>
              <button class="action-button edit-btn"><i class="fas fa-edit"></i></button>
              <button class="action-button delete-btn"><i class="fas fa-trash"></i></button>
            </div>
          </div>
          <div class="lead-card-body">
            <h3 class="company-title">${companyName}</h3>
            <div class="contact-details">
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
        
        // Add card to container
        cardsContainer.appendChild(card);
        
        // Add event listeners
        setupCardButtons(card, row, companyName, contactName, contactPhone);
      });
      
      // Add card container after table
      if (cardsContainer.children.length > 0) {
        var tableParent = table.parentNode;
        table.style.display = 'none'; // Hide original table
        tableParent.insertBefore(cardsContainer, table.nextSibling);
        console.log("Added " + cardsContainer.children.length + " cards");
      }
    }
  });
}

// Set up action buttons
function setupCardButtons(card, originalRow, companyName, contactName, contactPhone) {
  // Call button
  var callBtn = card.querySelector('.call-btn');
  if (callBtn) {
    callBtn.addEventListener('click', function() {
      var leadId = originalRow.getAttribute('data-id') || originalRow.id;
      
      // Use call tracking if available
      if (typeof window.startCall === 'function') {
        window.startCall(leadId, contactName, companyName, contactPhone);
      } else {
        // Try original call button
        var originalCallBtn = originalRow.querySelector('.btn-call');
        if (originalCallBtn) {
          originalCallBtn.click();
        } else {
          console.log("Call " + contactName + " at " + contactPhone);
          alert("Calling " + contactName + " at " + contactPhone);
        }
      }
    });
  }
  
  // Other buttons
  setupActionButton(card, '.view-btn', originalRow, '.btn-view');
  setupActionButton(card, '.edit-btn', originalRow, '.btn-edit');
  setupActionButton(card, '.delete-btn', originalRow, '.btn-delete');
}

// Helper for button setup
function setupActionButton(card, cardBtnSelector, originalRow, originalBtnSelector) {
  var cardBtn = card.querySelector(cardBtnSelector);
  if (cardBtn) {
    cardBtn.addEventListener('click', function() {
      var originalBtn = originalRow.querySelector(originalBtnSelector);
      if (originalBtn) {
        originalBtn.click();
      } else {
        console.log("Action: " + cardBtnSelector);
      }
    });
  }
}