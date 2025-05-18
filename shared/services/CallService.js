/**
 * Call Service
 * Shared between web and React Native applications
 * 
 * This service provides business logic for managing calls, ensuring
 * the same functionality across all platforms.
 */

// Import models to ensure consistent data structure
import { Call } from '../models/Call';
import { Lead } from '../models/Lead';

class CallService {
  /**
   * Create a new Call Service
   * @param {Object} apiClient - API client for data communication
   * @param {Object} storageManager - Storage for caching data
   */
  constructor(apiClient, storageManager) {
    this.apiClient = apiClient;
    this.storageManager = storageManager;
    this.cacheKey = 'calls';
    this.activeCallKey = 'activeCall';
    this.callTimerCallbacks = [];
    this.timerInterval = null;
    this.timerStartTime = null;
  }

  /**
   * Start a call with a lead
   * @param {number} leadId - ID of the lead to call
   * @returns {Promise<Call>} Created call object
   */
  async startCall(leadId) {
    try {
      // Create a new Call object
      const call = new Call({
        leadId,
        startTime: new Date(),
        status: 'active',
        direction: 'outbound'
      });
      
      // Validate the call data
      call.validate();
      
      // Send to API
      const createdCall = await this.apiClient.createCall(call);
      
      // Save as active call
      await this.storageManager.set(this.activeCallKey, createdCall.toJSON());
      
      // Start timer
      this.startTimer();
      
      return createdCall;
    } catch (error) {
      console.error('Call start error:', error);
      throw new Error(`Failed to start call: ${error.message}`);
    }
  }

  /**
   * End the active call
   * @param {string} outcome - Call outcome
   * @param {string} notes - Call notes
   * @returns {Promise<Call>} Updated call object
   */
  async endCall(outcome = null, notes = '') {
    try {
      // Get the active call
      const activeCall = await this.getActiveCall();
      
      if (!activeCall) {
        throw new Error('No active call to end');
      }
      
      // Update the call
      const updatedCall = new Call({
        ...activeCall,
        endTime: new Date(),
        status: 'completed',
        outcome: outcome,
        notes: notes,
        duration: this.calculateCurrentDuration()
      });
      
      // Send to API
      const savedCall = await this.apiClient.updateCall(updatedCall.id, updatedCall.toJSON());
      
      // Clear active call
      await this.storageManager.remove(this.activeCallKey);
      
      // Stop timer
      this.stopTimer();
      
      // Update cache
      await this.updateCache();
      
      return savedCall;
    } catch (error) {
      console.error('Call end error:', error);
      throw new Error(`Failed to end call: ${error.message}`);
    }
  }

  /**
   * Cancel the active call
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Call>} Updated call object
   */
  async cancelCall(reason = '') {
    try {
      // Get the active call
      const activeCall = await this.getActiveCall();
      
      if (!activeCall) {
        throw new Error('No active call to cancel');
      }
      
      // Update the call
      const updatedCall = new Call({
        ...activeCall,
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : activeCall.notes,
        duration: this.calculateCurrentDuration()
      });
      
      // Send to API
      const savedCall = await this.apiClient.updateCall(updatedCall.id, updatedCall.toJSON());
      
      // Clear active call
      await this.storageManager.remove(this.activeCallKey);
      
      // Stop timer
      this.stopTimer();
      
      // Update cache
      await this.updateCache();
      
      return savedCall;
    } catch (error) {
      console.error('Call cancel error:', error);
      throw new Error(`Failed to cancel call: ${error.message}`);
    }
  }

  /**
   * Get call history
   * @param {number} leadId - Optional lead ID to filter by
   * @returns {Promise<Call[]>} Array of call objects
   */
  async getCallHistory(leadId = null) {
    try {
      // Try to get from cache first for instant display
      const cachedCalls = await this.getCachedCalls();
      
      // Filter by lead ID if provided
      let filteredCalls = cachedCalls;
      if (leadId) {
        filteredCalls = cachedCalls.filter(call => call.leadId === leadId);
      }
      
      // Save reference to this for async context
      const self = this;
      
      // Fetch fresh data from API
      this.apiClient.getCalls(leadId)
        .then(calls => {
          // Update cache with fresh data in the background
          self.storageManager.set(self.cacheKey, calls.map(call => call.toJSON()));
        })
        .catch(error => {
          console.warn('Background call fetch error:', error);
        });
      
      // Return cached data
      return filteredCalls.map(callData => new Call(callData));
    } catch (error) {
      console.error('Call history error:', error);
      
      // If cache retrieval fails, try direct API call
      try {
        const calls = await this.apiClient.getCalls(leadId);
        return calls;
      } catch (apiError) {
        throw new Error(`Failed to get call history: ${apiError.message}`);
      }
    }
  }

