// Lead Transform - Simple card conversion

(function() {
  // Add styles
  var css = `
    .card-container {
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
      transition: transform 0.2s;
    }
    
    .lead-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .card-header {
      padding: 12px;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #eee;
    }
    
    .status-area {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .status-pill {
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
    
    .priority-badge {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
    }
    
    .priority-high { background-color: #ffc107; color: #333; }
    .priority-medium { background-color: #17a2b8; color: white; }
    .priority-low { background-color: #999; color: white; }
    
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
    
    .card-actions {
      display: flex;
      gap: 6px;
    }
    
    .card-btn {
      background: none;
      border: none;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #555;
      border-radius: 4px;
    }
    
    .card-btn:hover {
      background-color: rgba(0,0,0,0.05);
    }
    
    .view-btn:hover { color: #0066ff; }
    .call-btn:hover { color: #28a745; }
    .edit-btn:hover { color: #ffc107; }
    .delete-btn:hover { color: #dc3545; }
    
    .card-body {
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
  
  // Add stylesheet
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  
  // Transform function
  function transformLeadsTables() {
    var tables = document.querySelectorAll('table');
    
    tables.forEach(function(table) {
      // Check if table headers contain lead-related columns
      var headers = [];
      var headerRow = table.querySelector('thead tr');
      if (headerRow) {
        var headerCells = headerRow.querySelectorAll('th');
        headerCells.forEach(function(cell) {
          headers.push(cell.textContent.trim().toLowerCase());
        });
      }
      
      // If it looks like a leads table
      if (headers.includes('company') || 
          headers.includes('contact') || 
          headers.includes('status') || 
          headers.includes('lead')) {
        
        // Create container for cards
        var container = document.createElement('div');
        container.className = 'card-container';
        
        // Get table rows
        var rows = table.querySelectorAll('tbody tr');
        rows.forEach(function(row, index) {
          var cells = row.querySelectorAll('td');
          if (cells.length < 3) return;
          
          // Extract data
          var companyName = cells[0]?.textContent.trim() || 'Unknown Company';
          var contactName = cells[1]?.textContent.trim() || 'Unknown Contact';
          var contactPhone = cells[2]?.textContent.trim() || 'No Phone';
          var status = cells[3]?.textContent.trim().toLowerCase() || 'new';
          
          // Create card element
          var card = document.createElement('div');
          card.className = 'lead-card';
          
          // Set status class
          var statusClass = 'status-new';
          if (status.includes('contact')) statusClass = 'status-contacted';
          if (status.includes('qualif') && !status.includes('unqualif')) statusClass = 'status-qualified';
          if (status.includes('unqualif')) statusClass = 'status-unqualified';
          
          // Build card HTML
          card.innerHTML = `
            <div class="card-header">
              <div class="status-area">
                <span class="status-pill ${statusClass}">${status}</span>
                <span class="priority-badge priority-medium">Medium</span>
                <span class="org-pill"><i class="fas fa-building"></i> Team</span>
              </div>
              <div class="card-actions">
                <button class="card-btn view-btn"><i class="fas fa-eye"></i></button>
                <button class="card-btn call-btn"><i class="fas fa-phone"></i></button>
                <button class="card-btn edit-btn"><i class="fas fa-edit"></i></button>
                <button class="card-btn delete-btn"><i class="fas fa-trash"></i></button>
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
          
          // Add to container
          container.appendChild(card);
          
          // Add event listeners
          setupCardButtons(card, row, companyName, contactName, contactPhone);
        });
        
        // Add container after table
        if (container.children.length > 0) {
          var parent = table.parentNode;
          table.style.display = 'none';
          parent.insertBefore(container, table.nextSibling);
        }
      }
    });
  }
  
  // Setup buttons on card
  function setupCardButtons(card, originalRow, companyName, contactName, contactPhone) {
    // Call button
    var callButton = card.querySelector('.call-btn');
    if (callButton) {
      callButton.addEventListener('click', function() {
        var leadId = originalRow.getAttribute('data-id') || originalRow.id;
        
        // Use call tracking if available
        if (typeof window.startCall === 'function') {
          window.startCall(leadId, contactName, companyName, contactPhone);
        } else {
          // Try to click original button
          var originalCallBtn = originalRow.querySelector('button.btn-call, button:has(.fa-phone)');
          if (originalCallBtn) {
            originalCallBtn.click();
          } else {
            console.log("Call lead: " + contactName);
            alert("Calling " + contactName + " at " + contactPhone);
          }
        }
      });
    }
    
    // View button
    var viewButton = card.querySelector('.view-btn');
    if (viewButton) {
      viewButton.addEventListener('click', function() {
        var originalBtn = originalRow.querySelector('button.btn-view, button:has(.fa-eye)');
        if (originalBtn) originalBtn.click();
      });
    }
    
    // Edit button
    var editButton = card.querySelector('.edit-btn');
    if (editButton) {
      editButton.addEventListener('click', function() {
        var originalBtn = originalRow.querySelector('button.btn-edit, button:has(.fa-edit)');
        if (originalBtn) originalBtn.click();
      });
    }
    
    // Delete button
    var deleteButton = card.querySelector('.delete-btn');
    if (deleteButton) {
      deleteButton.addEventListener('click', function() {
        var originalBtn = originalRow.querySelector('button.btn-delete, button:has(.fa-trash)');
        if (originalBtn) originalBtn.click();
      });
    }
  }
  
  // Wait for page to load then run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(transformLeadsTables, 1000);
    });
  } else {
    setTimeout(transformLeadsTables, 1000);
  }
  
  // Also run on navigation
  document.addEventListener('click', function(e) {
    if (e.target.matches('.nav-link') || e.target.closest('.nav-link')) {
      setTimeout(transformLeadsTables, 1000);
    }
  });
})();