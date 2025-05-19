/**
 * Lead Model - Data structure definition and validation
 * Provides a consistent interface for working with lead data
 */
class Lead {
  constructor(data = {}) {
    // Define default properties
    const defaults = {
      id: null,
      userId: null,
      globalLeadId: null,
      status: 'new',
      priority: 3,
      notes: '',
      lastContactedAt: null,
      reminderDate: null,
      createdAt: null,
      updatedAt: null,
      globalLead: {
        id: null,
        companyName: '',
        contactName: '',
        phoneNumber: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        industry: '',
        website: '',
        createdAt: null,
        updatedAt: null
      },
      organization: null
    };

    // Merge provided data with defaults
    const mergedData = { ...defaults, ...data };

    // If globalLead is provided, merge it with defaults
    if (data.globalLead) {
      mergedData.globalLead = { ...defaults.globalLead, ...data.globalLead };
    }

    // Assign properties to this instance
    Object.assign(this, mergedData);

    // Convert date strings to Date objects
    this.lastContactedAt = this.lastContactedAt ? new Date(this.lastContactedAt) : null;
    this.reminderDate = this.reminderDate ? new Date(this.reminderDate) : null;
    this.createdAt = this.createdAt ? new Date(this.createdAt) : null;
    this.updatedAt = this.updatedAt ? new Date(this.updatedAt) : null;

    if (this.globalLead) {
      this.globalLead.createdAt = this.globalLead.createdAt ? new Date(this.globalLead.createdAt) : null;
      this.globalLead.updatedAt = this.globalLead.updatedAt ? new Date(this.globalLead.updatedAt) : null;
    }
  }

  /**
   * Validate the lead data
   * @returns {boolean} True if valid, throws error if invalid
   */
  validate() {
    const errors = [];

    // Required field validation
    if (!this.globalLead.companyName) {
      errors.push('Company name is required');
    }

    // Status validation
    const validStatuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed', 'lost'];
    if (!validStatuses.includes(this.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    // Priority validation
    if (this.priority < 1 || this.priority > 5 || !Number.isInteger(this.priority)) {
      errors.push('Priority must be an integer between 1 and 5');
    }

    // Email validation if provided
    if (this.globalLead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.globalLead.email)) {
      errors.push('Invalid email format');
    }

    // Website validation if provided
    if (this.globalLead.website && !/^(https?:\/\/)?(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}$/
      .test(this.globalLead.website)) {
      errors.push('Invalid website URL format');
    }

    // If any errors, throw with all error messages
    if (errors.length) {
      throw new Error(`Lead validation failed: ${errors.join(', ')}`);
    }

    return true;
  }

  /**
   * Serialize to JSON for API
   * @returns {Object} Serialized lead data
   */
  toJSON() {
    // Create a clean copy of the object
    const result = {
      id: this.id,
      userId: this.userId,
      globalLeadId: this.globalLeadId,
      status: this.status,
      priority: this.priority,
      notes: this.notes,
      lastContactedAt: this.lastContactedAt ? this.lastContactedAt.toISOString() : null,
      reminderDate: this.reminderDate ? this.reminderDate.toISOString() : null,
      globalLead: { ...this.globalLead }
    };

    // Remove id for new leads
    if (!this.id) {
      delete result.id;
    }

    return result;
  }

  /**
   * Deserialize from API response
   * @param {Object} data - API response data
   * @returns {Lead} A new Lead instance
   */
  static fromJSON(data) {
    return new Lead(data);
  }

  /**
   * Check if this lead can receive a call
   * @returns {boolean} True if lead has a phone number
   */
  canMakeCall() {
    return this.globalLead && 
           this.globalLead.phoneNumber && 
           this.globalLead.phoneNumber.trim() !== '';
  }

  /**
   * Get a display name for the lead
   * @returns {string} Company name or "Unnamed Lead"
   */
  getDisplayName() {
    if (this.globalLead && this.globalLead.companyName) {
      return this.globalLead.companyName;
    }
    return "Unnamed Lead";
  }

  /**
   * Get contact name 
   * @returns {string} Contact name or "No contact"
   */
  getContactName() {
    if (this.globalLead && this.globalLead.contactName) {
      return this.globalLead.contactName;
    }
    return "No contact";
  }

  /**
   * Get a display phone number
   * @returns {string} Phone number or "No phone number"
   */
  getPhoneNumber() {
    if (this.globalLead && this.globalLead.phoneNumber) {
      return this.globalLead.phoneNumber;
    }
    return "No phone number";
  }

  /**
   * Get a display email
   * @returns {string} Email or "No email"
   */
  getEmail() {
    if (this.globalLead && this.globalLead.email) {
      return this.globalLead.email;
    }
    return "No email";
  }

  /**
   * Get a formatted address
   * @returns {string} Formatted address or "No address"
   */
  getAddress() {
    if (this.globalLead) {
      const { address, city, state, zipCode } = this.globalLead;
      if (address || city || state || zipCode) {
        return [
          address,
          [city, state].filter(Boolean).join(', '),
          zipCode
        ].filter(Boolean).join(' ');
      }
    }
    return "No address";
  }

  /**
   * Get a color for the status indicator
   * @returns {string} CSS color value
   */
  getStatusColor() {
    const colors = {
      'new': '#2196F3',         // Blue
      'contacted': '#4CAF50',   // Green
      'qualified': '#9C27B0',   // Purple
      'proposal': '#FF9800',    // Orange
      'negotiation': '#FFC107', // Amber
      'closed': '#4CAF50',      // Green
      'lost': '#F44336'         // Red
    };

    return colors[this.status] || '#9E9E9E'; // Default to grey
  }

  /**
   * Get a human-readable status text
   * @returns {string} Formatted status
   */
  getStatusText() {
    const statusMap = {
      'new': 'New',
      'contacted': 'Contacted',
      'qualified': 'Qualified',
      'proposal': 'Proposal',
      'negotiation': 'Negotiation',
      'closed': 'Closed (Won)',
      'lost': 'Closed (Lost)'
    };

    return statusMap[this.status] || this.status;
  }

  /**
   * Get a formatted date for the last contact
   * @returns {string} Formatted date or "Never contacted"
   */
  getLastContactedText() {
    if (this.lastContactedAt) {
      return this.lastContactedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    return "Never contacted";
  }

  /**
   * Get a formatted reminder date
   * @returns {string} Formatted date or "No reminder set"
   */
  getReminderText() {
    if (this.reminderDate) {
      return this.reminderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    return "No reminder set";
  }

  /**
   * Check if a reminder is due
   * @returns {boolean} True if reminder is due
   */
  isReminderDue() {
    return this.reminderDate && this.reminderDate <= new Date();
  }

  /**
   * Get time since this lead was created
   * @returns {string} Formatted time or "Unknown"
   */
  getAgeText() {
    if (!this.createdAt) return "Unknown";

    const now = new Date();
    const diffInDays = Math.floor((now - this.createdAt) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  }
}