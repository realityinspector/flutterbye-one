/**
 * Lead Model
 * Shared between web and React Native applications
 * 
 * This model provides a consistent data structure and validation
 * for lead information across all platforms.
 */

class Lead {
  /**
   * Create a new Lead instance
   * @param {Object} data - Lead data from API or user input
   * @param {Object} data.globalLead - Core lead data
   * @param {string} data.globalLead.companyName - Company name
   * @param {string} data.globalLead.contactName - Primary contact name
   * @param {string} data.globalLead.phoneNumber - Contact phone number
   * @param {string} data.globalLead.email - Contact email
   * @param {string} data.globalLead.address - Company address
   * @param {string} data.globalLead.industry - Industry type
   * @param {string} data.status - Current lead status
   * @param {number} data.priority - Lead priority (1-5)
   * @param {Array} data.notes - Lead notes
   * @param {Array} data.interactions - History of interactions
   */
  constructor(data = {}) {
    // Default values
    this.id = data.id || null;
    this.globalLead = data.globalLead || { 
      companyName: '',
      contactName: '',
      phoneNumber: '',
      email: '',
      address: '',
      industry: ''
    };
    this.status = data.status || 'new'; // new, contacted, qualified, proposal, closed-won, closed-lost
    this.priority = data.priority || 3; // 1-5 scale, default = medium
    this.notes = data.notes || [];
    this.interactions = data.interactions || [];
    this.lastContact = data.lastContact || null;
    this.nextFollowUp = data.nextFollowUp || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.tags = data.tags || [];
    this.customFields = data.customFields || {};
  }

  /**
   * Validate lead data
   * @returns {boolean} True if valid, throws error if invalid
   */
  validate() {
    // Company name is required
    if (!this.globalLead.companyName || this.globalLead.companyName.trim() === '') {
      throw new Error('Company name is required');
    }
    
    // Status must be a valid status
    const validStatuses = ['new', 'contacted', 'qualified', 'proposal', 'closed-won', 'closed-lost'];
    if (!validStatuses.includes(this.status)) {
      throw new Error(`Invalid status: ${this.status}`);
    }
    
    // Priority must be 1-5
    if (this.priority < 1 || this.priority > 5) {
      throw new Error('Priority must be between 1 and 5');
    }
    
    // If email is provided, validate format
    if (this.globalLead.email && !this.isValidEmail(this.globalLead.email)) {
      throw new Error('Invalid email format');
    }
    
    return true;
  }
  
  /**
   * Helper to check email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Get the display name for the lead
   * @returns {string} The company name
   */
  getDisplayName() {
    return this.globalLead.companyName;
  }
  
  /**
   * Get the contact name
   * @returns {string} The contact name
   */
  getContactName() {
    return this.globalLead.contactName;
  }
  
  /**
   * Get the phone number
   * @returns {string} The phone number
   */
  getPhoneNumber() {
    return this.globalLead.phoneNumber;
  }
  
  /**
   * Get the email address
   * @returns {string} The email address
   */
  getEmail() {
    return this.globalLead.email;
  }
  
  /**
   * Get the status display text
   * @returns {string} Formatted status text
   */
  getStatusText() {
    const statusMap = {
      'new': 'New',
      'contacted': 'Contacted',
      'qualified': 'Qualified',
      'proposal': 'Proposal',
      'closed-won': 'Closed (Won)',
      'closed-lost': 'Closed (Lost)'
    };
    
    return statusMap[this.status] || this.status;
  }
  
  /**
   * Get CSS class for status
   * @returns {string} CSS class name
   */
  getStatusClass() {
    const classMap = {
      'new': 'status-new',
      'contacted': 'status-contacted',
      'qualified': 'status-qualified',
      'proposal': 'status-proposal',
      'closed-won': 'status-won',
      'closed-lost': 'status-lost'
    };
    
    return classMap[this.status] || 'status-default';
  }
  
  /**
   * Get color for status (for React Native)
   * @returns {string} Color hex code
   */
  getStatusColor() {
    const colorMap = {
      'new': '#3498db', // Blue
      'contacted': '#9b59b6', // Purple
      'qualified': '#2ecc71', // Green
      'proposal': '#f39c12', // Orange
      'closed-won': '#27ae60', // Dark Green
      'closed-lost': '#e74c3c' // Red
    };
    
    return colorMap[this.status] || '#7f8c8d'; // Default gray
  }
  
  /**
   * Check if calls can be made to this lead
   * @returns {boolean} True if calls are possible
   */
  canMakeCall() {
    return Boolean(this.globalLead.phoneNumber);
  }
  
  /**
   * Add a note to the lead
   * @param {string} noteText - The note text
   * @param {string} author - Author of the note
   * @returns {Object} The added note
   */
  addNote(noteText, author) {
    const note = {
      id: Date.now(),
      text: noteText,
      author: author,
      createdAt: new Date()
    };
    
    this.notes.push(note);
    this.updatedAt = new Date();
    
    return note;
  }
  
  /**
   * Convert to JSON for API
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      globalLead: this.globalLead,
      status: this.status,
      priority: this.priority,
      notes: this.notes,
      interactions: this.interactions,
      lastContact: this.lastContact,
      nextFollowUp: this.nextFollowUp,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      tags: this.tags,
      customFields: this.customFields
    };
  }
  
  /**
   * Create a Lead instance from JSON
   * @param {Object} data - JSON data
   * @returns {Lead} A new Lead instance
   */
  static fromJSON(data) {
    return new Lead(data);
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Lead };
} else {
  // For browser
  window.Lead = Lead;
}