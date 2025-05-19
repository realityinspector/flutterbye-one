/**
 * CallTracker - Unified call tracking component
 * Provides a consistent UI for tracking calls to leads
 */
class CallTracker {
  /**
   * Create a new CallTracker instance
   * @param {number|string} leadId - Lead ID to call
   * @param {CallService} callService - Call service instance
   * @param {Object} options - Display options
   */
  constructor(leadId, callService, options = {}) {
    this.leadId = leadId;
    this.callService = callService;
    this.call = null;
    this.duration = 0;
    this.timerInterval = null;
    
    // Default options
    this.options = {
      containerSelector: '.call-tracker-container',
      onCallStart: null,
      onCallEnd: null,
      onCallCancel: null,
      className: '',
      ...options
    };
    
    // Element references
    this.container = null;
    this.timerElement = null;
    this.statusElement = null;
  }

  /**
   * Initialize the call tracker
   * @returns {Promise<boolean>} Success status
   */
  async init() {
    // Find the container
    if (typeof this.options.containerSelector === 'string') {
      this.container = document.querySelector(this.options.containerSelector);
    } else {
      this.container = this.options.containerSelector;
    }
    
    if (!this.container) {
      console.error('Call tracker container not found');
      return false;
    }
    
    // Create initial UI
    this.container.innerHTML = this.render();
    
    // Get references to elements
    this.timerElement = this.container.querySelector('.call-timer');
    this.statusElement = this.container.querySelector('.call-status');
    
    // Attach event listeners
    this.attachEventListeners();
    
    return true;
  }

  /**
   * Start a call
   * @returns {Promise<boolean>} Success status
   */
  async startCall() {
    try {
      console.log(`CallTracker: Starting call to lead ID ${this.leadId}`);
      
      // Try to start the call using normal service first
      try {
        this.call = await this.callService.startCall(this.leadId);
      } catch (serviceError) {
        console.warn('Regular call start failed, trying direct method:', serviceError);
        
        // If regular method fails, try the direct method we added to the window object
        if (window.makeDirectCall) {
          console.log('Attempting direct call through fallback method');
          this.call = await window.makeDirectCall(this.leadId);
          
          // If direct call succeeded, update the call service state
          if (this.call) {
            this.callService._activeCall = this.call;
          }
        } else {
          throw serviceError; // Re-throw if direct method not available
        }
      }
      
      // Update UI
      this.updateUI();
      
      // Start the timer
      this.startTimer();
      
      // Call the callback
      if (this.options.onCallStart) {
        this.options.onCallStart(this.call);
      }
      
      return true;
    } catch (error) {
      console.error('Error starting call:', error);
      
      // Display a more user-friendly error message
      const errorMessage = error.message || 'Unknown error';
      
      // Handle specific error messages
      let friendlyMessage = 'Failed to start call';
      if (errorMessage.includes('not found') || errorMessage.includes('permission')) {
        friendlyMessage = 'This lead cannot be called. It may not exist or you don\'t have permission to access it.';
      } else if (errorMessage.includes('already in progress')) {
        friendlyMessage = 'Another call is already in progress. Please end that call before starting a new one.';
      } else {
        friendlyMessage = `Failed to start call: ${errorMessage}`;
      }
      
      // Show error message in the UI instead of using alert
      if (this.container) {
        this.container.innerHTML = `
          <div class="call-tracker call-tracker-error" role="region" aria-label="Call error">
            <div class="call-header">
              <h3>Call Error</h3>
            </div>
            <div class="call-info">
              <div class="call-status call-status-error">${friendlyMessage}</div>
            </div>
            <div class="call-actions">
              <button class="btn btn-primary" data-action="return">Return to Leads</button>
            </div>
          </div>
        `;
        
        // Add event listener for the return button
        const returnButton = this.container.querySelector('[data-action="return"]');
        if (returnButton) {
          returnButton.addEventListener('click', () => {
            window.location.href = '/leads.html';
          });
        }
      } else {
        // Fallback to alert if container is not available
        alert(friendlyMessage);
      }
      
      // Call the error callback if provided
      if (this.options.onCallError) {
        this.options.onCallError(error);
      }
      
      return false;
    }
  }

  /**
   * End the current call
   * @param {string} outcome - Call outcome
   * @param {string} notes - Call notes
   * @returns {Promise<boolean>} Success status
   */
  async endCall(outcome, notes = '') {
    try {
      // Make sure there's an active call
      if (!this.call) {
        console.error('No active call to end');
        return false;
      }
      
      // Stop the timer
      this.stopTimer();
      
      // End the call via the service
      const completedCall = await this.callService.endCall(outcome, notes);
      
      // Update UI
      this.call = completedCall;
      this.updateUI();
      
      // Call the callback
      if (this.options.onCallEnd) {
        this.options.onCallEnd(completedCall);
      }
      
      return true;
    } catch (error) {
      console.error('Error ending call:', error);
      alert(`Failed to end call: ${error.message}`);
      return false;
    }
  }

