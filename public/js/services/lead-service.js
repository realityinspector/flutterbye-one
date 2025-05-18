/**
 * LeadService - Business logic for lead operations
 * Provides a unified interface for all lead-related functionality
 */
class LeadService {
  /**
   * Create a new LeadService instance
   * @param {APIClient} apiClient - API client instance
   * @param {StorageManager} storageManager - Storage manager instance
   */
  constructor(apiClient, storageManager) {
    this.apiClient = apiClient;
    this.storageManager = storageManager;
    this.cacheKey = 'leads';
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Create a new lead
   * @param {Object} leadData - Lead data to create
   * @returns {Promise<Object>} Created lead
   */
  async create(leadData) {
    try {
      // Create a lead object and validate it
      const lead = new Lead(leadData);
      lead.validate();
      
      // Send to API
      const response = await this.apiClient.createLead(lead.toJSON());
      
      // Update local cache
      const createdLead = new Lead(response.data);
      this._updateLeadInCache(createdLead);
      
      return createdLead;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  /**
   * Update an existing lead
   * @param {number|string} id - Lead ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated lead
   */
  async update(id, updateData) {
    try {
      // Get current lead data
      const currentLead = await this.get(id);
      
      // Merge with update data
      const mergedData = { ...currentLead, ...updateData };
      
      // Create a lead object and validate it
      const lead = new Lead(mergedData);
      lead.validate();
      
      // Send to API
      const response = await this.apiClient.updateLead(id, lead.toJSON());
      
      // Update local cache
      const updatedLead = new Lead(response.data);
      this._updateLeadInCache(updatedLead);
      
      return updatedLead;
    } catch (error) {
      console.error(`Error updating lead ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a lead
   * @param {number|string} id - Lead ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    try {
      // Send to API
      await this.apiClient.deleteLead(id);
      
      // Remove from local cache
      this._removeLeadFromCache(id);
      
      return true;
    } catch (error) {
      console.error(`Error deleting lead ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get a single lead by ID
   * @param {number|string} id - Lead ID
   * @returns {Promise<Object>} Lead data
   */
  async get(id) {
    try {
      // Try to get from cache first
      const cachedLead = this._getLeadFromCache(id);
      if (cachedLead) {
        return cachedLead;
      }
      
      // Get from API
      const response = await this.apiClient.getLead(id);
      
      // Update cache
      const lead = new Lead(response.data);
      this._updateLeadInCache(lead);
      
      return lead;
    } catch (error) {
      console.error(`Error getting lead ${id}:`, error);
      throw error;
    }
  }

  /**
   * List leads with optional filters
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Array of leads
   */
  async list(filters = {}) {
    try {
      // Try to get from cache if no filters
      const useCache = Object.keys(filters).length === 0;
      if (useCache) {
        const cachedLeads = this._getLeadsFromCache();
        if (cachedLeads && cachedLeads.length > 0) {
          return cachedLeads;
        }
      }
      
      // Get from API
      const response = await this.apiClient.getLeads(filters);
      
      // Update cache if no filters were used
      if (useCache) {
        this._setCachedLeads(response.data);
      }
      
      // Convert to Lead objects
      return response.data.map(leadData => new Lead(leadData));
    } catch (error) {
      console.error('Error listing leads:', error);
      throw error;
    }
  }

  /**
   * Mark a lead as contacted
   * @param {number|string} id - Lead ID
   * @param {Object} callData - Data about the call
   * @returns {Promise<Object>} Updated lead
   */
  async markAsContacted(id, callData = {}) {
    try {
      // Update the lead
      const updateData = {
        status: 'contacted',
        lastContactedAt: new Date()
      };
      
      // If notes were provided in the call data, add them to the lead
      if (callData.notes) {
        updateData.notes = callData.notes;
      }
      
      return await this.update(id, updateData);
    } catch (error) {
      console.error(`Error marking lead ${id} as contacted:`, error);
      throw error;
    }
  }

  /**
   * Schedule a follow-up for a lead
   * @param {number|string} id - Lead ID
   * @param {Date} date - Follow-up date
   * @returns {Promise<Object>} Updated lead
   */
  async scheduleFollowUp(id, date) {
    try {
      // Validate the date
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error('Invalid follow-up date');
      }
      
      // Update the lead
      return await this.update(id, {
        reminderDate: date
      });
    } catch (error) {
      console.error(`Error scheduling follow-up for lead ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get leads with due reminders
   * @returns {Promise<Array>} Array of leads with due reminders
   */
  async getDueReminders() {
    try {
      // Get all leads first
      const leads = await this.list();
      
      // Filter to those with due reminders
      return leads.filter(lead => lead.isReminderDue());
    } catch (error) {
      console.error('Error getting due reminders:', error);
      throw error;
    }
  }

  /**
   * Update the status of a lead
   * @param {number|string} id - Lead ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated lead
   */
  async updateStatus(id, status) {
    try {
      // Validate the status
      const validStatuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed', 'lost'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}. Valid statuses are: ${validStatuses.join(', ')}`);
      }
      
      // Update the lead
      return await this.update(id, { status });
    } catch (error) {
      console.error(`Error updating status for lead ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update the priority of a lead
   * @param {number|string} id - Lead ID
   * @param {number} priority - New priority (1-5)
   * @returns {Promise<Object>} Updated lead
   */
  async updatePriority(id, priority) {
    try {
      // Validate the priority
      if (priority < 1 || priority > 5 || !Number.isInteger(priority)) {
        throw new Error('Priority must be an integer between 1 and 5');
      }
      
      // Update the lead
      return await this.update(id, { priority });
    } catch (error) {
      console.error(`Error updating priority for lead ${id}:`, error);
      throw error;
    }
  }

  // Cache management methods

  /**
   * Get all leads from cache
   * @private
   * @returns {Array|null} Array of leads or null if not in cache
   */
  _getLeadsFromCache() {
    return this.storageManager.getCollection(this.cacheKey);
  }

  /**
   * Set all leads in cache
   * @private
   * @param {Array} leads - Array of lead data
   */
  _setCachedLeads(leads) {
    const leadObjects = leads.map(leadData => new Lead(leadData));
    this.storageManager.setCollection(this.cacheKey, leadObjects, this.cacheDuration);
  }

  /**
   * Get a single lead from cache
   * @private
   * @param {number|string} id - Lead ID
   * @returns {Object|null} Lead object or null if not in cache
   */
  _getLeadFromCache(id) {
    const leads = this._getLeadsFromCache();
    if (!leads) return null;
    
    return leads.find(lead => lead.id == id) || null;
  }

  /**
   * Update a lead in the cache
   * @private
   * @param {Object} lead - Lead object
   */
  _updateLeadInCache(lead) {
    this.storageManager.updateCollectionItem(this.cacheKey, lead);
  }

  /**
   * Remove a lead from the cache
   * @private
   * @param {number|string} id - Lead ID
   */
  _removeLeadFromCache(id) {
    this.storageManager.removeCollectionItem(this.cacheKey, id);
  }

  /**
   * Clear the lead cache
   * @returns {void}
   */
  clearCache() {
    this.storageManager.remove(this.cacheKey);
  }
}