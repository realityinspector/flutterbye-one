/**
 * Lead Card Component
 * Web version that uses the same shared Lead model as React Native
 */

class LeadCard {
  /**
   * Create a new LeadCard component
   * @param {Lead} lead - Lead model instance
   * @param {Object} options - Component options
   * @param {Function} options.onCall - Callback when call button is clicked
   * @param {Function} options.onEdit - Callback when edit button is clicked
   * @param {Function} options.onDelete - Callback when delete button is clicked
   * @param {boolean} options.compact - Whether to use compact mode
   */
  constructor(lead, options = {}) {
    // Ensure we're working with a Lead model instance
    this.lead = lead instanceof Lead ? lead : new Lead(lead);
    this.options = {
      onCall: null,
      onEdit: null,
      onDelete: null,
      compact: false,
      ...options
    };
    this.element = null;
  }

  /**
   * Format priority as stars HTML
   * @returns {string} HTML for priority stars
   */
  formatPriorityStars() {
    const fullStar = '<span class="priority-star full">★</span>';
    const emptyStar = '<span class="priority-star empty">☆</span>';
    
    return Array(5)
      .fill('')
      .map((_, index) => index < this.lead.priority ? fullStar : emptyStar)
      .join('');
  }

  /**
   * Render the lead card
   * @returns {string} HTML for lead card
   */
  render() {
    // Use compact mode if specified
    if (this.options.compact) {
      return this.renderCompact();
    }
    
    return `
      <div class="lead-card" data-lead-id="${this.lead.id}">
        <div class="lead-card-header">
          <h3 class="lead-company-name">${this.lead.getDisplayName()}</h3>
          <span class="lead-status ${this.lead.getStatusClass()}">${this.lead.getStatusText()}</span>
        </div>
        
        <div class="lead-card-content">
          ${this.lead.getContactName() ? `
            <div class="lead-info-row">
              <i class="icon icon-person"></i>
              <span>${this.lead.getContactName()}</span>
            </div>
          ` : ''}
          
          ${this.lead.getPhoneNumber() ? `
            <div class="lead-info-row">
              <i class="icon icon-phone"></i>
              <span>${this.lead.getPhoneNumber()}</span>
            </div>
          ` : ''}
          
          ${this.lead.getEmail() ? `
            <div class="lead-info-row">
              <i class="icon icon-email"></i>
              <span>${this.lead.getEmail()}</span>
            </div>
          ` : ''}
          
          <div class="lead-priority">
            <span>Priority:</span>
            <div class="priority-stars">
              ${this.formatPriorityStars()}
            </div>
          </div>
          
          ${this.lead.lastContact ? `
            <div class="lead-last-contact">
              Last Contact: ${new Date(this.lead.lastContact).toLocaleDateString()}
            </div>
          ` : ''}
        </div>
        
        <div class="lead-card-actions">
          ${this.lead.canMakeCall() ? `
            <button class="btn btn-call" data-action="call">
              <i class="icon icon-call"></i> Call
            </button>
          ` : ''}
          
          <button class="btn btn-edit" data-action="edit">
            <i class="icon icon-edit"></i> Edit
          </button>
          
          <button class="btn btn-delete" data-action="delete">
            <i class="icon icon-delete"></i> Delete
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render compact version of the lead card
   * @returns {string} HTML for compact lead card
   */
  renderCompact() {
    return `
      <div class="lead-card-compact" data-lead-id="${this.lead.id}">
        <div class="lead-card-compact-content">
          <div class="lead-company-name">${this.lead.getDisplayName()}</div>
          ${this.lead.getContactName() ? `
            <div class="lead-contact-name">${this.lead.getContactName()}</div>
          ` : ''}
        </div>
        <span class="lead-status ${this.lead.getStatusClass()}">${this.lead.getStatusText()}</span>
      </div>
    `;
  }

  /**
   * Attach the card to a container element
   * @param {HTMLElement|string} container - Container element or selector
   */
  attachTo(container) {
    // Find the container if a selector was provided
    const containerElement = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    // Create the card element
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = this.render();
    this.element = tempContainer.firstElementChild;
    
    // Attach event listeners
    this.attachEventListeners();
    
    // Append to container
    containerElement.appendChild(this.element);
    
    return this.element;
  }

  /**
   * Update the card with new lead data
   * @param {Lead} lead - New lead data
   */
  update(lead) {
    this.lead = lead instanceof Lead ? lead : new Lead(lead);
    
    if (this.element) {
      // Replace the current element with a new one
      const newElement = this.attachTo(this.element.parentNode);
      this.element.parentNode.removeChild(this.element);
      this.element = newElement;
    }
  }

  /**
   * Attach event listeners to the card
   */
  attachEventListeners() {
    if (!this.element) return;
    
    // Call button
    const callButton = this.element.querySelector('[data-action="call"]');
    if (callButton && this.options.onCall) {
      callButton.addEventListener('click', (event) => {
        event.preventDefault();
        this.options.onCall(this.lead);
      });
    }
    
    // Edit button
    const editButton = this.element.querySelector('[data-action="edit"]');
    if (editButton && this.options.onEdit) {
      editButton.addEventListener('click', (event) => {
        event.preventDefault();
        this.options.onEdit(this.lead);
      });
    }
    
    // Delete button
    const deleteButton = this.element.querySelector('[data-action="delete"]');
    if (deleteButton && this.options.onDelete) {
      deleteButton.addEventListener('click', (event) => {
        event.preventDefault();
        this.options.onDelete(this.lead);
      });
    }
    
    // Compact card clickable
    if (this.options.compact && this.options.onClick) {
      this.element.addEventListener('click', () => {
        this.options.onClick(this.lead);
      });
    }
  }

  /**
   * Remove the card from the DOM
   */
  remove() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LeadCard };
}