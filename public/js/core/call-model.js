/**
 * Call Model - Data structure definition and validation
 * Provides a consistent interface for working with call data
 */
class Call {
  constructor(data = {}) {
    // Define default properties
    const defaults = {
      id: null,
      leadId: null,
      userLeadId: null, // Added to match server expectation
      userId: null,
      startTime: null,
      endTime: null,
      duration: null,
      status: 'scheduled', // 'scheduled', 'active', 'completed', 'missed', 'canceled'
      outcome: null, // 'interested', 'not_interested', 'callback', 'no_answer', 'left_voicemail', 'wrong_number'
      notes: '',
      createdAt: null,
      updatedAt: null
    };

    // Merge provided data with defaults
    const mergedData = { ...defaults, ...data };

    // Assign properties to this instance
    Object.assign(this, mergedData);

    // Convert date strings to Date objects
    this.startTime = this.startTime ? new Date(this.startTime) : null;
    this.endTime = this.endTime ? new Date(this.endTime) : null;
    this.createdAt = this.createdAt ? new Date(this.createdAt) : null;
    this.updatedAt = this.updatedAt ? new Date(this.updatedAt) : null;
  }

  /**
   * Validate the call data
   * @returns {boolean} True if valid, throws error if invalid
   */
  validate() {
    const errors = [];

    // Required field validation
    if (!this.leadId) {
      errors.push('Lead ID is required');
    }

    // Status validation
    const validStatuses = ['scheduled', 'active', 'in_progress', 'completed', 'missed', 'canceled'];
    if (!validStatuses.includes(this.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    // Outcome validation for completed calls
    if (this.status === 'completed') {
      const validOutcomes = ['interested', 'not_interested', 'callback', 'no_answer', 'left_voicemail', 'wrong_number'];
      if (!this.outcome || !validOutcomes.includes(this.outcome)) {
        errors.push(`Outcome must be one of: ${validOutcomes.join(', ')}`);
      }
    }

    // Start/end time validation for completed calls
    if (this.status === 'completed') {
      if (!this.startTime) {
        errors.push('Start time is required for completed calls');
      }
      if (!this.endTime) {
        errors.push('End time is required for completed calls');
      }
      if (this.startTime && this.endTime && this.startTime > this.endTime) {
        errors.push('End time cannot be before start time');
      }
    }

    // If any errors, throw with all error messages
    if (errors.length) {
      throw new Error(`Call validation failed: ${errors.join(', ')}`);
    }

    return true;
  }

  /**
   * Serialize to JSON for API
   * @returns {Object} Serialized call data
   */
  toJSON() {
    // Create a clean copy of the object
    const result = {
      id: this.id,
      leadId: this.leadId,
      userLeadId: this.userLeadId || this.leadId, // Use leadId as fallback for backward compatibility
      userId: this.userId,
      startTime: this.startTime ? this.startTime.toISOString() : null,
      endTime: this.endTime ? this.endTime.toISOString() : null,
      duration: this.duration,
      status: this.status,
      outcome: this.outcome,
      notes: this.notes
    };

    // Remove id for new calls
    if (!this.id) {
      delete result.id;
    }

    return result;
  }

  /**
   * Deserialize from API response
   * @param {Object} data - API response data
   * @returns {Call} A new Call instance
   */
  static fromJSON(data) {
    return new Call(data);
  }

  /**
   * Calculate the duration of the call in seconds
   * @returns {number|null} Duration in seconds or null if call is not completed
   */
  calculateDuration() {
    if (this.startTime && this.endTime) {
      this.duration = Math.floor((this.endTime - this.startTime) / 1000);
      return this.duration;
    }
    return null;
  }

  /**
   * Check if the call is completed
   * @returns {boolean} True if call is completed
   */
  isCompleted() {
    return this.status === 'completed';
  }

  /**
   * Check if the call is active
   * @returns {boolean} True if call is active
   */
  isActive() {
    return this.status === 'active' || this.status === 'in_progress';
  }

  /**
   * Check if the call is missed
   * @returns {boolean} True if call is missed
   */
  isMissed() {
    return this.status === 'missed';
  }

  /**
   * Check if the call is scheduled
   * @returns {boolean} True if call is scheduled
   */
  isScheduled() {
    return this.status === 'scheduled';
  }

  /**
   * Check if the call is canceled
   * @returns {boolean} True if call is canceled
   */
  isCanceled() {
    return this.status === 'canceled';
  }

  /**
   * Get a human-readable outcome text
   * @returns {string} Formatted outcome
   */
  getOutcomeText() {
    const outcomeMap = {
      'interested': 'Interested',
      'not_interested': 'Not Interested',
      'callback': 'Callback Requested',
      'no_answer': 'No Answer',
      'left_voicemail': 'Left Voicemail',
      'wrong_number': 'Wrong Number'
    };

    return outcomeMap[this.outcome] || 'Unknown';
  }

  /**
   * Get a human-readable status text
   * @returns {string} Formatted status
   */
  getStatusText() {
    const statusMap = {
      'scheduled': 'Scheduled',
      'active': 'In Progress',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'missed': 'Missed',
      'canceled': 'Canceled'
    };

    return statusMap[this.status] || this.status;
  }

  /**
   * Get a color for the status indicator
   * @returns {string} CSS color value
   */
  getStatusColor() {
    const colors = {
      'scheduled': '#2196F3', // Blue
      'active': '#FF9800',    // Orange
      'in_progress': '#FF9800', // Orange
      'completed': '#4CAF50', // Green
      'missed': '#F44336',    // Red
      'canceled': '#9E9E9E'   // Grey
    };

    return colors[this.status] || '#9E9E9E';
  }

  /**
   * Get a formatted start time
   * @returns {string} Formatted time or "Not started"
   */
  getStartTimeText() {
    if (this.startTime) {
      return this.startTime.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return "Not started";
  }

  /**
   * Get a formatted duration
   * @returns {string} Formatted duration
   */
  getDurationText() {
    if (!this.isCompleted()) {
      return "—";
    }

    if (this.duration === null && this.startTime && this.endTime) {
      this.calculateDuration();
    }

    if (this.duration === null) {
      return "Unknown";
    }

    const minutes = Math.floor(this.duration / 60);
    const seconds = this.duration % 60;

    if (minutes === 0) {
      return `${seconds}s`;
    } else {
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Format call notes with proper truncation
   * @param {number} maxLength - Maximum length before truncation
   * @returns {string} Formatted notes
   */
  getFormattedNotes(maxLength = 100) {
    if (!this.notes) return "No notes";

    if (this.notes.length <= maxLength) {
      return this.notes;
    }

    return this.notes.substring(0, maxLength) + '...';
  }
}