/**
 * FLUTTERBYE CRM - Call Tracking System
 * Simplified implementation for call tracking with lead cards
 */

document.addEventListener('DOMContentLoaded', function() {
  // Add call tracking UI to the page
  addCallTrackingUI();
  
  // Add styles for call tracking
  addCallTrackingStyles();
  
  // Set up global call handler
  window.startCall = function(leadId, contactName, companyName, contactPhone) {
    // Show call interface
    showCallInterface(leadId, contactName, companyName, contactPhone);
  };
});

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
  
  // Set up event listeners
  setupCallEventListeners();
}

/**
 * Add styles for call tracking
 */
function addCallTrackingStyles() {
  const style = document.createElement('style');
  style.textContent = `
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
 * Set up event listeners for call tracking
 */
function setupCallEventListeners() {
  // Variables for call timer
  let callTimerInterval;
  let seconds = 0;
  let minutes = 0;
  let currentLeadId = null;
  
  // End call button
  const endCallButton = document.getElementById('endCallButton');
  if (endCallButton) {
    endCallButton.addEventListener('click', function() {
      // Stop the timer
      clearInterval(callTimerInterval);
      
      // Hide call UI
      document.querySelector('.call-body').style.display = 'none';
      document.querySelector('.call-actions').style.display = 'none';
      
      // Show after-call form
      document.getElementById('afterCallForm').classList.add('active');
      
      // Set call duration in form
      document.getElementById('callDuration').value = document.getElementById('callTimer').textContent;
      
      // Copy notes to after-call form
      const callNotes = document.getElementById('callNotes').value;
      document.getElementById('afterCallNotes').value = callNotes;
      
      // Set default status to 'contacted'
      const contactedStatus = document.querySelector('.status-highlight[data-status="contacted"]');
      if (contactedStatus) {
        document.querySelectorAll('.status-highlight').forEach(el => el.classList.remove('active'));
        contactedStatus.classList.add('active');
      }
      
      // Change title
      document.querySelector('.call-title').textContent = 'Call Summary';
    });
  }
  
  // Mute button
  const muteButton = document.getElementById('muteButton');
  if (muteButton) {
    muteButton.addEventListener('click', function() {
      const isMuted = this.querySelector('span').textContent === 'Unmute';
      
      if (isMuted) {
        this.querySelector('span').textContent = 'Mute';
        this.querySelector('i').className = 'fas fa-microphone-slash';
      } else {
        this.querySelector('span').textContent = 'Unmute';
        this.querySelector('i').className = 'fas fa-microphone';
      }
    });
  }
  
  // Hold button
  const holdButton = document.getElementById('holdButton');
  if (holdButton) {
    holdButton.addEventListener('click', function() {
      const isOnHold = this.querySelector('span').textContent === 'Resume';
      
      if (isOnHold) {
        this.querySelector('span').textContent = 'Hold';
        this.querySelector('i').className = 'fas fa-pause';
      } else {
        this.querySelector('span').textContent = 'Resume';
        this.querySelector('i').className = 'fas fa-play';
      }
    });
  }
  
  // Status highlight selection
  document.querySelectorAll('.status-highlight').forEach(highlight => {
    highlight.addEventListener('click', function() {
      // Remove active class from all
      document.querySelectorAll('.status-highlight').forEach(el => {
        el.classList.remove('active');
      });
      
      // Add active to clicked
      this.classList.add('active');
    });
  });
  
  // Save call data
  const saveCallButton = document.getElementById('saveCallButton');
  if (saveCallButton) {
    saveCallButton.addEventListener('click', function() {
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
      closeCallOverlay();
    });
  }
  
  // Cancel button
  const cancelButton = document.getElementById('cancelAfterCallButton');
  if (cancelButton) {
    cancelButton.addEventListener('click', function() {
      closeCallOverlay();
    });
  }
  
  // Function to update lead status
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
        statusPill.textContent = status;
      }
    }
  }
  
  // Function to close call overlay
  function closeCallOverlay() {
    // Hide overlay
    document.getElementById('callOverlay').classList.remove('active');
    
    // Reset form after a short delay
    setTimeout(function() {
      // Reset UI state
      document.querySelector('.call-body').style.display = 'flex';
      document.querySelector('.call-actions').style.display = 'flex';
      document.getElementById('afterCallForm').classList.remove('active');
      
      // Reset title and timer
      document.querySelector('.call-title').textContent = 'Call in Progress';
      document.getElementById('callTimer').textContent = '00:00';
      
      // Clear form fields
      document.getElementById('callNotes').value = '';
      document.getElementById('afterCallNotes').value = '';
      
      // Reset status highlights
      document.querySelectorAll('.status-highlight').forEach(el => {
        el.classList.remove('active');
      });
      
      // Reset current lead
      currentLeadId = null;
    }, 300);
  }
  
  // Function to show call interface
  window.showCallInterface = function(leadId, contactName, companyName, contactPhone) {
    // Set current lead ID
    currentLeadId = leadId;
    
    // Reset timer
    clearInterval(callTimerInterval);
    seconds = 0;
    minutes = 0;
    document.getElementById('callTimer').textContent = '00:00';
    
    // Update contact info
    document.getElementById('callContactName').textContent = contactName;
    document.getElementById('callCompanyName').textContent = companyName;
    document.getElementById('callContactPhone').textContent = contactPhone;
    
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
}