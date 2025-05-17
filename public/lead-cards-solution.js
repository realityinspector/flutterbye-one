/**
 * FLUTTERBYE CRM - Lead Cards Solution
 * Complete implementation for card-based lead display with call tracking
 */

// Execute when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('FLUTTERBYE CRM - Lead Cards Solution loaded');
  
  // Add styles for lead cards and call tracking
  addStyles();
  
  // Add call tracking UI to the page
  addCallTrackingUI();
  
  // Set up the global call handler
  setupCallHandler();
  
  // Transform lead tables with a delay to ensure content is loaded
  setTimeout(transformLeadTables, 1000);
  
  // Listen for navigation events to retransform when needed
  document.addEventListener('click', function(event) {
    if (event.target.closest('.nav-link') || event.target.classList.contains('nav-link')) {
      setTimeout(transformLeadTables, 800);
    }
  });
});

/**
 * Add CSS styles for lead cards and call tracking
 */
function addStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Lead Cards Container */
    .lead-cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
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
    .card-header {
      display: flex;
      justify-content: space-between;
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    
    /* Status Container */
    .status-container {
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
      color: white;
    }
    
    .status-new { background-color: #17a2b8; }
    .status-contacted { background-color: #0066ff; }
    .status-qualified { background-color: #28a745; }
    .status-unqualified { background-color: #dc3545; }
    
    /* Priority Badge */
    .priority-badge {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
    }
    
    .priority-high { background-color: #ffc107; color: #333; }
    .priority-medium { background-color: #17a2b8; color: white; }
    .priority-low { background-color: #6c757d; color: white; }
    
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
    .card-actions {
      display: flex;
      gap: 6px;
    }
    
    .card-btn {
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
      transition: color 0.2s, background-color 0.2s;
    }
    
    .card-btn:hover {
      background-color: rgba(0,0,0,0.05);
    }
    
    .view-btn:hover { color: #0066ff; }
    .call-btn:hover { color: #28a745; }
    .edit-btn:hover { color: #ffc107; }
    .delete-btn:hover { color: #dc3545; }
    
    /* Card Body */
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
    
    /* Call Tracking Modal */
    .call-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s, visibility 0.3s;
    }
    
    .call-overlay.active {
      opacity: 1;
      visibility: visible;
    }
    
    .call-container {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      overflow: hidden;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
    }
    
    .call-header {
      background: linear-gradient(90deg, #0066ff, #5c9bff);
      color: white;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .call-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
    }
    
    .call-timer {
      font-size: 18px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.9);
    }
    
    .call-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .call-contact {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .contact-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: #e1e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0066ff;
      font-size: 24px;
    }
    
    .contact-info-call {
      display: flex;
      flex-direction: column;
    }
    
    .contact-name-call {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
    
    .contact-company {
      font-size: 14px;
      color: #666;
    }
    
    .contact-phone-call {
      font-size: 14px;
      color: #0066ff;
    }
    
    .call-notes {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .call-notes-label {
      font-weight: 600;
      color: #555;
    }
    
    .call-notes-textarea {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 12px;
      min-height: 120px;
      resize: vertical;
      font-family: inherit;
      font-size: 14px;
    }
    
    .call-actions {
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #eee;
    }
    
    .call-button {
      padding: 10px 24px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: none;
      transition: background-color 0.2s, transform 0.1s;
    }
    
    .call-button:active {
      transform: scale(0.98);
    }
    
    .end-btn {
      background-color: #dc3545;
      color: white;
    }
    
    .end-btn:hover {
      background-color: #c82333;
    }
    
    .hold-btn {
      background-color: #ffc107;
      color: #333;
    }
    
    .hold-btn:hover {
      background-color: #e0a800;
    }
    
    .mute-btn {
      background-color: #6c757d;
      color: white;
    }
    
    .mute-btn:hover {
      background-color: #5a6268;
    }
    
    /* After Call Form */
    .after-call-form {
      padding: 20px;
      display: none;
    }
    
    .after-call-form.active {
      display: block;
    }
    
    .form-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0 0 16px 0;
    }
    
    .form-group {
      margin-bottom: 16px;
    }
    
    .form-label {
      display: block;
      font-weight: 500;
      margin-bottom: 6px;
      color: #555;
    }
    
    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-family: inherit;
      font-size: 14px;
    }
    
    .form-select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-family: inherit;
      font-size: 14px;
      background-color: white;
    }
    
    .form-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    
    .btn-primary {
      background-color: #0066ff;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
    }
    
    .btn-primary:hover {
      background-color: #0052cc;
    }
    
    .btn-secondary {
      background-color: #6c757d;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
    }
    
    .btn-secondary:hover {
      background-color: #5a6268;
    }
    
    .status-options {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    
    .status-highlight {
      border: 2px solid transparent;
      border-radius: 4px;
      padding: 5px 10px;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-block;
    }
    
    .status-highlight.active {
      background-color: #f0f8ff;
      border-color: #0066ff;
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Add call tracking UI to the page
 */
function addCallTrackingUI() {
  // Create call overlay element
  const callOverlay = document.createElement('div');
  callOverlay.id = 'callOverlay';
  callOverlay.className = 'call-overlay';
  
  // Set HTML content for call overlay
  callOverlay.innerHTML = `
    <div class="call-container">
      <div class="call-header">
        <h3 class="call-title">Call in Progress</h3>
        <div class="call-timer" id="callTimer">00:00</div>
      </div>
      <div class="call-body">
        <div class="call-contact">
          <div class="contact-avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="contact-info-call">
            <div class="contact-name-call" id="callContactName">Contact Name</div>
            <div class="contact-company" id="callCompanyName">Company Name</div>
            <div class="contact-phone-call" id="callContactPhone">Contact Phone</div>
          </div>
        </div>
        <div class="call-notes">
          <div class="call-notes-label">Call Notes</div>
          <textarea class="call-notes-textarea" id="callNotes" placeholder="Take notes during your call..."></textarea>
        </div>
      </div>
      <div class="call-actions">
        <button class="call-button mute-btn" id="muteButton">
          <i class="fas fa-microphone-slash"></i>
          <span>Mute</span>
        </button>
        <button class="call-button hold-btn" id="holdButton">
          <i class="fas fa-pause"></i>
          <span>Hold</span>
        </button>
        <button class="call-button end-btn" id="endCallButton">
          <i class="fas fa-phone-slash"></i>
          <span>End Call</span>
        </button>
      </div>
      
      <!-- After Call Form -->
      <div class="after-call-form" id="afterCallForm">
        <h4 class="form-title">Call Summary</h4>
        <div class="form-group">
          <label class="form-label">Call Duration</label>
          <input type="text" class="form-control" id="callDuration" readonly>
        </div>
        <div class="form-group">
          <label class="form-label">Call Outcome</label>
          <select class="form-select" id="callOutcome">
            <option value="successful">Successful</option>
            <option value="callback">Callback Needed</option>
            <option value="voicemail">Left Voicemail</option>
            <option value="not-interested">Not Interested</option>
            <option value="wrong-number">Wrong Number</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Lead Status Update</label>
          <div class="status-options">
            <div class="status-highlight" data-status="new">New</div>
            <div class="status-highlight" data-status="contacted">Contacted</div>
            <div class="status-highlight" data-status="qualified">Qualified</div>
            <div class="status-highlight" data-status="unqualified">Unqualified</div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea class="form-control" id="afterCallNotes" rows="4"></textarea>
        </div>
        <div class="form-buttons">
          <button class="btn-secondary" id="cancelAfterCallButton">Cancel</button>
          <button class="btn-primary" id="saveCallButton">Save</button>
        </div>
      </div>
    </div>
  `;
  
  // Add to page
  document.body.appendChild(callOverlay);
}

/**
 * Set up global call handler and event listeners
 */
function setupCallHandler() {
  // Variables for call tracking
  let callTimerInterval;
  let seconds = 0;
  let minutes = 0;
  let currentLeadId = null;
  
  // Global call handler function
  window.startCall = function(leadId, contactName, companyName, contactPhone) {
    // Store lead ID
    currentLeadId = leadId;
    
    // Reset timer
    clearInterval(callTimerInterval);
    seconds = 0;
    minutes = 0;
    document.getElementById('callTimer').textContent = '00:00';
    
    // Set contact info in call interface
    document.getElementById('callContactName').textContent = contactName || 'Unknown Contact';
    document.getElementById('callCompanyName').textContent = companyName || 'Unknown Company';
    document.getElementById('callContactPhone').textContent = contactPhone || 'No Phone';
    
    // Make sure call body and actions are visible
    document.querySelector('.call-body').style.display = 'flex';
    document.querySelector('.call-actions').style.display = 'flex';
    document.getElementById('afterCallForm').classList.remove('active');
    
    // Reset title
    document.querySelector('.call-title').textContent = 'Call in Progress';
    
    // Show call overlay
    document.getElementById('callOverlay').classList.add('active');
    
    // Start timer
    callTimerInterval = setInterval(function() {
      seconds++;
      if (seconds >= 60) {
        seconds = 0;
        minutes++;
      }
      
      const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      
      document.getElementById('callTimer').textContent = `${formattedMinutes}:${formattedSeconds}`;
    }, 1000);
  };
  
  // End call button
  document.getElementById('endCallButton').addEventListener('click', function() {
    // Stop timer
    clearInterval(callTimerInterval);
    
    // Hide call UI
    document.querySelector('.call-body').style.display = 'none';
    document.querySelector('.call-actions').style.display = 'none';
    
    // Show after-call form
    document.getElementById('afterCallForm').classList.add('active');
    
    // Set call duration
    document.getElementById('callDuration').value = document.getElementById('callTimer').textContent;
    
    // Copy notes to after-call form
    document.getElementById('afterCallNotes').value = document.getElementById('callNotes').value;
    
    // Set default status to contacted
    document.querySelectorAll('.status-highlight').forEach(el => el.classList.remove('active'));
    document.querySelector('.status-highlight[data-status="contacted"]').classList.add('active');
    
    // Change title
    document.querySelector('.call-title').textContent = 'Call Summary';
  });
  
  // Mute and hold buttons
  document.getElementById('muteButton').addEventListener('click', function() {
    const isMuted = this.querySelector('span').textContent === 'Unmute';
    
    if (isMuted) {
      this.querySelector('span').textContent = 'Mute';
      this.querySelector('i').className = 'fas fa-microphone-slash';
    } else {
      this.querySelector('span').textContent = 'Unmute';
      this.querySelector('i').className = 'fas fa-microphone';
    }
  });
  
  document.getElementById('holdButton').addEventListener('click', function() {
    const isOnHold = this.querySelector('span').textContent === 'Resume';
    
    if (isOnHold) {
      this.querySelector('span').textContent = 'Hold';
      this.querySelector('i').className = 'fas fa-pause';
    } else {
      this.querySelector('span').textContent = 'Resume';
      this.querySelector('i').className = 'fas fa-play';
    }
  });
  
  // Status highlight selection
  document.querySelectorAll('.status-highlight').forEach(function(highlight) {
    highlight.addEventListener('click', function() {
      // Remove active class from all highlights
      document.querySelectorAll('.status-highlight').forEach(el => {
        el.classList.remove('active');
      });
      
      // Add active class to clicked highlight
      this.classList.add('active');
    });
  });
  
  // Save call data
  document.getElementById('saveCallButton').addEventListener('click', function() {
    // Get form data
    const duration = document.getElementById('callDuration').value;
    const outcome = document.getElementById('callOutcome').value;
    const notes = document.getElementById('afterCallNotes').value;
    const activeStatus = document.querySelector('.status-highlight.active');
    const status = activeStatus ? activeStatus.getAttribute('data-status') : 'contacted';
    
    // Create call data object
    const callData = {
      leadId: currentLeadId,
      duration,
      outcome,
      status,
      notes,
      timestamp: new Date().toISOString()
    };
    
    console.log('Call data saved:', callData);
    
    // Update lead status if needed
    updateLeadStatus(currentLeadId, status);
    
    // Hide call overlay
    document.getElementById('callOverlay').classList.remove('active');
    
    // Reset form after a short delay
    setTimeout(function() {
      document.querySelector('.call-body').style.display = 'flex';
      document.querySelector('.call-actions').style.display = 'flex';
      document.getElementById('afterCallForm').classList.remove('active');
      document.querySelector('.call-title').textContent = 'Call in Progress';
      document.getElementById('callTimer').textContent = '00:00';
      document.getElementById('callNotes').value = '';
      document.getElementById('afterCallNotes').value = '';
    }, 300);
  });
  
  // Cancel button
  document.getElementById('cancelAfterCallButton').addEventListener('click', function() {
    // Hide call overlay
    document.getElementById('callOverlay').classList.remove('active');
    
    // Reset form after a short delay
    setTimeout(function() {
      document.querySelector('.call-body').style.display = 'flex';
      document.querySelector('.call-actions').style.display = 'flex';
      document.getElementById('afterCallForm').classList.remove('active');
      document.querySelector('.call-title').textContent = 'Call in Progress';
      document.getElementById('callTimer').textContent = '00:00';
    }, 300);
  });
}

/**
 * Update lead status in the UI
 */
function updateLeadStatus(leadId, status) {
  // Find the lead card
  const leadCard = document.querySelector(`.lead-card[data-id="${leadId}"]`);
  if (leadCard) {
    // Update status pill
    const statusPill = leadCard.querySelector('.status-pill');
    if (statusPill) {
      // Remove all status classes
      statusPill.classList.remove('status-new', 'status-contacted', 'status-qualified', 'status-unqualified');
      
      // Add new status class
      statusPill.classList.add(`status-${status}`);
      
      // Update text
      statusPill.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
  }
}

/**
 * Find and transform lead tables to card layout
 */
function transformLeadTables() {
  console.log('Searching for lead tables to transform...');
  
  // Find all tables
  const tables = document.querySelectorAll('table');
  
  tables.forEach(function(table) {
    // Check if this looks like a leads table
    const headers = Array.from(table.querySelectorAll('thead th'))
      .map(th => th.textContent.trim().toLowerCase());
    
    // If it has company or contact headers, it's likely a leads table
    if (headers.includes('company') || headers.includes('contact') || 
        headers.includes('lead') || headers.includes('status')) {
      
      console.log('Found a leads table. Converting to cards...');
      
      // Create a container for cards
      const cardContainer = document.createElement('div');
      cardContainer.className = 'lead-cards-container';
      
      // Process each row
      const rows = table.querySelectorAll('tbody tr');
      
      // Transform each row into a card
      rows.forEach(function(row) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 3) return;
        
        // Extract data from cells (adjust indices based on actual table structure)
        const companyName = cells[0]?.textContent.trim() || 'Unknown Company';
        const contactName = cells[1]?.textContent.trim() || 'Unknown Contact';
        const contactPhone = cells[2]?.textContent.trim() || 'No Phone';
        const status = cells[3]?.textContent.trim().toLowerCase() || 'new';
        
        // Get lead ID
        const leadId = row.getAttribute('data-id') || row.id || `lead-${Math.random().toString(36).substr(2, 9)}`;
        
        // Check if shared
        const isShared = row.classList.contains('shared-lead') || 
                        row.getAttribute('data-shared') === 'true' ||
                        row.innerHTML.includes('fa-building');
        const orgName = row.getAttribute('data-org-name') || 'Team';
        
        // Determine priority
        let priority = 'medium';
        let priorityClass = 'priority-medium';
        if (row.classList.contains('priority-high') || row.getAttribute('data-priority') === 'high') {
          priority = 'high';
          priorityClass = 'priority-high';
        } else if (row.classList.contains('priority-low') || row.getAttribute('data-priority') === 'low') {
          priority = 'low';
          priorityClass = 'priority-low';
        }
        
        // Determine status class
        let statusClass = 'status-new';
        let displayStatus = 'New';
        if (status.includes('contact')) {
          statusClass = 'status-contacted';
          displayStatus = 'Contacted';
        } else if (status.includes('qualif') && !status.includes('unqualif')) {
          statusClass = 'status-qualified';
          displayStatus = 'Qualified';
        } else if (status.includes('unqualif')) {
          statusClass = 'status-unqualified';
          displayStatus = 'Unqualified';
        }
        
        // Create card element
        const card = document.createElement('div');
        card.className = 'lead-card';
        card.setAttribute('data-id', leadId);
        
        // Set card HTML
        card.innerHTML = `
          <div class="card-header">
            <div class="status-container">
              <span class="status-pill ${statusClass}">${displayStatus}</span>
              <span class="priority-badge ${priorityClass}">${priority}</span>
              ${isShared ? `<div class="org-pill"><i class="fas fa-building"></i> ${orgName}</div>` : ''}
            </div>
            <div class="card-actions">
              <button class="card-btn view-btn" title="View Details"><i class="fas fa-eye"></i></button>
              <button class="card-btn call-btn" title="Call Lead"><i class="fas fa-phone"></i></button>
              <button class="card-btn edit-btn" title="Edit Lead"><i class="fas fa-edit"></i></button>
              <button class="card-btn delete-btn" title="Delete Lead"><i class="fas fa-trash"></i></button>
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
        
        // Set up action buttons
        setupCardActions(card, row, leadId, companyName, contactName, contactPhone);
        
        // Add card to container
        cardContainer.appendChild(card);
      });
      
      // Only replace if we created cards
      if (cardContainer.children.length > 0) {
        // Get table container or parent
        const tableContainer = table.closest('.table-container') || table.parentNode;
        
        // Hide the original table
        table.style.display = 'none';
        
        // Add card container after table
        tableContainer.parentNode.insertBefore(cardContainer, tableContainer.nextSibling);
        
        console.log(`Successfully transformed ${cardContainer.children.length} leads to cards`);
      }
    }
  });
}

/**
 * Set up action buttons on the card
 */
function setupCardActions(card, originalRow, leadId, companyName, contactName, contactPhone) {
  // View button
  const viewButton = card.querySelector('.view-btn');
  if (viewButton) {
    viewButton.addEventListener('click', function() {
      // Try to find and click the original view button
      const viewBtn = originalRow.querySelector('.btn-view, [data-action="view"]');
      if (viewBtn) {
        viewBtn.click();
      } else {
        console.log('View lead details:', leadId);
      }
    });
  }
  
  // Call button
  const callButton = card.querySelector('.call-btn');
  if (callButton) {
    callButton.addEventListener('click', function() {
      // Use our call tracking system
      window.startCall(leadId, contactName, companyName, contactPhone);
    });
  }
  
  // Edit button
  const editButton = card.querySelector('.edit-btn');
  if (editButton) {
    editButton.addEventListener('click', function() {
      // Try to find and click the original edit button
      const editBtn = originalRow.querySelector('.btn-edit, [data-action="edit"]');
      if (editBtn) {
        editBtn.click();
      } else {
        console.log('Edit lead:', leadId);
      }
    });
  }
  
  // Delete button
  const deleteButton = card.querySelector('.delete-btn');
  if (deleteButton) {
    deleteButton.addEventListener('click', function() {
      // Try to find and click the original delete button
      const deleteBtn = originalRow.querySelector('.btn-delete, [data-action="delete"]');
      if (deleteBtn) {
        deleteBtn.click();
      } else {
        console.log('Delete lead:', leadId);
      }
    });
  }
}