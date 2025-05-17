/**
 * FLUTTERBYE CRM - Minimal Lead Cards
 * Simple transformation of leads table to cards
 */

// Wait for page to fully load
document.addEventListener('DOMContentLoaded', function() {
  console.log("Minimal cards script loaded");
  
  // Find and transform leads table after a short delay
  setTimeout(function() {
    const tables = document.querySelectorAll('table');
    console.log("Found " + tables.length + " tables");
    
    // Check each table
    tables.forEach(function(table) {
      const headers = Array.from(table.querySelectorAll('thead th'))
        .map(th => th.textContent.trim().toLowerCase());
      
      // Check if this looks like a leads table
      if (headers.includes('company') || headers.includes('contact') || 
          headers.includes('status') || headers.includes('lead')) {
        
        console.log("Converting leads table to cards");
        
        // Create cards container
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'lead-cards-container';
        
        // Create cards from table rows
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(function(row, index) {
          const cells = row.querySelectorAll('td');
          if (cells.length < 3) return;
          
          // Extract data
          const companyName = cells[0].textContent.trim();
          const contactName = cells[1].textContent.trim();
          const contactPhone = cells[2].textContent.trim();
          const status = cells[3] ? cells[3].textContent.trim().toLowerCase() : 'new';
          
          // Create card
          const card = document.createElement('div');
          card.className = 'lead-card';
          
          // Determine status class
          let statusClass = 'status-new';
          if (status.includes('contact')) statusClass = 'status-contacted';
          if (status.includes('qualif') && !status.includes('unqualif')) statusClass = 'status-qualified';
          if (status.includes('unqualif')) statusClass = 'status-unqualified';
          
          // Create card content
          card.innerHTML = `
            <div class="lead-header">
              <div class="lead-status-container">
                <span class="status-pill ${statusClass}">${status || 'New'}</span>
                <span class="priority-badge priority-medium">Medium</span>
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
          
          cardsContainer.appendChild(card);
        });
        
        // Add cards to document
        if (cardsContainer.children.length > 0) {
          const tableParent = table.parentNode;
          table.style.display = 'none';
          tableParent.insertBefore(cardsContainer, table.nextSibling);
          console.log("Added " + cardsContainer.children.length + " lead cards");
        }
      }
    });
  }, 1000);
});