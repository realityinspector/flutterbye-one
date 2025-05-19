/**
 * CallService - Business logic for call operations
 * Provides a unified interface for all call-related functionality
 */
class CallService {
  /**
   * Create a new CallService instance
   * @param {APIClient} apiClient - API client instance
   * @param {StorageManager} storageManager - Storage manager instance
   */
  constructor(apiClient, storageManager) {
    this.apiClient = apiClient;
    this.storageManager = storageManager;
    this.cacheKey = 'calls';
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
    this.activeCall = null;
    this.timerInterval = null;
  }

  /**
   * Start a call with a lead
   * @param {number|string} leadId - Lead ID
   * @returns {Promise<Object>} Created call object
   */
  async startCall(leadId) {
    try {
      // Make sure we don't have another active call
      if (this.activeCall) {
        throw new Error('Another call is already in progress');
      }
      
      // Create a new call
      const call = new Call({
        leadId,
        userLeadId: leadId, // Explicitly set userLeadId to match server expectation
        startTime: new Date(),
        status: 'active'
      });
      
      // Send to API
      const response = await this.apiClient.createCall(call.toJSON());
      
      // Set as active call
      this.activeCall = new Call(response.data);
      
      // Start the timer
      this._startTimer();
      
      // Update local cache
      this._updateCallInCache(this.activeCall);
      
      return this.activeCall;
    } catch (error) {
      console.error(`Error starting call for lead ${leadId}:`, error);
      throw error;
    }
  }

  /**
   * End the current active call
   * @param {string} outcome - Call outcome
   * @param {string} notes - Call notes
   * @returns {Promise<Object>} Updated call object
   */
  async endCall(outcome, notes = '') {
    if (!this.activeCall) {
      throw new Error('No active call to end');
    }
    
    try {
      // Stop the timer
      this._stopTimer();
      
      // Update call data
      const endTime = new Date();
      this.activeCall.endTime = endTime;
      this.activeCall.status = 'completed';
      this.activeCall.outcome = outcome;
      this.activeCall.notes = notes;
      this.activeCall.calculateDuration();
      
      // Format and log the request payload
      const payload = this.activeCall.toJSON();
      console.log('Ending call with data:', payload);
      
      // Send to API
      const response = await this.apiClient.updateCall(
        this.activeCall.id, 
        payload
      );
      
      // Handle different response formats
      let completedCall;
      if (response.success && response.data) {
        // Standard success response format
        completedCall = new Call(response.data);
      } else if (response.id) {
        // Direct object response format
        completedCall = new Call(response);
      } else {
        throw new Error('Invalid response format from API');
      }
      
      // Update local cache
      this._updateCallInCache(completedCall);
      
      // Notify about successful completion
      console.log('Call ended successfully:', completedCall);
      
      // Clear active call
      const returnCall = this.activeCall;
      this.activeCall = null;
      
      // Update lead's last contacted timestamp if needed
      try {
        if (this.leadService) {
          await this.leadService.markAsContacted(completedCall.leadId, {
            notes: notes
          });
          console.log('Lead marked as contacted');
        }
      } catch (leadError) {
        console.warn('Could not update lead contact status:', leadError.message);
      }
      
      return completedCall;
    } catch (error) {
      // Enhanced error handling
      console.error('Error ending call:', error);
      
      // Provide more context in the error
      const enhancedError = new Error(`Failed to end call: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.callData = this.activeCall;
      
      throw enhancedError;
    }
  }

  /**
   * Cancel the current active call
   * @param {string} reason - Reason for cancellation
   * @returns {Promise<Object>} Updated call object
   */
  async cancelCall(reason = '') {
    if (!this.activeCall) {
      throw new Error('No active call to cancel');
    }
    
    try {
      // Stop the timer
      this._stopTimer();
      
      // Update call data
      this.activeCall.status = 'canceled';
      this.activeCall.notes = reason;
      
      // Send to API
      const response = await this.apiClient.updateCall(
        this.activeCall.id, 
        this.activeCall.toJSON()
      );
      
      // Update local cache
      const canceledCall = new Call(response.data);
      this._updateCallInCache(canceledCall);
      
      // Clear active call
      const returnCall = this.activeCall;
      this.activeCall = null;
      
      return canceledCall;
    } catch (error) {
      console.error('Error canceling call:', error);
      throw error;
    }
  }

  /**
   * Get all calls for a specific lead or all calls
   * @param {number|string|null} leadId - Lead ID or null for all calls
   * @returns {Promise<Array>} Array of call objects
   */
  async getCallHistory(leadId = null) {
    try {
      // Try to get from cache first
      const useCache = leadId === null;
      if (useCache) {
        const cachedCalls = this._getCallsFromCache();
        if (cachedCalls && cachedCalls.length > 0) {
          return cachedCalls;
        }
      }
      
      // Get from API
      const response = await this.apiClient.getCalls(leadId);
      
      // Update cache if getting all calls
      if (useCache) {
        this._setCachedCalls(response.data);
      }
      
      // Convert to Call objects
      return response.data.map(callData => new Call(callData));
    } catch (error) {
      console.error('Error getting call history:', error);
      throw error;
    }
  }

  /**
   * Get the current active call duration
   * @returns {number} Duration in seconds
   */
  getCurrentCallDuration() {
    if (!this.activeCall || !this.activeCall.startTime) {
      return 0;
    }
    
    return Math.floor((new Date() - this.activeCall.startTime) / 1000);
  }

  /**
   * Check if there is an active call
   * @returns {boolean} True if there is an active call
   */
  hasActiveCall() {
    return this.activeCall !== null;
  }

  /**
   * Get the current active call
   * @returns {Object|null} Active call or null
   */
  getActiveCall() {
    return this.activeCall;
  }

  /**
   * Set up a callback for timer updates
   * @param {Function} callback - Function to call on timer update
   */
  onTimerUpdate(callback) {
    this.timerCallback = callback;
  }

  // Private methods

  /**
   * Start the call timer
   * @private
   */
  _startTimer() {
    // Clear any existing timer
    this._stopTimer();
    
    // Set up a new timer at 1-second intervals
    this.timerInterval = setInterval(() => {
      if (this.timerCallback) {
        this.timerCallback(this.getCurrentCallDuration(), this.activeCall);
      }
    }, 1000);
  }

  /**
   * Stop the call timer
   * @private
   */
  _stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Cache management methods

  /**
   * Get all calls from cache
   * @private
   * @returns {Array|null} Array of calls or null if not in cache
   */
  _getCallsFromCache() {
    return this.storageManager.getCollection(this.cacheKey);
  }

  /**
   * Set all calls in cache
   * @private
   * @param {Array} calls - Array of call data
   */
  _setCachedCalls(calls) {
    const callObjects = calls.map(callData => new Call(callData));
    this.storageManager.setCollection(this.cacheKey, callObjects, this.cacheDuration);
  }

  /**
   * Update a call in the cache
   * @private
   * @param {Object} call - Call object
   */
  _updateCallInCache(call) {
    this.storageManager.updateCollectionItem(this.cacheKey, call);
  }

  /**
   * Clear the call cache
   * @returns {void}
   */
  clearCache() {
    this.storageManager.remove(this.cacheKey);
  }
}