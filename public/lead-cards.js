/**
 * FLUTTERBYE CRM - Lead Cards Enhancement
 * This script transforms the leads display into a card-based layout
 */

// Add styles for the card-based layout
const cardStyles = document.createElement('style');
cardStyles.textContent = `
  /* Card-based layout for leads */
  .lead-cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    margin-top: 16px;
  }
  
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
  
  .lead-body {
    padding: 16px;
  }
  
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
document.head.appendChild(cardStyles);

// Function to convert leads display to card-based layout
function enhanceLeadsDisplay() {
  // Get the lead grid container
  const leadsGrid = document.getElementById('leadsGrid');
  if (!leadsGrid) return;
  
  // Change the grid container to use our card styling
  leadsGrid.classList.add('lead-cards-container');
  
  // Enhance existing lead cards
  const leadCards = leadsGrid.querySelectorAll('.lead-card');
  leadCards.forEach(card => {
    // Get lead data from data attributes
    const leadData = {
      id: card.dataset.leadId,
      status: card.dataset.status || 'new',
      priority: card.dataset.priority || 'medium',
      isShared: card.dataset.isShared === 'true',
      orgName: card.dataset.orgName || 'Team'
    };
    
    // Get company and contact info
    const companyName = card.querySelector('.lead-company').textContent;
    const contactName = card.querySelector('.lead-contact-name').textContent;
    const contactPhone = card.querySelector('.lead-contact-phone')?.textContent || 'N/A';
    
    // Determine status class
    let statusClass = 'status-new';
    if (leadData.status === 'contacted') statusClass = 'status-contacted';
    if (leadData.status === 'qualified') statusClass = 'status-qualified';
    if (leadData.status === 'unqualified') statusClass = 'status-unqualified';
    
    // Determine priority class
    let priorityClass = 'priority-medium';
    if (leadData.priority === 'high') priorityClass = 'priority-high';
    if (leadData.priority === 'low') priorityClass = 'priority-low';
    
    // Create organization pill if shared
    const orgPill = leadData.isShared ? 
      `<div class="org-pill">
         <i class="fas fa-building"></i> 
         <span>${leadData.orgName}</span>
       </div>` : '';
    
    // Create enhanced card HTML
    card.innerHTML = `
      <div class="lead-header">
        <div class="lead-status-container">
          <span class="status-pill ${statusClass}">${leadData.status}</span>
          <span class="priority-badge ${priorityClass}">${leadData.priority}</span>
          ${orgPill}
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
    
    // Add event listeners
    card.querySelector('.view-btn').addEventListener('click', () => viewLead(leadData.id));
    card.querySelector('.call-btn').addEventListener('click', () => startCall(leadData.id));
    card.querySelector('.edit-btn').addEventListener('click', () => editLead(leadData.id));
    card.querySelector('.delete-btn').addEventListener('click', () => deleteLead(leadData.id));
  });
}

// Observe DOM changes to enhance leads when they are loaded
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      // Check if any lead cards were added
      const leadCards = document.querySelectorAll('.lead-card');
      if (leadCards.length > 0) {
        enhanceLeadsDisplay();
      }
    }
  });
});

// Start observing DOM changes
document.addEventListener('DOMContentLoaded', () => {
  // Initial enhancement
  setTimeout(() => enhanceLeadsDisplay(), 1000);
  
  // Observe changes to the leads grid
  const leadsGrid = document.getElementById('leadsGrid');
  if (leadsGrid) {
    observer.observe(leadsGrid, { childList: true, subtree: true });
  }
});