/**
 * FLUTTERBYE CRM - Lead Cards Fix
 * This script adds a simple card-based layout for leads display
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log("Lead cards fix script loaded");
  
  // Add card styles
  const style = document.createElement('style');
  style.textContent = `
    /* Lead Cards Container */
    .lead-cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 15px;
      margin: 20px 0;
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
    
    /* Card Header */
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
  
  // Function to convert leads table to cards
  function convertLeadsTableToCards() {
    console.log("Converting leads table to cards");
    
    // Find all tables
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      // Check if this table is likely a leads table
      const headerTexts = Array.from(table.querySelectorAll('thead th'))
        .map(th => th.textContent.trim().toLowerCase());
      
      if (headerTexts.includes('company') || headerTexts.includes('contact') || 
          headerTexts.includes('status') || headerTexts.includes('lead')) {
        
        console.log("Found leads table:", headerTexts);
        
        // Create cards container
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'lead-cards-container';
        
        // Process rows
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length < 3) return;
          
          // Find data in cells based on header text
          const companyIdx = headerTexts.findIndex(text => text.includes('company'));
          const contactIdx = headerTexts.findIndex(text => text.includes('contact') || text.includes('name'));
          const phoneIdx = headerTexts.findIndex(text => text.includes('phone'));
          const statusIdx = headerTexts.findIndex(text => text.includes('status'));
          
          // Extract data, fallback to index-based if headers not found
          const companyName = (companyIdx !== -1) ? cells[companyIdx].textContent.trim() : 
                              (cells[0] ? cells[0].textContent.trim() : 'Unknown Company');
          
          const contactName = (contactIdx !== -1) ? cells[contactIdx].textContent.trim() : 
                              (cells[1] ? cells[1].textContent.trim() : 'Unknown Contact');
          
          const contactPhone = (phoneIdx !== -1) ? cells[phoneIdx].textContent.trim() : 
                              (cells[2] ? cells[2].textContent.trim() : 'No Phone');
          
          const status = (statusIdx !== -1) ? cells[statusIdx].textContent.trim().toLowerCase() : 'new';
          
          // Determine shared state
          const isShared = row.classList.contains('shared-lead') || 
                          row.getAttribute('data-shared') === 'true' ||
                          row.innerHTML.includes('fa-building');
          
          const orgName = row.getAttribute('data-org-name') || 'Team';
          
          // Get lead ID
          const leadId = row.getAttribute('data-id') || row.getAttribute('data-lead-id') || 
                        row.id || `lead-${Math.random().toString(36).substring(2, 9)}`;
          
          // Determine priority
          let priority = 'medium';
          if (row.classList.contains('priority-high') || row.getAttribute('data-priority') === 'high') {
            priority = 'high';
          } else if (row.classList.contains('priority-low') || row.getAttribute('data-priority') === 'low') {
            priority = 'low';
          }
          
          // Create card
          const card = document.createElement('div');
          card.className = 'lead-card';
          card.setAttribute('data-id', leadId);
          
          // Determine status and priority classes
          let statusClass = 'status-new';
          if (status.includes('contact')) statusClass = 'status-contacted';
          if (status.includes('qualif') && !status.includes('unqualif')) statusClass = 'status-qualified';
          if (status.includes('unqualif')) statusClass = 'status-unqualified';
          
          let priorityClass = 'priority-medium';
          if (priority === 'high') priorityClass = 'priority-high';
          if (priority === 'low') priorityClass = 'priority-low';
          
          // Build card HTML
          card.innerHTML = `
            <div class="lead-header">
              <div class="lead-status-container">
                <span class="status-pill ${statusClass}">${status || 'New'}</span>
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
          
          // Attach action handlers
          setupCardActions(card, row, leadId, contactName, companyName, contactPhone);
          
          // Add card to container
          cardsContainer.appendChild(card);
        });
        
        // Insert cards container after table
        if (cardsContainer.children.length > 0) {
          const parent = table.parentNode;
          // Hide original table and add cards
          table.style.display = 'none';
          parent.insertBefore(cardsContainer, table.nextSibling);
          console.log(`Converted ${cardsContainer.children.length} leads to cards`);
        }
      }
    });
  }
  
  // Setup card action handlers
  function setupCardActions(card, originalRow, leadId, contactName, companyName, contactPhone) {
    // View action
    card.querySelector('.view-btn')?.addEventListener('click', () => {
      // Try to find original view button
      const viewBtn = originalRow.querySelector('.btn-view, .view-btn, [data-action="view"], button:has(.fa-eye)');
      if (viewBtn) {
        viewBtn.click();
      } else {
        console.log(`View lead: ${leadId}`);
        // Fallback
        window.location.href = `/leads/${leadId}`;
      }
    });
    
    // Call action
    card.querySelector('.call-btn')?.addEventListener('click', () => {
      // Use call tracking system if available
      if (typeof window.startCall === 'function') {
        window.startCall(leadId, contactName, companyName, contactPhone);
      } else {
        // Try to find original call button
        const callBtn = originalRow.querySelector('.btn-call, .call-btn, [data-action="call"], button:has(.fa-phone)');
        if (callBtn) {
          callBtn.click();
        } else {
          console.log(`Call lead: ${leadId}`);
          alert(`Calling ${contactName} at ${contactPhone}`);
        }
      }
    });
    
    // Edit action
    card.querySelector('.edit-btn')?.addEventListener('click', () => {
      // Try to find original edit button
      const editBtn = originalRow.querySelector('.btn-edit, .edit-btn, [data-action="edit"], button:has(.fa-edit)');
      if (editBtn) {
        editBtn.click();
      } else {
        console.log(`Edit lead: ${leadId}`);
        // Fallback
        window.location.href = `/leads/${leadId}/edit`;
      }
    });
    
    // Delete action
    card.querySelector('.delete-btn')?.addEventListener('click', () => {
      // Try to find original delete button
      const deleteBtn = originalRow.querySelector('.btn-delete, .delete-btn, [data-action="delete"], button:has(.fa-trash)');
      if (deleteBtn) {
        deleteBtn.click();
      } else {
        console.log(`Delete lead: ${leadId}`);
        if (confirm(`Are you sure you want to delete ${companyName}?`)) {
          fetch(`/api/leads/${leadId}`, { method: 'DELETE' })
            .then(response => {
              if (response.ok) {
                card.remove();
                originalRow.remove();
              }
            });
        }
      }
    });
  }
  
  // Initial conversion after a delay to let page load fully
  setTimeout(convertLeadsTableToCards, 1000);
  
  // Re-run conversion when content changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && 
          (mutation.target.matches('.table-container') || 
           mutation.target.closest('.table-container'))) {
        setTimeout(convertLeadsTableToCards, 500);
      }
    });
  });
  
  // Observe the document body for changes
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Also watch for tab switching
  document.addEventListener('click', (e) => {
    if (e.target.matches('.nav-link') || e.target.closest('.nav-link')) {
      setTimeout(convertLeadsTableToCards, 500);
    }
  });
});