/**
 * FLUTTERBYE CRM - Call Tracking System
 * This script implements a simplified call tracking UI for the card-based lead layout
 */

document.addEventListener('DOMContentLoaded', () => {
  // Add styles for call tracking UI
  const callStyles = document.createElement('style');
  callStyles.textContent = `
    /* Call Tracking UI */
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
    
    .contact-info {
      display: flex;
      flex-direction: column;
    }
    
    .contact-name {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
    
    .contact-company {
      font-size: 14px;
      color: #666;
    }
    
    .contact-phone {
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
    
    .end-call-btn {
      background-color: #dc3545;
      color: white;
    }
    
    .end-call-btn:hover {
      background-color: #c82333;
    }
    
    .hold-call-btn {
      background-color: #ffc107;
      color: #333;
    }
    
    .hold-call-btn:hover {
      background-color: #e0a800;
    }
    
    .mute-call-btn {
      background-color: #6c757d;
      color: white;
    }
    
    .mute-call-btn:hover {
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
    
    .status-highlight {
      border: 2px solid transparent;
      border-radius: 4px;
      padding: 5px;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-block;
      margin: 0 5px 5px 0;
    }
    
    .status-highlight.active {
      background-color: #f0f8ff;
      border-color: #0066ff;
    }
  `;
  document.head.appendChild(callStyles);
  
  // Create call tracking overlay
  const callOverlay = document.createElement('div');
  callOverlay.className = 'call-overlay';
  callOverlay.innerHTML = `
    <div class="call-container">
      <div class="call-header">
        <h3 class="call-title">Call in Progress</h3>
        <div class="call-timer">00:00</div>
      </div>
      <div class="call-body">
        <div class="call-contact">
          <div class="contact-avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="contact-info">
            <div class="contact-name" id="callContactName">Contact Name</div>
            <div class="contact-company" id="callCompanyName">Company Name</div>
            <div class="contact-phone" id="callContactPhone">Phone Number</div>
          </div>
        </div>
        <div class="call-notes">
          <div class="call-notes-label">Call Notes</div>
          <textarea class="call-notes-textarea" placeholder="Take notes during your call..."></textarea>
        </div>
      </div>
      <div class="call-actions">
        <button class="call-button mute-call-btn">
          <i class="fas fa-microphone-slash"></i>
          <span>Mute</span>
        </button>
        <button class="call-button hold-call-btn">
          <i class="fas fa-pause"></i>
          <span>Hold</span>
        </button>
        <button class="call-button end-call-btn">
          <i class="fas fa-phone-slash"></i>
          <span>End Call</span>
        </button>
      </div>
      
      <!-- After Call Form -->
      <div class="after-call-form">
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
          <button class="btn-secondary" id="cancelAfterCall">Cancel</button>
          <button class="btn-primary" id="saveCallData">Save</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(callOverlay);
  
  // Variables to track call state
  let callTimer;
  let callSeconds = 0;
  let callMinutes = 0;
  let callActive = false;
  let currentLeadId = null;
  
  // Call timer function
  function updateCallTimer() {
    callSeconds++;
    if (callSeconds >= 60) {
      callSeconds = 0;
      callMinutes++;
    }
    
    const formattedSeconds = callSeconds < 10 ? `0${callSeconds}` : callSeconds;
    const formattedMinutes = callMinutes < 10 ? `0${callMinutes}` : callMinutes;
    
    document.querySelector('.call-timer').textContent = `${formattedMinutes}:${formattedSeconds}`;
  }
  
  // Function to start a call
  window.startCall = function(leadId, contactName, companyName, contactPhone) {
    // Reset call state
    clearInterval(callTimer);
    callSeconds = 0;
    callMinutes = 0;
    document.querySelector('.call-timer').textContent = '00:00';
    
    // Set current lead
    currentLeadId = leadId;
    
    // Update call UI with lead info
    document.getElementById('callContactName').textContent = contactName || 'Contact Name';
    document.getElementById('callCompanyName').textContent = companyName || 'Company Name';
    document.getElementById('callContactPhone').textContent = contactPhone || 'Phone Number';
    
    // Show call UI and hide after-call form
    document.querySelector('.call-body').style.display = 'flex';
    document.querySelector('.call-actions').style.display = 'flex';
    document.querySelector('.after-call-form').classList.remove('active');
    
    // Show call overlay
    document.querySelector('.call-overlay').classList.add('active');
    
    // Start call timer
    callActive = true;
    callTimer = setInterval(updateCallTimer, 1000);
    
    // Initialize notes field
    document.querySelector('.call-notes-textarea').value = '';
    
    console.log(`Started call with lead ID: ${leadId}`);
  };
  
  // End call button handler
  document.querySelector('.end-call-btn').addEventListener('click', () => {
    // Stop timer
    clearInterval(callTimer);
    callActive = false;
    
    // Hide call UI
    document.querySelector('.call-body').style.display = 'none';
    document.querySelector('.call-actions').style.display = 'none';
    
    // Show after-call form
    document.querySelector('.after-call-form').classList.add('active');
    
    // Set call duration in form
    const duration = document.querySelector('.call-timer').textContent;
    document.getElementById('callDuration').value = duration;
    
    // Copy notes from call to after-call form
    const callNotes = document.querySelector('.call-notes-textarea').value;
    document.getElementById('afterCallNotes').value = callNotes;
    
    // Set title
    document.querySelector('.call-title').textContent = 'Call Summary';
    
    console.log('Call ended, showing after-call form');
  });
  
  // Status highlight selection
  const statusHighlights = document.querySelectorAll('.status-highlight');
  statusHighlights.forEach(highlight => {
    highlight.addEventListener('click', () => {
      // Remove active class from all highlights
      statusHighlights.forEach(h => h.classList.remove('active'));
      
      // Add active class to clicked highlight
      highlight.classList.add('active');
    });
  });
  
  // Cancel after-call form
  document.getElementById('cancelAfterCall').addEventListener('click', () => {
    // Hide call overlay
    document.querySelector('.call-overlay').classList.remove('active');
    
    console.log('After-call form canceled');
  });
  
  // Save call data
  document.getElementById('saveCallData').addEventListener('click', () => {
    // Get form data
    const duration = document.getElementById('callDuration').value;
    const outcome = document.getElementById('callOutcome').value;
    const activeStatus = document.querySelector('.status-highlight.active');
    const status = activeStatus ? activeStatus.getAttribute('data-status') : null;
    const notes = document.getElementById('afterCallNotes').value;
    
    // Prepare call data object
    const callData = {
      leadId: currentLeadId,
      duration,
      outcome,
      status,
      notes,
      timestamp: new Date().toISOString()
    };
    
    console.log('Saving call data:', callData);
    
    // Here you would typically send this data to your backend
    // For now, we'll just log it and close the form
    
    // Hide call overlay
    document.querySelector('.call-overlay').classList.remove('active');
    
    // If we have a status update, update the lead card if present
    if (status && currentLeadId) {
      const leadCard = document.querySelector(`.lead-card[data-id="${currentLeadId}"]`);
      if (leadCard) {
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
    
    // Reset current lead
    currentLeadId = null;
  });
  
  // Mute and hold buttons (demo functionality)
  document.querySelector('.mute-call-btn').addEventListener('click', function() {
    const isMuted = this.querySelector('span').textContent === 'Unmute';
    
    if (isMuted) {
      this.querySelector('span').textContent = 'Mute';
      this.querySelector('i').className = 'fas fa-microphone-slash';
    } else {
      this.querySelector('span').textContent = 'Unmute';
      this.querySelector('i').className = 'fas fa-microphone';
    }
  });
  
  document.querySelector('.hold-call-btn').addEventListener('click', function() {
    const isOnHold = this.querySelector('span').textContent === 'Resume';
    
    if (isOnHold) {
      this.querySelector('span').textContent = 'Hold';
      this.querySelector('i').className = 'fas fa-pause';
    } else {
      this.querySelector('span').textContent = 'Resume';
      this.querySelector('i').className = 'fas fa-play';
    }
  });
});