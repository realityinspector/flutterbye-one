/**
 * FLUTTERBYE CRM - Lead Cards Solution
 * This script transforms the leads table into a card-based layout
 * and provides call tracking functionality
 */

// Execute when DOM is ready
(function() {
  // Wait for page to load
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Lead cards solution loaded');
    
    // Add styles first
    addStyles();
    
    // Add call tracking UI
    addCallTrackingUI();
    
    // Setup call handler
    setupCallHandler();
    
    // Transform lead tables
    setTimeout(transformLeadTables, 200);
  });
  
  /**
   * Add CSS styles for lead cards and call tracking
   */
  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Lead card styles */
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
      
      /* Call tracking overlay */
      .call-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.7);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        display: none;
      }
      
      .call-window {
        background-color: #fff;
        border-radius: 8px;
        width: 90%;
        max-width: 400px;
        padding: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }
      
      .call-header {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
      }
      
      .call-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background-color: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        font-size: 20px;
        color: #666;
      }
      
      .call-info {
        flex: 1;
      }
      
      .call-name {
        font-weight: bold;
        margin-bottom: 4px;
      }
      
      .call-company {
        font-size: 14px;
        color: #666;
      }
      
      .call-status {
        text-align: center;
        font-size: 14px;
        color: #666;
        margin: 12px 0;
      }
      
      .call-timer {
        text-align: center;
        font-size: 24px;
        font-weight: bold;
        margin: 16px 0;
      }
      
      .call-actions {
        display: flex;
        justify-content: center;
        gap: 16px;
        margin-top: 20px;
      }
      
      .call-action-btn {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .call-action-btn:hover {
        transform: scale(1.1);
      }
      
      .end-call-btn {
        background-color: #f44336;
        color: white;
      }
      
      .mute-call-btn {
        background-color: #f0f0f0;
        color: #333;
      }
      
      .hold-call-btn {
        background-color: #ff9800;
        color: white;
      }
      
      /* Empty state styling */
      .no-data {
        text-align: center;
        padding: 24px;
        color: #666;
        background-color: #f9f9f9;
        border-radius: 4px;
        font-style: italic;
      }
      
      /* Dashboard stats */
      .dashboard-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 24px;
      }
      
      .stat-card {
        flex: 1;
        min-width: 200px;
        padding: 16px;
        background-color: #fff;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
      }
      
      .stat-icon {
        font-size: 24px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background-color: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        color: #3f51b5;
      }
      
      .stat-content {
        flex: 1;
      }
      
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #333;
      }
      
      .stat-label {
        font-size: 14px;
        color: #666;
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Add call tracking UI to the page
   */
  function addCallTrackingUI() {
    // Create call overlay
    const callOverlay = document.createElement('div');
    callOverlay.className = 'call-overlay';
    callOverlay.innerHTML = `
      <div class="call-window">
        <div class="call-header">
          <div class="call-avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="call-info">
            <div class="call-name" id="call-contact-name">Contact Name</div>
            <div class="call-company" id="call-company-name">Company Name</div>
          </div>
        </div>
        <div class="call-status" id="call-status">Connecting...</div>
        <div class="call-timer" id="call-timer">00:00</div>
        <div class="call-actions">
          <div class="call-action-btn mute-call-btn" id="mute-call-btn">
            <i class="fas fa-microphone-slash"></i>
          </div>
          <div class="call-action-btn end-call-btn" id="end-call-btn">
            <i class="fas fa-phone-slash"></i>
          </div>
          <div class="call-action-btn hold-call-btn" id="hold-call-btn">
            <i class="fas fa-pause"></i>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(callOverlay);
  }
  
  /**
   * Set up global call handler and event listeners
   */
  function setupCallHandler() {
    // Call tracking variables
    let activeCall = null;
    let callTimer = null;
    let callDuration = 0;
    
    // Get call elements
    const callOverlay = document.querySelector('.call-overlay');
    const callContactName = document.getElementById('call-contact-name');
    const callCompanyName = document.getElementById('call-company-name');
    const callStatus = document.getElementById('call-status');
    const callTimerElement = document.getElementById('call-timer');
    const muteCallBtn = document.getElementById('mute-call-btn');
    const endCallBtn = document.getElementById('end-call-btn');
    const holdCallBtn = document.getElementById('hold-call-btn');
    
    // Function to start a call
    window.startCall = function(leadId, contactName, companyName, phoneNumber) {
      console.log(`Starting call to ${contactName} at ${companyName}`);
      
      // Set call info
      callContactName.textContent = contactName || 'Unknown Contact';
      callCompanyName.textContent = companyName || 'Unknown Company';
      callStatus.textContent = 'Connecting...';
      
      // Show call overlay
      callOverlay.style.display = 'flex';
      
      // Set active call
      activeCall = {
        leadId: leadId,
        contactName: contactName,
        companyName: companyName,
        phoneNumber: phoneNumber,
        startTime: new Date(),
        status: 'connecting'
      };
      
      // Reset timer
      callDuration = 0;
      callTimerElement.textContent = '00:00';
      
      // Start call timer
      setTimeout(function() {
        callStatus.textContent = 'Connected';
        activeCall.status = 'connected';
        
        // Start timer
        callTimer = setInterval(updateCallTimer, 1000);
      }, 1500);
      
      // Update lead status
      updateLeadStatus(leadId, 'in-progress');
    };
    
    // Update call timer
    function updateCallTimer() {
      callDuration++;
      const minutes = Math.floor(callDuration / 60);
      const seconds = callDuration % 60;
      callTimerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // End call handler
    function endCall() {
      if (!activeCall) return;
      
      // Stop timer
      clearInterval(callTimer);
      callTimer = null;
      
      // Hide call overlay
      callOverlay.style.display = 'none';
      
      // Update lead status
      updateLeadStatus(activeCall.leadId, 'contacted');
      
      // Record call
      const callData = {
        leadId: activeCall.leadId,
        duration: callDuration,
        outcome: 'completed',
        notes: ''
      };
      console.log('Call ended:', callData);
      
      // Clear active call
      activeCall = null;
      
      // Redirect to call log form
      if (callData.leadId) {
        window.location.href = `/call-log/${callData.leadId}`;
      }
    }
    
    // Attach event listeners
    if (endCallBtn) {
      endCallBtn.addEventListener('click', endCall);
    }
    
    if (muteCallBtn) {
      muteCallBtn.addEventListener('click', function() {
        if (!activeCall) return;
        
        const isMuted = muteCallBtn.classList.toggle('active');
        muteCallBtn.querySelector('i').className = isMuted ? 'fas fa-microphone' : 'fas fa-microphone-slash';
        console.log('Call muted:', isMuted);
      });
    }
    
    if (holdCallBtn) {
      holdCallBtn.addEventListener('click', function() {
        if (!activeCall) return;
        
        const isOnHold = holdCallBtn.classList.toggle('active');
        callStatus.textContent = isOnHold ? 'On Hold' : 'Connected';
        console.log('Call on hold:', isOnHold);
      });
    }
  }
  
  /**
   * Update lead status in the UI
   */
  function updateLeadStatus(leadId, status) {
    console.log(`Updating lead ${leadId} status to ${status}`);
    
    // Update card if present
    const leadCard = document.querySelector(`.lead-card[data-lead-id="${leadId}"]`);
    if (leadCard) {
      const statusElement = leadCard.querySelector('.lead-status');
      if (statusElement) {
        statusElement.textContent = status;
      }
    }
  }
  
  /**
   * Find and transform lead tables to card layout
   */
  function transformLeadTables() {
    console.log('Looking for leads to transform...');
    
    // Check if we're on the dashboard
    const recentLeadsContainer = document.querySelector('.recent-leads-list');
    if (recentLeadsContainer) {
      console.log('Found recent leads container, fetching data...');
      
      // First check if we already have API data
      if (window.dashboardData && window.dashboardData.data && window.dashboardData.data.recentLeads) {
        displayLeads(window.dashboardData.data.recentLeads, recentLeadsContainer);
        return;
      }
      
      // Otherwise, fetch data directly
      fetch('/api/analytics/dashboard', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include'
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Dashboard data loaded successfully:', data);
        window.dashboardData = data;
        
        if (data && data.data && data.data.recentLeads) {
          displayLeads(data.data.recentLeads, recentLeadsContainer);
        } else {
          recentLeadsContainer.innerHTML = '<div class="no-data">No leads available</div>';
        }
      })
      .catch(error => {
        console.error('Error loading dashboard data:', error);
        recentLeadsContainer.innerHTML = '<div class="no-data">Error loading leads. Please refresh the page.</div>';
      });
    }
    
    // Also check for leads table on specific leads page
    const leadsTable = document.querySelector('.leads-table');
    if (leadsTable) {
      const rows = leadsTable.querySelectorAll('tbody tr');
      if (rows.length > 0) {
        transformLeadsTable(leadsTable, rows);
      }
    }
  }
  
  /**
   * Transform leads table to cards
   */
  function displayLeads(leads, container) {
    if (!container) return;
    
    console.log('Displaying leads as cards:', leads);
    
    if (!leads || leads.length === 0) {
      container.innerHTML = '<div class="no-data">No leads available</div>';
      return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create lead cards
    leads.forEach(lead => {
      const leadCard = document.createElement('div');
      leadCard.className = 'lead-card';
      leadCard.dataset.leadId = lead.id;
      
      // Add priority class
      if (lead.priority >= 4) {
        leadCard.classList.add('high-priority');
      } else if (lead.priority >= 2) {
        leadCard.classList.add('medium-priority');
      } else {
        leadCard.classList.add('low-priority');
      }
      
      leadCard.innerHTML = `
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
      
      // Set up card actions
      setupCardActions(leadCard, null, lead.id, lead.companyName, lead.contactName, lead.phoneNumber);
      
      container.appendChild(leadCard);
    });
  }
  
  /**
   * Transform leads table from standard HTML table to card layout
   */
  function transformLeadsTable(table, rows) {
    console.log('Transforming leads table to cards');
    
    // Create container for cards
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'leads-cards-container';
    
    // Get table headers
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    
    // Transform each row to a card
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      
      // Extract data from cells
      const leadId = row.dataset.leadId || row.querySelector('[data-lead-id]')?.dataset.leadId || generateLeadId();
      const companyName = findCellByHeaderText('Company', cells, headers) || 'Unknown Company';
      const contactName = findCellByHeaderText('Contact', cells, headers) || 'Unknown Contact';
      const contactPhone = findCellByHeaderText('Phone', cells, headers) || '';
      const status = findCellByHeaderText('Status', cells, headers) || 'new';
      const priority = getPriorityFromRow(row);
      const isShared = row.classList.contains('shared-lead');
      
      // Create card
      const card = createLeadCard(leadId, companyName, contactName, contactPhone, status, priority, isShared);
      
      // Set up card actions
      setupCardActions(card, row, leadId, companyName, contactName, contactPhone);
      
      // Add card to container
      cardsContainer.appendChild(card);
    });
    
    // Replace table with cards
    table.parentNode.insertBefore(cardsContainer, table);
    table.style.display = 'none';
  }
  
  /**
   * Create a lead card element
   */
  function createLeadCard(leadId, companyName, contactName, contactPhone, status, priority, isShared) {
    const card = document.createElement('div');
    card.className = 'lead-card';
    card.dataset.leadId = leadId;
    
    // Add priority class
    if (priority >= 4) {
      card.classList.add('high-priority');
    } else if (priority >= 2) {
      card.classList.add('medium-priority');
    } else {
      card.classList.add('low-priority');
    }
    
    // Add shared badge if applicable
    const sharedBadge = isShared ? '<span class="shared-badge"><i class="fas fa-users"></i></span>' : '';
    
    card.innerHTML = `
      <div class="lead-company">${companyName}${sharedBadge}</div>
      <div class="lead-contact">${contactName}</div>
      <div class="lead-phone">${contactPhone}</div>
      <div class="lead-status">${status}</div>
      <div class="lead-actions">
        <button class="btn btn-sm btn-primary btn-call" data-lead-id="${leadId}">
          <i class="fas fa-phone"></i> Call
        </button>
        <button class="btn btn-sm btn-outline-secondary btn-view" data-lead-id="${leadId}">
          <i class="fas fa-eye"></i> View
        </button>
      </div>
    `;
    
    return card;
  }
  
  /**
   * Set up action buttons on the card
   */
  function setupCardActions(card, originalRow, leadId, companyName, contactName, contactPhone) {
    // Call button
    const callBtn = card.querySelector('.btn-call');
    if (callBtn) {
      callBtn.addEventListener('click', function() {
        // Check if we have a global call function
        if (typeof window.startCall === 'function') {
          window.startCall(leadId, contactName, companyName, contactPhone);
        } else {
          window.location.href = `/call-in-progress/${leadId}`;
        }
      });
    }
    
    // View button
    const viewBtn = card.querySelector('.btn-view');
    if (viewBtn) {
      viewBtn.addEventListener('click', function() {
        window.location.href = `/leads/${leadId}`;
      });
    }
    
    // Other original buttons
    if (originalRow) {
      // Edit button
      setupActionButton(card, '.btn-edit', originalRow, '.btn-edit');
      
      // Delete button
      setupActionButton(card, '.btn-delete', originalRow, '.btn-delete');
      
      // Share button
      setupActionButton(card, '.btn-share', originalRow, '.btn-share');
    }
  }
  
  /**
   * Helper to set up an action button
   */
  function setupActionButton(card, cardButtonSelector, originalRow, originalButtonSelector) {
    const cardButton = card.querySelector(cardButtonSelector);
    const originalButton = originalRow?.querySelector(originalButtonSelector);
    
    if (cardButton && originalButton) {
      cardButton.addEventListener('click', function(e) {
        e.preventDefault();
        originalButton.click();
      });
    }
  }
  
  /**
   * Find cell value by header text
   */
  function findCellByHeaderText(headerText, cells, headers) {
    const index = headers.findIndex(h => 
      h.toLowerCase().includes(headerText.toLowerCase())
    );
    
    if (index !== -1 && cells[index]) {
      return cells[index].textContent.trim();
    }
    
    return null;
  }
  
  /**
   * Get priority from row attributes or classes
   */
  function getPriorityFromRow(row) {
    // Try data attribute first
    if (row.dataset.priority) {
      return parseInt(row.dataset.priority);
    }
    
    // Check classes
    if (row.classList.contains('high-priority')) {
      return 5;
    } else if (row.classList.contains('medium-priority')) {
      return 3;
    } else if (row.classList.contains('low-priority')) {
      return 1;
    }
    
    return 1; // Default to low priority
  }
  
  /**
   * Generate a unique lead ID if none exists
   */
  function generateLeadId() {
    return 'temp-' + Math.random().toString(36).substring(2, 9);
  }
})();