  /**
   * Cancel the current call
   * @param {string} reason - Reason for cancellation
   * @returns {Promise<boolean>} Success status
   */
  async cancelCall(reason = '') {
    try {
      // Make sure there's an active call
      if (!this.call) {
        console.error('No active call to cancel');
        return false;
      }
      
      // Stop the timer
      this.stopTimer();
      
      // Cancel the call via the service
      const canceledCall = await this.callService.cancelCall(reason);
      
      // Update UI
      this.call = canceledCall;
      this.updateUI();
      
      // Call the callback
      if (this.options.onCallCancel) {
        this.options.onCallCancel(canceledCall);
      }
      
      return true;
    } catch (error) {
      console.error('Error canceling call:', error);
      alert(`Failed to cancel call: ${error.message}`);
      return false;
    }
  }

  /**
   * Update the timer display
   */
  updateTimer() {
    if (this.timerElement) {
      this.duration = this.callService.getCurrentCallDuration();
      
      // Format the duration
      const minutes = Math.floor(this.duration / 60);
      const seconds = this.duration % 60;
      
      // Update the display
      this.timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Start the timer
   */
  startTimer() {
    // Clear any existing timer
    this.stopTimer();
    
    // Set up a new timer at 1-second intervals
    this.timerInterval = setInterval(() => {
      this.updateTimer();
    }, 1000);
    
    // Initial update
    this.updateTimer();
  }

  /**
   * Stop the timer
   */
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Update the UI based on current call state
   */
  updateUI() {
    // If there's no container, do nothing
    if (!this.container) return;
    
    // Update based on call state
    if (!this.call) {
      // No call in progress
      this.container.innerHTML = this.render();
      this.timerElement = this.container.querySelector('.call-timer');
      this.statusElement = this.container.querySelector('.call-status');
      this.attachEventListeners();
    } else if (this.call.isActive()) {
      // Call in progress
      this.statusElement.textContent = 'Call in progress';
      this.container.querySelector('.call-actions').innerHTML = `
        <button class="btn btn-end" data-action="end">End Call</button>
        <button class="btn btn-cancel" data-action="cancel">Cancel</button>
      `;
      this.attachEventListeners();
    } else if (this.call.isCompleted()) {
      // Call completed
      this.statusElement.textContent = `Call completed: ${this.call.getOutcomeText()}`;
      this.container.querySelector('.call-actions').innerHTML = `
        <button class="btn btn-new" data-action="new">New Call</button>
      `;
      this.attachEventListeners();
    } else if (this.call.isCanceled()) {
      // Call canceled
      this.statusElement.textContent = 'Call canceled';
      this.container.querySelector('.call-actions').innerHTML = `
        <button class="btn btn-new" data-action="new">New Call</button>
      `;
      this.attachEventListeners();
    }
  }

  /**
   * Render the call tracker UI
   * @returns {string} HTML string
   */
  render() {
    try {
      let html = '';
      
      if (!this.call) {
        // No call in progress
        html = `
          <div class="call-tracker ${this.options.className}" role="region" aria-label="Call tracking interface">
            <div class="call-header">
              <h3 id="call-header-title">Start a Call</h3>
            </div>
            <div class="call-info">
              <div class="call-status" aria-live="polite">Ready to call</div>
              <div class="call-timer" aria-label="Call timer">00:00</div>
            </div>
            <div class="call-actions">
              <button class="btn btn-start" data-action="start" aria-describedby="call-header-title">
                <i class="fas fa-phone-alt" aria-hidden="true"></i> Start Call
              </button>
            </div>
          </div>
        `;
      } else if (this.call.isActive()) {
        // Call in progress
        html = `
          <div class="call-tracker ${this.options.className}" role="region" aria-label="Active call in progress">
            <div class="call-header">
              <h3 id="call-header-active">Call in Progress</h3>
            </div>
            <div class="call-info">
              <div class="call-status" aria-live="polite">Call in progress</div>
              <div class="call-timer" role="timer" aria-label="Call duration" aria-live="polite">00:00</div>
            </div>
            <div class="call-actions">
              <button class="btn btn-end" data-action="end" aria-describedby="call-header-active">
                <i class="fas fa-phone-slash" aria-hidden="true"></i> End Call
              </button>
              <button class="btn btn-cancel" data-action="cancel" aria-describedby="call-header-active">
                <i class="fas fa-times" aria-hidden="true"></i> Cancel
              </button>
            </div>
          </div>
        `;
      } else if (this.call.isCompleted()) {
        // Call completed
        const outcomeText = this.call.getOutcomeText();
        const durationText = this.call.getDurationText();
        
        html = `
          <div class="call-tracker ${this.options.className} call-tracker-completed" role="region" aria-label="Completed call information">
            <div class="call-header">
              <h3 id="call-header-completed">Call Completed</h3>
            </div>
            <div class="call-info">
              <div class="call-status" aria-live="polite">
                <span>Call completed: </span>
                <span class="call-outcome">${outcomeText}</span>
              </div>
              <div class="call-timer" aria-label="Call duration">${durationText}</div>
            </div>
            ${this.call.notes ? `
              <div class="call-notes">
                <h4>Notes:</h4>
                <p>${this._escapeHtml(this.call.notes)}</p>
              </div>
            ` : ''}
            <div class="call-actions">
              <button class="btn btn-new" data-action="new" aria-describedby="call-header-completed">
                <i class="fas fa-phone-alt" aria-hidden="true"></i> New Call
              </button>
            </div>
          </div>
        `;
      } else if (this.call.isCanceled()) {
        // Call canceled
        html = `
          <div class="call-tracker ${this.options.className} call-tracker-canceled" role="region" aria-label="Canceled call information">
            <div class="call-header">
              <h3 id="call-header-canceled">Call Canceled</h3>
            </div>
            <div class="call-info">
              <div class="call-status" aria-live="polite">Call canceled</div>
              <div class="call-timer">00:00</div>
            </div>
            <div class="call-actions">
              <button class="btn btn-new" data-action="new" aria-describedby="call-header-canceled">
                <i class="fas fa-phone-alt" aria-hidden="true"></i> New Call
              </button>
            </div>
          </div>
        `;
      }
      
      return html;
    } catch (error) {
      console.error('Error rendering call tracker:', error);
      
      // Return a fallback UI if rendering fails
      return `
        <div class="call-tracker call-tracker-error" role="region" aria-label="Call tracker error">
          <div class="call-header">
            <h3>Error Loading Call Tracker</h3>
          </div>
          <div class="call-info">
            <div class="call-status call-status-error">There was an error loading the call tracker</div>
          </div>
          <div class="call-actions">
            <button class="btn btn-primary" onclick="window.location.reload()">Refresh</button>
          </div>
        </div>
      `;
    }
  }
  
  /**
   * Escape HTML to prevent XSS
   * @private
   * @param {string} html - String to escape
   * @returns {string} Escaped string
   */
  _escapeHtml(html) {
    if (typeof html !== 'string') {
      return html;
    }
    
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Show call completion dialog
   * @returns {Promise<Object>} Result with outcome and notes
   */
  showCallCompletionDialog() {
    return new Promise((resolve, reject) => {
      // Create modal element
      const modal = document.createElement('div');
      modal.className = 'modal call-completion-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Call Completion</h3>
            <span class="close">&times;</span>
          </div>
          <div class="modal-body">
            <form id="call-completion-form">
              <div class="form-group">
                <label for="call-outcome">Outcome</label>
                <select id="call-outcome" name="outcome" required>
                  <option value="">-- Select Outcome --</option>
                  <option value="interested">Interested</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="callback">Callback Requested</option>
                  <option value="no_answer">No Answer</option>
                  <option value="left_voicemail">Left Voicemail</option>
                  <option value="wrong_number">Wrong Number</option>
                </select>
              </div>
              <div class="form-group">
                <label for="call-notes">Notes</label>
                <textarea id="call-notes" name="notes" rows="4"></textarea>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary">Save</button>
                <button type="button" class="btn btn-cancel">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      `;
      
      // Append modal to document
      document.body.appendChild(modal);
      
      // Set up event listeners
      const closeBtn = modal.querySelector('.close');
      const form = modal.querySelector('#call-completion-form');
      const cancelBtn = modal.querySelector('.btn-cancel');
      
      // Close button
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
        reject(new Error('Dialog closed'));
      });
      
      // Cancel button
      cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
        reject(new Error('Dialog canceled'));
      });
      
      // Form submission
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const outcome = form.elements.outcome.value;
        const notes = form.elements.notes.value;
        
        if (!outcome) {
          alert('Please select an outcome');
          return;
        }
        
        document.body.removeChild(modal);
        resolve({ outcome, notes });
      });
      
      // Show the modal
      setTimeout(() => {
        modal.style.display = 'block';
      }, 10);
    });
  }

  /**
   * Attach event listeners to UI elements
   */
  attachEventListeners() {
    if (!this.container) return;
    
    // Find all action buttons
    const buttons = this.container.querySelectorAll('[data-action]');
    
    // Remove any existing listeners
    buttons.forEach(button => {
      const clone = button.cloneNode(true);
      button.parentNode.replaceChild(clone, button);
    });
    
    // Add new listeners
    this.container.querySelectorAll('[data-action]').forEach(button => {
      const action = button.getAttribute('data-action');
      
      button.addEventListener('click', async (event) => {
        event.preventDefault();
        
        switch (action) {
          case 'start':
            await this.startCall();
            break;
            
          case 'end':
            try {
              const result = await this.showCallCompletionDialog();
              await this.endCall(result.outcome, result.notes);
            } catch (error) {
              console.log('Call completion dialog canceled');
            }
            break;
            
          case 'cancel':
            const reason = prompt('Reason for cancellation (optional):');
            await this.cancelCall(reason || '');
            break;
            
          case 'new':
            // Reset and prepare for a new call
            this.call = null;
            this.updateUI();
            break;
        }
      });
    });
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopTimer();
    
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    this.call = null;
    this.timerElement = null;
    this.statusElement = null;
  }
}