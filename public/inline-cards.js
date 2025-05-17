/**
 * FLUTTERBYE CRM - Inline Lead Cards
 * Simple transformation of leads table to cards using inline CSS
 */

// Add styles directly when document is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("Inline cards script loaded");
  
  // Add CSS rules directly to head
  const style = document.createElement('style');
  style.innerHTML = `
    /* Card container */
    .card-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    
    /* Lead card */
    .lead-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 0;
      overflow: hidden;
    }
    
    /* Card header */
    .card-header {
      display: flex;
      justify-content: space-between;
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    
    /* Status badges */
    .status-badge {
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 12px;
      color: white;
      margin-right: 5px;
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
    
    /* Priority badge */
    .priority-badge {
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 11px;
      margin-right: 5px;
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
      background-color: #6c757d;
      color: white;
    }
    
    /* Organization badge */
    .org-badge {
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 11px;
      background: linear-gradient(90deg, #7a5cf1, #9b75f0);
      color: white;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    
    /* Action buttons */
    .card-actions {
      display: flex;
      gap: 5px;
    }
    
    .card-btn {
      width: 28px;
      height: 28px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      cursor: pointer;
      color: #555;
    }
    
    .card-btn:hover {
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
    
    /* Card body */
    .card-body {
      padding: 15px;
    }
    
    .company-name {
      margin: 0 0 10px 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .contact-info {
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .contact-info i {
      width: 16px;
      color: #777;
    }
  `;
  document.head.appendChild(style);
  
  // Function to transform tables to cards
  function transformToCards() {
    // Look for lead tables
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      // Check if this is a leads table
      const headerRow = table.querySelector('thead tr');
      if (!headerRow) return;
      
      const headers = Array.from(headerRow.querySelectorAll('th'))
        .map(th => th.textContent.trim().toLowerCase());
      
      if (headers.includes('company') || headers.includes('contact') || 
          headers.includes('lead') || headers.includes('status')) {
        console.log('Found leads table, converting to cards');
        
        // Create card container
        const cardContainer = document.createElement('div');
        cardContainer.className = 'card-container';
        
        // Process rows
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach((row, index) => {
          const cells = row.querySelectorAll('td');
          if (cells.length < 3) return;
          
          // Get data from cells
          const companyName = cells[0]?.textContent.trim() || 'Unknown Company';
          const contactName = cells[1]?.textContent.trim() || 'Unknown Contact';
          const contactPhone = cells[2]?.textContent.trim() || 'No Phone';
          const status = cells[3]?.textContent.trim().toLowerCase() || 'new';
          
          // Create the card
          const card = document.createElement('div');
          card.className = 'lead-card';
          
          // Determine status class
          let statusClass = 'status-new';
          if (status.includes('contact')) statusClass = 'status-contacted';
          if (status.includes('qualif') && !status.includes('unqualif')) statusClass = 'status-qualified';
          if (status.includes('unqualif')) statusClass = 'status-unqualified';
          
          // Build card content with HTML
          card.innerHTML = `
            <div class="card-header">
              <div>
                <span class="status-badge ${statusClass}">${status || 'New'}</span>
                <span class="priority-badge priority-medium">Medium</span>
                <span class="org-badge"><i class="fas fa-building"></i> Team</span>
              </div>
              <div class="card-actions">
                <button class="card-btn view-btn" title="View"><i class="fas fa-eye"></i></button>
                <button class="card-btn call-btn" title="Call"><i class="fas fa-phone"></i></button>
                <button class="card-btn edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="card-btn delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
              </div>
            </div>
            <div class="card-body">
              <h3 class="company-name">${companyName}</h3>
              <div class="contact-info">
                <i class="fas fa-user"></i>
                <span>${contactName}</span>
              </div>
              <div class="contact-info">
                <i class="fas fa-phone"></i>
                <span>${contactPhone}</span>
              </div>
            </div>
          `;
          
          // Add card to container
          cardContainer.appendChild(card);
          
          // Add event listener for call button
          const callBtn = card.querySelector('.call-btn');
          if (callBtn) {
            callBtn.addEventListener('click', function() {
              const leadId = row.getAttribute('data-id') || `lead-${index}`;
              if (typeof window.startCall === 'function') {
                window.startCall(leadId, contactName, companyName, contactPhone);
              } else {
                console.log('Call:', contactName, contactPhone);
                alert(`Calling ${contactName} at ${contactPhone}`);
              }
            });
          }
          
          // Add other action event listeners
          addActionListeners(card, row);
        });
        
        // Add card container after the table
        if (cardContainer.children.length > 0) {
          const parent = table.parentNode;
          table.style.display = 'none';
          parent.insertBefore(cardContainer, table.nextSibling);
          console.log(`Added ${cardContainer.children.length} cards`);
        }
      }
    });
  }
  
  // Add action event listeners
  function addActionListeners(card, originalRow) {
    // View button
    const viewBtn = card.querySelector('.view-btn');
    if (viewBtn) {
      viewBtn.addEventListener('click', function() {
        const originalViewBtn = originalRow.querySelector('button:has(.fa-eye), .btn-view');
        if (originalViewBtn) {
          originalViewBtn.click();
        } else {
          console.log('View details clicked');
        }
      });
    }
    
    // Edit button
    const editBtn = card.querySelector('.edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', function() {
        const originalEditBtn = originalRow.querySelector('button:has(.fa-edit), .btn-edit');
        if (originalEditBtn) {
          originalEditBtn.click();
        } else {
          console.log('Edit clicked');
        }
      });
    }
    
    // Delete button
    const deleteBtn = card.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function() {
        const originalDeleteBtn = originalRow.querySelector('button:has(.fa-trash), .btn-delete');
        if (originalDeleteBtn) {
          originalDeleteBtn.click();
        } else {
          console.log('Delete clicked');
        }
      });
    }
  }
  
  // Run transformation after page loads
  setTimeout(transformToCards, 1000);
  
  // Run when tabs or navigation changes
  document.addEventListener('click', function(e) {
    if (e.target.matches('.nav-link') || e.target.closest('.nav-link')) {
      setTimeout(transformToCards, 1000);
    }
  });
});