  /**
   * Get the active call if one exists
   * @returns {Promise<Call|null>} Active call or null
   */
  async getActiveCall() {
    const activeCallData = await this.storageManager.get(this.activeCallKey);
    return activeCallData ? new Call(activeCallData) : null;
  }

  /**
   * Check if there is an active call
   * @returns {Promise<boolean>} True if there is an active call
   */
  async hasActiveCall() {
    const activeCall = await this.getActiveCall();
    return activeCall !== null && activeCall.isActive();
  }

  /**
   * Update the local cache of calls
   * @returns {Promise<void>}
   */
  async updateCache() {
    try {
      // Fetch fresh data from API
      const calls = await this.apiClient.getCalls();
      
      // Update cache
      await this.storageManager.set(this.cacheKey, calls.map(call => call.toJSON()));
    } catch (error) {
      console.warn('Cache update error:', error);
      // Not throwing error here since this is a background operation
    }
  }

  /**
   * Get calls from cache
   * @returns {Promise<Object[]>} Array of call data objects
   */
  async getCachedCalls() {
    const cachedCalls = await this.storageManager.get(this.cacheKey);
    return cachedCalls || [];
  }

  /**
   * Start the call timer
   */
  startTimer() {
    // Clear any existing timer
    this.stopTimer();
    
    // Set start time
    this.timerStartTime = Date.now();
    
    // Start interval to update timer
    this.timerInterval = setInterval(() => {
      // Notify all callbacks of timer update
      this.callTimerCallbacks.forEach(callback => {
        callback(this.calculateCurrentDuration());
      });
    }, 1000);
  }

  /**
   * Stop the call timer
   */
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.timerStartTime = null;
  }

  /**
   * Calculate current call duration in seconds
   * @returns {number} Duration in seconds
   */
  calculateCurrentDuration() {
    if (!this.timerStartTime) return 0;
    
    const elapsed = Date.now() - this.timerStartTime;
    return Math.floor(elapsed / 1000);
  }

  /**
   * Get the current call duration
   * @returns {number} Duration in seconds
   */
  getCurrentCallDuration() {
    return this.calculateCurrentDuration();
  }

  /**
   * Register a callback for timer updates
   * @param {Function} callback - Function to call on timer updates
   * @returns {Function} Function to unregister the callback
   */
  onTimerUpdate(callback) {
    this.callTimerCallbacks.push(callback);
    
    // Return function to remove this callback
    return () => {
      this.callTimerCallbacks = this.callTimerCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Get daily call statistics
   * @param {Date} date - Date to get statistics for
   * @returns {Promise<Object>} Call statistics
   */
  async getDailyCallStats(date = new Date()) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Get all calls
      const calls = await this.getCallHistory();
      
      // Filter for calls on the specified date
      const callsOnDate = calls.filter(call => {
        const callDate = new Date(call.startTime);
        return callDate >= startOfDay && callDate <= endOfDay;
      });
      
      // Calculate statistics
      const totalCalls = callsOnDate.length;
      const completedCalls = callsOnDate.filter(call => call.isCompleted()).length;
      const missedCalls = callsOnDate.filter(call => call.status === 'missed').length;
      const cancelledCalls = callsOnDate.filter(call => call.status === 'cancelled').length;
      
      // Calculate total duration
      const totalDuration = callsOnDate.reduce((sum, call) => {
        return sum + (call.duration || 0);
      }, 0);
      
      // Group by outcome
      const outcomeStats = {};
      callsOnDate.forEach(call => {
        if (!call.outcome) return;
        
        outcomeStats[call.outcome] = (outcomeStats[call.outcome] || 0) + 1;
      });
      
      return {
        date: startOfDay,
        totalCalls,
        completedCalls,
        missedCalls,
        cancelledCalls,
        totalDuration,
        outcomeStats
      };
    } catch (error) {
      console.error('Daily call stats error:', error);
      throw new Error(`Failed to get daily call statistics: ${error.message}`);
    }
  }
}

// Export for both web and React Native
export { CallService };