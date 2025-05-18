/**
 * LeadCard - Unified lead card component
 * Provides a consistent UI for displaying lead information
 */
class LeadCard {
  /**
   * Create a new LeadCard instance
   * @param {Object|Lead} lead - Lead data or Lead instance
   * @param {Object} options - Display options
   */
  constructor(lead, options = {}) {
    // Convert to Lead object if it's not already
    this.lead = lead instanceof Lead ? lead : new Lead(lead);
    
    // Set default options
    this.options = {
      showDetails: true,
      showActions: true,
      showStatus: true,
      showPriority: true,
      compact: false,
      className: '',
      onCall: null,
      onEdit: null,
      onDelete: null,
      onStatusChange: null,
      onPriorityChange: null,
      ...options
    };
    
    // Store element reference
    this.element = null;
  }

  /**
   * Render the lead card
   * @returns {string} HTML string
   */
  render() {
    const lead = this.lead;
    const options = this.options;
    
    // Priority stars HTML
    const priorityStars = this._renderPriorityStars(lead.priority);
    
    // Status badge
    const statusBadge = options.showStatus 
      ? `<span class="lead-status" style="background-color: ${lead.getStatusColor()}">${lead.getStatusText()}</span>` 
      : '';

    // Determine if we should show call button (only if there's a phone number)
    const showCallButton = options.showActions && lead.canMakeCall();
    
    // Construct the card HTML
    const cardHTML = `
      <div class="lead-card ${options.className} ${options.compact ? 'lead-card-compact' : ''}" data-lead-id="${lead.id}">
        <div class="lead-card-header">
          <h3 class="lead-company">${this._escapeHtml(lead.getDisplayName())}</h3>
          ${statusBadge}
        </div>
        
        ${options.showPriority ? `
        <div class="lead-priority">
          ${priorityStars}
        </div>
        ` : ''}
        
        ${options.showDetails ? `
        <div class="lead-details">
          <div class="lead-contact">
            <i class="fas fa-user"></i> ${this._escapeHtml(lead.getContactName())}
          </div>
          
          <div class="lead-phone">
            <i class="fas fa-phone"></i> ${this._escapeHtml(lead.getPhoneNumber())}
          </div>
          
          <div class="lead-email">
            <i class="fas fa-envelope"></i> ${this._escapeHtml(lead.getEmail())}
          </div>
          
          ${lead.lastContactedAt ? `
          <div class="lead-last-contact">
            <i class="fas fa-calendar-check"></i> Last Contact: ${lead.getLastContactedText()}
          </div>
          ` : ''}
          
          ${lead.reminderDate ? `
          <div class="lead-reminder ${lead.isReminderDue() ? 'lead-reminder-due' : ''}">
            <i class="fas fa-bell"></i> Reminder: ${lead.getReminderText()}
          </div>
          ` : ''}
        </div>
        ` : ''}
        
        ${options.showActions ? `
        <div class="lead-actions">
          ${showCallButton ? `<button class="btn btn-call" data-action="call"><i class="fas fa-phone"></i> Call</button>` : ''}
          <button class="btn btn-edit" data-action="edit"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn btn-delete" data-action="delete"><i class="fas fa-trash"></i> Delete</button>
        </div>
        ` : ''}
      </div>
    `;
    
    return cardHTML;
  }

  /**
   * Attach the card to a container element
   * @param {HTMLElement|string} container - Container element or selector
   * @returns {HTMLElement} The lead card element
   */
  attachTo(container) {
    // Get the container element
    const containerElement = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    if (!containerElement) {
      console.error('Container element not found');
      return null;
    }
    
    // Create a temporary div to hold the HTML
    const temp = document.createElement('div');
    temp.innerHTML = this.render().trim();
    
    // Get the card element
    this.element = temp.firstChild;
    
    // Append to container
    containerElement.appendChild(this.element);
    
    // Attach event listeners
    this.attachEventListeners();
    
    return this.element;
  }

  /**
   * Attach event listeners to the card
   */
  attachEventListeners() {
    if (!this.element) return;
    
    // Find all action buttons
    const actionButtons = this.element.querySelectorAll('[data-action]');
    
    // Add click handlers
    actionButtons.forEach(button => {
      const action = button.getAttribute('data-action');
      
      button.addEventListener('click', (event) => {
        event.preventDefault();
        
        // Call the appropriate handler
        switch (action) {
          case 'call':
            if (this.options.onCall) {
              this.options.onCall(this.lead);
            }
            break;
          case 'edit':
            if (this.options.onEdit) {
              this.options.onEdit(this.lead);
            }
            break;
          case 'delete':
            if (this.options.onDelete) {
              this.options.onDelete(this.lead);
            }
            break;
        }
      });
    });
    
    // Add priority stars click handler if enabled
    if (this.options.showPriority && this.options.onPriorityChange) {
      const priorityStars = this.element.querySelectorAll('.priority-star');
      priorityStars.forEach(star => {
        star.addEventListener('click', (event) => {
          const priority = parseInt(event.target.getAttribute('data-priority'), 10);
          this.options.onPriorityChange(this.lead, priority);
        });
      });
    }
  }

  /**
   * Update the lead data and refresh the card
   * @param {Object|Lead} newLeadData - Updated lead data
   */
  update(newLeadData) {
    // Update the lead data
    this.lead = newLeadData instanceof Lead ? newLeadData : new Lead(newLeadData);
    
    // If the card is rendered, replace it
    if (this.element && this.element.parentNode) {
      const parent = this.element.parentNode;
      
      // Create a temporary div to hold the new HTML
      const temp = document.createElement('div');
      temp.innerHTML = this.render().trim();
      
      // Get the new card element
      const newElement = temp.firstChild;
      
      // Replace the old element
      parent.replaceChild(newElement, this.element);
      
      // Update the element reference
      this.element = newElement;
      
      // Re-attach event listeners
      this.attachEventListeners();
    }
  }

  /**
   * Remove the card from the DOM
   */
  remove() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    }
  }

  /**
   * Render priority stars
   * @private
   * @param {number} priority - Lead priority (1-5)
   * @returns {string} HTML string
   */
  _renderPriorityStars(priority) {
    let starsHtml = '';
    
    for (let i = 1; i <= 5; i++) {
      const starClass = i <= priority ? 'priority-star-filled' : 'priority-star-empty';
      starsHtml += `<span class="priority-star ${starClass}" data-priority="${i}">★</span>`;
    }
    
    return starsHtml;
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   * @param {string} html - String to escape
   * @returns {string} Escaped string
   */
  _escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Get the card element
   * @returns {HTMLElement} The lead card element
   */
  getElement() {
    return this.element;
  }

  /**
   * Get the lead data
   * @returns {Lead} The lead object
   */
  getLead() {
    return this.lead;
  }
}