(function() {
  // Add card styles
  const style = document.createElement('style');
  style.textContent = `
    .lead-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 0;
      margin-bottom: 15px;
      overflow: hidden;
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    
    .status-area {
      display: flex;
      flex-wrap: wrap;
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
    .priority-low { background-color: #999; color: white; }
    
    .org-tag {
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
    
    .view-btn:hover { color: #0066ff; }
    .call-btn:hover { color: #28a745; }
    .edit-btn:hover { color: #ffc107; }
    .delete-btn:hover { color: #dc3545; }
    
    .card-body {
      padding: 15px;
    }
    
    .company-title {
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
    
    .lead-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
  `;
  document.head.appendChild(style);

  // Create lead card display function
  function displayLeadAsCard(company, contact, phone, status) {
    const card = document.createElement('div');
    card.className = 'lead-card';
    
    // Determine status class
    let statusClass = 'status-new';
    if (status && status.includes('contact')) statusClass = 'status-contacted';
    if (status && status.includes('qualif') && !status.includes('unqualif')) statusClass = 'status-qualified';
    if (status && status.includes('unqualif')) statusClass = 'status-unqualified';
    
    // Set HTML content
    card.innerHTML = `
      <div class="card-header">
        <div class="status-area">
          <span class="status-pill ${statusClass}">${status || 'New'}</span>
          <span class="priority-tag priority-medium">Medium</span>
          <span class="org-tag"><i class="fas fa-building"></i> Team</span>
        </div>
        <div class="card-actions">
          <button class="action-btn view-btn"><i class="fas fa-eye"></i></button>
          <button class="action-btn call-btn"><i class="fas fa-phone"></i></button>
          <button class="action-btn edit-btn"><i class="fas fa-edit"></i></button>
          <button class="action-btn delete-btn"><i class="fas fa-trash"></i></button>
        </div>
      </div>
      <div class="card-body">
        <h3 class="company-title">${company}</h3>
        <div class="contact-info">
          <div class="contact-row">
            <i class="fas fa-user"></i>
            <span>${contact}</span>
          </div>
          <div class="contact-row">
            <i class="fas fa-phone"></i>
            <span>${phone}</span>
          </div>
        </div>
      </div>
    `;
    
    return card;
  }

  // Find and convert leads table
  function findAndConvertLeadsTables() {
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      // Get table headers
      const headers = Array.from(table.querySelectorAll('thead th'))
        .map(th => th.textContent.trim().toLowerCase());
      
      // Check if this is a leads table
      if (headers.includes('company') || headers.includes('contact') || 
          headers.includes('lead') || headers.includes('status')) {
        
        // Create container for cards
        const cardsGrid = document.createElement('div');
        cardsGrid.className = 'lead-cards-grid';
        
        // Process rows
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length < 3) return;
          
          // Extract data
          const companyName = cells[0]?.textContent.trim() || 'Unknown Company';
          const contactName = cells[1]?.textContent.trim() || 'Unknown Contact';
          const contactPhone = cells[2]?.textContent.trim() || 'No Phone';
          const status = cells[3]?.textContent.trim().toLowerCase() || 'new';
          
          // Create card
          const card = displayLeadAsCard(companyName, contactName, contactPhone, status);
          
          // Add card to grid
          cardsGrid.appendChild(card);
        });
        
        // Add cards after table
        if (cardsGrid.children.length > 0) {
          table.style.display = 'none';
          table.parentNode.insertBefore(cardsGrid, table.nextSibling);
        }
      }
    });
  }

  // Run when document is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(findAndConvertLeadsTables, 1000);
    });
  } else {
    setTimeout(findAndConvertLeadsTables, 1000);
  }
  
  // Also run when navigation changes
  document.addEventListener('click', e => {
    if (e.target.matches('.nav-link') || e.target.closest('.nav-link')) {
      setTimeout(findAndConvertLeadsTables, 1000);
    }
  });
})();