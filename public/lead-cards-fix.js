/**
 * FLUTTERBYE CRM - Lead Cards Fix
 * This script adds a simple card-based layout for leads display
 */

// Run immediately when loaded
(function() {
  // Add the necessary styles
  addCardStyles();
  
  // Set up DOM loaded event
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Lead cards fix loaded');
    
    // Find or create the leads container
    const mainContent = document.querySelector('main') || document.querySelector('.content') || document.body;
    
    if (!document.querySelector('.recent-leads-container')) {
      const leadsContainer = document.createElement('div');
      leadsContainer.className = 'container recent-leads-container mt-4';
      leadsContainer.innerHTML = `
        <div class="row">
          <div class="col-md-12">
            <h3 class="section-title">Recent Leads</h3>
            <div class="recent-leads-list">
              <div class="loading-indicator">Loading leads...</div>
            </div>
          </div>
        </div>
      `;
      
      // Add it to the page
      mainContent.appendChild(leadsContainer);
    }
    
    // Try to fetch leads data
    setTimeout(convertLeadsTableToCards, 200);
  });
  
  function addCardStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .lead-card {
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        padding: 16px;
        margin-bottom: 12px;
        background-color: #fff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: all 0.2s ease;
      }
      
      .lead-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
      
      .lead-company {
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 6px;
        color: #333;
      }
      
      .lead-contact, .lead-phone {
        font-size: 14px;
        margin-bottom: 4px;
        color: #666;
      }
      
      .lead-status {
        display: inline-block;
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 12px;
        background-color: #f0f0f0;
        color: #666;
        margin: 6px 0;
      }
      
      .lead-card.high-priority {
        border-left: 4px solid #f44336;
      }
      
      .lead-card.medium-priority {
        border-left: 4px solid #ff9800;
      }
      
      .lead-card.low-priority {
        border-left: 4px solid #4caf50;
      }
      
      .lead-actions {
        display: flex;
        gap: 8px;
        margin-top: 10px;
      }
      
      .lead-actions .btn {
        font-size: 12px;
        padding: 4px 10px;
      }
      
      .recent-leads-container {
        margin-top: 20px;
      }
      
      .section-title {
        margin-bottom: 16px;
        border-bottom: 1px solid #eaeaea;
        padding-bottom: 8px;
      }
      
      .loading-indicator {
        text-align: center;
        padding: 20px;
        color: #666;
      }
      
      .no-data {
        text-align: center;
        padding: 24px;
        color: #666;
        background-color: #f9f9f9;
        border-radius: 4px;
        font-style: italic;
      }
    `;
    document.head.appendChild(style);
  }
  
  function convertLeadsTableToCards() {
    console.log('Converting leads table to cards');
    
    // Find the leads container
    const leadsContainer = document.querySelector('.recent-leads-list');
    if (!leadsContainer) {
      console.log('No leads container found');
      return;
    }
    
    // Fetch leads from API
    fetch('/api/analytics/dashboard', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }
      return response.json();
    })
    .then(data => {
      console.log('Fetched leads data:', data);
      
      // Clear loading indicator
      leadsContainer.innerHTML = '';
      
      if (data && data.data && data.data.recentLeads && data.data.recentLeads.length > 0) {
        // Create lead cards
        data.data.recentLeads.forEach(lead => {
          // Create card element
          const card = document.createElement('div');
          card.className = 'lead-card';
          card.dataset.leadId = lead.id;
          
          // Add priority class
          if (lead.priority >= 4) {
            card.classList.add('high-priority');
          } else if (lead.priority >= 2) {
            card.classList.add('medium-priority');
          } else {
            card.classList.add('low-priority');
          }
          
          // Set card content
          card.innerHTML = `
            <div class="lead-company">${lead.companyName || 'Unnamed Company'}</div>
            <div class="lead-contact">${lead.contactName || 'No contact name'}</div>
            <div class="lead-phone">${lead.phoneNumber || 'No phone number'}</div>
            <div class="lead-status">${lead.status || 'new'}</div>
            <div class="lead-actions">
              <button class="btn btn-sm btn-primary btn-call" data-lead-id="${lead.id}">
                <i class="fas fa-phone"></i> Call
              </button>
              <button class="btn btn-sm btn-outline-secondary btn-view" data-lead-id="${lead.id}">
                <i class="fas fa-eye"></i> View
              </button>
            </div>
          `;
          
          // Add card to container
          leadsContainer.appendChild(card);
          
          // Set up card actions
          setupCardActions(card, null, lead.id, lead.contactName, lead.companyName, lead.phoneNumber);
        });
      } else {
        // Show no data message
        leadsContainer.innerHTML = '<div class="no-data">No leads available</div>';
      }
    })
    .catch(error => {
      console.error('Error fetching leads:', error);
      leadsContainer.innerHTML = '<div class="no-data">Error loading leads. Please refresh the page.</div>';
    });
  }
  
  function setupCardActions(card, originalRow, leadId, contactName, companyName, contactPhone) {
    // Call button
    const callBtn = card.querySelector('.btn-call');
    if (callBtn) {
      callBtn.addEventListener('click', function() {
        window.location.href = `/call-in-progress/${leadId}`;
      });
    }
    
    // View button
    const viewBtn = card.querySelector('.btn-view');
    if (viewBtn) {
      viewBtn.addEventListener('click', function() {
        window.location.href = `/leads/${leadId}`;
      });
    }
  }
})();