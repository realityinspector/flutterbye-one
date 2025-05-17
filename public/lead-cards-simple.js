/**
 * FLUTTERBYE CRM - Simplified Lead Cards Enhancement
 * This script transforms leads display from table to card-based layout
 */

document.addEventListener('DOMContentLoaded', function() {
  // Add CSS styles for lead cards
  const style = document.createElement('style');
  style.textContent = `
    /* Lead Cards Container */
    .lead-cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 16px;
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
  
  console.log("Lead card styles added successfully");
  
  // Function to convert leads table to card layout
  function convertLeadsToCards() {
    console.log("Starting conversion to cards");
    const leadsTable = document.querySelector('#leadsTable');
    if (!leadsTable) {
      console.log("Leads table not found");
      return;
    }
    
    // Create new container for lead cards
    const cardContainer = document.createElement('div');
    cardContainer.id = 'leadCardsContainer';
    cardContainer.className = 'lead-cards-container';
    
    // Get all lead rows (skip header row)
    const leadRows = Array.from(leadsTable.querySelectorAll('tbody tr'));
    console.log(`Found ${leadRows.length} lead rows`);
    
    leadRows.forEach((row, index) => {
      // Extract lead data from the row
      const leadId = row.getAttribute('data-id') || `lead-${index}`;
      const cells = row.querySelectorAll('td');
      
      // Skip if we don't have enough cells
      if (cells.length < 4) {
        console.log(`Row ${index} has insufficient cells: ${cells.length}`);
        return;
      }
      
      // Extract data from cells
      const companyName = cells[0]?.textContent?.trim() || 'Unknown Company';
      const contactName = cells[1]?.textContent?.trim() || 'Unknown Contact';
      const contactPhone = cells[2]?.textContent?.trim() || 'No Phone';
      const statusText = cells[3]?.textContent?.trim()?.toLowerCase() || 'new';
      
      // Determine if lead is shared with organization (look for org icon or class)
      const isShared = row.classList.contains('shared-lead') || 
                      row.innerHTML.includes('fa-building') ||
                      row.getAttribute('data-shared') === 'true';
      const orgName = row.getAttribute('data-org-name') || 'Team';
      
      // Determine priority based on attribute or class
      let priority = 'medium';
      if (row.classList.contains('priority-high') || row.getAttribute('data-priority') === 'high') {
        priority = 'high';
      } else if (row.classList.contains('priority-low') || row.getAttribute('data-priority') === 'low') {
        priority = 'low';
      }
      
      // Create card element
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
      
      // Forward action clicks to original buttons in the table
      card.querySelector('.view-btn')?.addEventListener('click', () => {
        const viewBtn = row.querySelector('.btn-view, .view-btn, [data-action="view"]');
        if (viewBtn) viewBtn.click();
        else console.log("View button not found in original row");
      });
      
      card.querySelector('.call-btn')?.addEventListener('click', () => {
        // Extract lead data for the call
        const leadId = row.getAttribute('data-id') || card.getAttribute('data-id');
        const contactName = cells[1]?.textContent?.trim() || 'Unknown Contact';
        const companyName = cells[0]?.textContent?.trim() || 'Unknown Company';
        const contactPhone = cells[2]?.textContent?.trim() || 'No Phone';
        
        // Start call with this lead data
        if (typeof window.startCall === 'function') {
          window.startCall(leadId, contactName, companyName, contactPhone);
        } else {
          // Fallback to original button if available
          const callBtn = row.querySelector('.btn-call, .call-btn, [data-action="call"]');
          if (callBtn) callBtn.click();
          else console.log("Call button not found in original row");
        }
      });
      
      card.querySelector('.edit-btn')?.addEventListener('click', () => {
        const editBtn = row.querySelector('.btn-edit, .edit-btn, [data-action="edit"]');
        if (editBtn) editBtn.click();
        else console.log("Edit button not found in original row");
      });
      
      card.querySelector('.delete-btn')?.addEventListener('click', () => {
        const deleteBtn = row.querySelector('.btn-delete, .delete-btn, [data-action="delete"]');
        if (deleteBtn) deleteBtn.click();
        else console.log("Delete button not found in original row");
      });
      
      // Add card to container
      cardContainer.appendChild(card);
    });
    
    // Replace table with card container if we have cards
    if (cardContainer.children.length > 0) {
      const tableContainer = leadsTable.closest('.table-responsive') || leadsTable.parentNode;
      if (tableContainer) {
        console.log("Replacing table with cards container");
        tableContainer.style.display = 'none';
        tableContainer.parentNode.insertBefore(cardContainer, tableContainer);
      } else {
        console.log("Table container not found");
      }
    } else {
      console.log("No cards were created");
    }
  }
  
  // Also look for leads table with ID leadsGrid
  function enhanceLeadsGrid() {
    const leadsGrid = document.getElementById('leadsGrid');
    if (!leadsGrid) return;
    
    // Already converted to cards?
    if (leadsGrid.classList.contains('lead-cards-container')) return;
    
    // Add card container class
    leadsGrid.classList.add('lead-cards-container');
    
    // Find and enhance lead cards
    const leadItems = leadsGrid.querySelectorAll('.lead-item');
    leadItems.forEach(item => {
      // Add lead-card class
      item.classList.add('lead-card');
      
      // Get data for the lead
      const company = item.querySelector('.lead-company')?.textContent || 'Unknown Company';
      const contact = item.querySelector('.lead-contact')?.textContent || 'Unknown Contact';
      const phone = item.querySelector('.lead-phone')?.textContent || 'No Phone';
      const status = item.getAttribute('data-status') || 'new';
      const priority = item.getAttribute('data-priority') || 'medium';
      const isShared = item.getAttribute('data-shared') === 'true';
      const orgName = item.getAttribute('data-org') || 'Team';
      
      // Determine status and priority classes
      let statusClass = 'status-new';
      if (status.includes('contacted')) statusClass = 'status-contacted';
      if (status.includes('qualified')) statusClass = 'status-qualified';
      if (status.includes('unqualified')) statusClass = 'status-unqualified';
      
      let priorityClass = 'priority-medium';
      if (priority === 'high') priorityClass = 'priority-high';
      if (priority === 'low') priorityClass = 'priority-low';
      
      // Structure the card with our enhanced layout
      item.innerHTML = `
        <div class="lead-header">
          <div class="lead-status-container">
            <span class="status-pill ${statusClass}">${status}</span>
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
          <h3 class="company-name">${company}</h3>
          <div class="contact-info">
            <div class="contact-name">
              <i class="fas fa-user"></i>
              <span>${contact}</span>
            </div>
            <div class="contact-phone">
              <i class="fas fa-phone"></i>
              <span>${phone}</span>
            </div>
          </div>
        </div>
      `;
    });
  }
  
  // Run conversion on different possible lead containers
  function enhanceAllLeadDisplays() {
    // Try converting standard table
    convertLeadsToCards();
    
    // Try enhancing leads grid
    enhanceLeadsGrid();
  }
  
  // Run conversion after a short delay to ensure page is loaded
  setTimeout(enhanceAllLeadDisplays, 1000);
  
  // Also run conversion when navigation tabs are clicked
  const navLinks = document.querySelectorAll('.nav-link, .nav-item');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      // Give time for content to load
      setTimeout(enhanceAllLeadDisplays, 500);
    });
  });
  
  // Run enhancement when data is refreshed
  document.addEventListener('leads-loaded', enhanceAllLeadDisplays);
});