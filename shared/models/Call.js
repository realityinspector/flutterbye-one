/**
 * Call Model
 * Shared between web and React Native applications
 * 
 * This model provides a consistent data structure and validation
 * for call information across all platforms.
 */

class Call {
  /**
   * Create a new Call instance
   * @param {Object} data - Call data from API or user input
   * @param {number} data.leadId - ID of the lead associated with this call
   * @param {Date|string} data.startTime - When the call started
   * @param {Date|string} data.endTime - When the call ended (optional)
   * @param {string} data.status - Call status
   * @param {string} data.outcome - Call outcome (optional)
   * @param {string} data.notes - Call notes (optional)
   * @param {string} data.direction - Call direction (inbound/outbound)
   * @param {number} data.duration - Call duration in seconds (optional)
   */
  constructor(data = {}) {
    this.id = data.id || null;
    this.leadId = data.leadId || null;
    this.userId = data.userId || null;
    
    // Parse dates if they're strings
    this.startTime = data.startTime ? new Date(data.startTime) : null;
    this.endTime = data.endTime ? new Date(data.endTime) : null;
    
    this.status = data.status || 'scheduled'; // scheduled, active, completed, missed, cancelled
    this.outcome = data.outcome || null; // interested, not-interested, callback, no-answer, etc.
    this.notes = data.notes || '';
    this.direction = data.direction || 'outbound'; // inbound, outbound
    this.recordingUrl = data.recordingUrl || null;
    
    // Duration can be provided directly or calculated
    this.duration = data.duration || this.calculateDuration();
    
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    
    // For integration with call systems
    this.callId = data.callId || null; // external call system ID
    this.callMetadata = data.callMetadata || {};
  }
  
  /**
   * Validate call data
   * @returns {boolean} True if valid, throws error if invalid
   */
  validate() {
    // Lead ID is required
    if (!this.leadId) {
      throw new Error('Lead ID is required');
    }
    
    // Start time is required
    if (!this.startTime) {
      throw new Error('Start time is required');
    }
    
    // Status must be valid
    const validStatuses = ['scheduled', 'active', 'completed', 'missed', 'cancelled'];
    if (!validStatuses.includes(this.status)) {
      throw new Error(`Invalid status: ${this.status}`);
    }
    
    // If completed, end time is required
    if (this.status === 'completed' && !this.endTime) {
      throw new Error('End time is required for completed calls');
    }
    
    // Direction must be valid
    const validDirections = ['inbound', 'outbound'];
    if (!validDirections.includes(this.direction)) {
      throw new Error(`Invalid direction: ${this.direction}`);
    }
    
    return true;
  }
  
  /**
   * Calculate call duration in seconds
   * @returns {number} Duration in seconds, or 0 if cannot calculate
   */
  calculateDuration() {
    if (this.startTime && this.endTime) {
      const durationMs = this.endTime.getTime() - this.startTime.getTime();
      return Math.floor(durationMs / 1000); // Convert to seconds
    }
    
    return this.duration || 0;
  }
  
  /**
   * Format duration for display (MM:SS)
   * @returns {string} Formatted duration
   */
  getFormattedDuration() {
    const duration = this.calculateDuration();
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  /**
   * Check if the call is active
   * @returns {boolean} True if call is active
   */
  isActive() {
    return this.status === 'active';
  }
  
  /**
   * Check if the call is completed
   * @returns {boolean} True if call is completed
   */
  isCompleted() {
    return this.status === 'completed';
  }
  
  /**
   * Get the status display text
   * @returns {string} Formatted status text
   */
  getStatusText() {
    const statusMap = {
      'scheduled': 'Scheduled',
      'active': 'In Progress',
      'completed': 'Completed',
      'missed': 'Missed',
      'cancelled': 'Cancelled'
    };
    
    return statusMap[this.status] || this.status;
  }
  
  /**
   * Get the outcome display text
   * @returns {string} Formatted outcome text
   */
  getOutcomeText() {
    if (!this.outcome) return '';
    
    const outcomeMap = {
      'interested': 'Interested',
      'not-interested': 'Not Interested',
      'callback': 'Callback Scheduled',
      'no-answer': 'No Answer',
      'voicemail': 'Left Voicemail',
      'wrong-number': 'Wrong Number',
      'sale': 'Sale Made',
      'meeting': 'Meeting Scheduled'
    };
    
    return outcomeMap[this.outcome] || this.outcome;
  }
  
  /**
   * Get CSS class for status
   * @returns {string} CSS class name
   */
  getStatusClass() {
    const classMap = {
      'scheduled': 'status-scheduled',
      'active': 'status-active',
      'completed': 'status-completed',
      'missed': 'status-missed',
      'cancelled': 'status-cancelled'
    };
    
    return classMap[this.status] || 'status-default';
  }
  
  /**
   * Get color for status (for React Native)
   * @returns {string} Color hex code
   */
  getStatusColor() {
    const colorMap = {
      'scheduled': '#3498db', // Blue
      'active': '#f39c12', // Orange
      'completed': '#2ecc71', // Green
      'missed': '#e74c3c', // Red
      'cancelled': '#95a5a6' // Gray
    };
    
    return colorMap[this.status] || '#7f8c8d'; // Default gray
  }
  
  /**
   * Start the call
   * Sets status to active and updates start time
   */
  start() {
    this.status = 'active';
    this.startTime = new Date();
    this.updatedAt = new Date();
  }
  
  /**
   * End the call
   * @param {string} outcome - Call outcome
   * @param {string} notes - Call notes
   */
  end(outcome, notes = '') {
    this.status = 'completed';
    this.endTime = new Date();
    this.outcome = outcome;
    this.notes = notes;
    this.duration = this.calculateDuration();
    this.updatedAt = new Date();
  }
  
  /**
   * Cancel the call
   * @param {string} reason - Cancellation reason
   */
  cancel(reason = '') {
    this.status = 'cancelled';
    this.notes = reason ? `Cancelled: ${reason}` : this.notes;
    this.updatedAt = new Date();
  }
  
  /**
   * Mark as missed
   */
  markAsMissed() {
    this.status = 'missed';
    this.endTime = new Date();
    this.updatedAt = new Date();
  }
  
  /**
   * Add notes to the call
   * @param {string} notes - Notes to add
   */
  addNotes(notes) {
    this.notes = notes;
    this.updatedAt = new Date();
  }
  
  /**
   * Convert to JSON for API
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      leadId: this.leadId,
      userId: this.userId,
      startTime: this.startTime,
      endTime: this.endTime,
      status: this.status,
      outcome: this.outcome,
      notes: this.notes,
      direction: this.direction,
      duration: this.calculateDuration(),
      recordingUrl: this.recordingUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      callId: this.callId,
      callMetadata: this.callMetadata
    };
  }
  
  /**
   * Create a Call instance from JSON
   * @param {Object} data - JSON data
   * @returns {Call} A new Call instance
   */
  static fromJSON(data) {
    return new Call(data);
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Call };
} else {
  // For browser
  window.Call = Call;
}