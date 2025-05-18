/**
 * Lead Service
 * Shared between web and React Native applications
 * 
 * This service provides business logic for managing leads, ensuring
 * the same functionality across all platforms.
 */

// Import the Lead model to ensure consistent data structure
import { Lead } from '../models/Lead';

class LeadService {
  /**
   * Create a new Lead Service
   * @param {Object} apiClient - API client for data communication
   * @param {Object} storageManager - Storage for caching data
   */
  constructor(apiClient, storageManager) {
    this.apiClient = apiClient;
    this.storageManager = storageManager;
    this.cacheKey = 'leads';
  }

  /**
   * Create a new lead
   * @param {Object} leadData - Raw lead data
   * @returns {Promise<Lead>} Created lead
   */
  async create(leadData) {
    try {
      // Create a Lead model instance to ensure validation
      const lead = new Lead(leadData);
      
      // Validate the lead data
      lead.validate();
      
      // Send to API
      const createdLead = await this.apiClient.createLead(lead);
      
      // Update local cache
      await this.updateCache();
      
      return createdLead;
    } catch (error) {
      console.error('Lead creation error:', error);
      throw new Error(`Failed to create lead: ${error.message}`);
    }
  }

  /**
   * Update an existing lead
   * @param {number} id - Lead ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Lead>} Updated lead
   */
  async update(id, updateData) {
    try {
      // Send to API
      const updatedLead = await this.apiClient.updateLead(id, updateData);
      
      // Update local cache
      await this.updateCache();
      
      return updatedLead;
    } catch (error) {
      console.error('Lead update error:', error);
      throw new Error(`Failed to update lead: ${error.message}`);
    }
  }

  /**
   * Delete a lead
   * @param {number} id - Lead ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    try {
      // Send to API
      await this.apiClient.deleteLead(id);
      
      // Update local cache
      await this.updateCache();
      
      return true;
    } catch (error) {
      console.error('Lead deletion error:', error);
      throw new Error(`Failed to delete lead: ${error.message}`);
    }
  }

  /**
   * Get a specific lead by ID
   * @param {number} id - Lead ID
   * @returns {Promise<Lead>} Lead object
   */
  async get(id) {
    try {
      // Try to get from cache first for instant display
      const cachedLeads = await this.getCachedLeads();
      const cachedLead = cachedLeads.find(lead => lead.id === id);
      
      if (cachedLead) {
        // Return cached lead
        return new Lead(cachedLead);
      }
      
      // Fetch fresh data if not in cache
      const lead = await this.apiClient.getLead(id);
      return lead;
    } catch (error) {
      console.error('Lead fetch error:', error);
      throw new Error(`Failed to get lead: ${error.message}`);
    }
  }

  /**
   * List leads with optional filters
   * @param {Object} filters - Filters to apply
   * @returns {Promise<Lead[]>} Array of lead objects
   */
  async list(filters = {}) {
    try {
      // Try to get from cache first for instant display
      const cachedLeads = await this.getCachedLeads();
      
      // Apply filters to cached data
      const filteredCachedLeads = this.applyFilters(cachedLeads, filters);
      
      // Save reference to this for async context
      const self = this;
      
      // Fetch fresh data from API
      this.apiClient.getLeads(filters)
        .then(leads => {
          // Update cache with fresh data in the background
          self.storageManager.set(self.cacheKey, leads.map(lead => lead.toJSON()));
        })
        .catch(error => {
          console.warn('Background lead fetch error:', error);
        });
      
      // Return cached data
      return filteredCachedLeads.map(leadData => new Lead(leadData));
    } catch (error) {
      console.error('Lead list error:', error);
      
      // If cache retrieval fails, try direct API call
      try {
        const leads = await this.apiClient.getLeads(filters);
        return leads;
      } catch (apiError) {
        throw new Error(`Failed to get leads: ${apiError.message}`);
      }
    }
  }

  /**
   * Update the local cache of leads
   * @returns {Promise<void>}
   */
  async updateCache() {
    try {
      // Fetch fresh data from API
      const leads = await this.apiClient.getLeads();
      
      // Update cache
      await this.storageManager.set(this.cacheKey, leads.map(lead => lead.toJSON()));
    } catch (error) {
      console.warn('Cache update error:', error);
      // Not throwing error here since this is a background operation
    }
  }

  /**
   * Get leads from cache
   * @returns {Promise<Object[]>} Array of lead data objects
   */
  async getCachedLeads() {
    const cachedLeads = await this.storageManager.get(this.cacheKey);
    return cachedLeads || [];
  }

  /**
   * Apply filters to leads
   * @param {Object[]} leads - Array of lead data
   * @param {Object} filters - Filters to apply
   * @returns {Object[]} Filtered leads
   */
  applyFilters(leads, filters) {
    if (!filters || Object.keys(filters).length === 0) {
      return leads;
    }
    
    return leads.filter(lead => {
      let match = true;
      
      // Filter by status
      if (filters.status && lead.status !== filters.status) {
        match = false;
      }
      
      // Filter by priority
      if (filters.priority && lead.priority !== parseInt(filters.priority)) {
        match = false;
      }
      
      // Filter by search term
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const companyName = lead.globalLead.companyName.toLowerCase();
        const contactName = (lead.globalLead.contactName || '').toLowerCase();
        
        if (!companyName.includes(searchTerm) && !contactName.includes(searchTerm)) {
          match = false;
        }
      }
      
      return match;
    });
  }

  /**
   * Mark a lead as contacted
   * @param {number} id - Lead ID
   * @param {Object} callData - Call data
   * @returns {Promise<Lead>} Updated lead
   */
  async markAsContacted(id, callData) {
    try {
      const lead = await this.get(id);
      
      // Update lead with last contact time and add to interactions
      const updateData = {
        lastContact: new Date(),
        interactions: [
          ...(lead.interactions || []),
          {
            type: 'call',
            timestamp: new Date(),
            data: callData
          }
        ]
      };
      
      return await this.update(id, updateData);
    } catch (error) {
      console.error('Mark as contacted error:', error);
      throw new Error(`Failed to mark lead as contacted: ${error.message}`);
    }
  }

  /**
   * Schedule a follow-up for a lead
   * @param {number} id - Lead ID
   * @param {Date} date - Follow-up date
   * @param {string} notes - Follow-up notes
   * @returns {Promise<Lead>} Updated lead
   */
  async scheduleFollowUp(id, date, notes = '') {
    try {
      const lead = await this.get(id);
      
      // Update lead with follow-up information
      const updateData = {
        nextFollowUp: date,
        notes: [
          ...(lead.notes || []),
          {
            type: 'follow-up',
            text: notes,
            createdAt: new Date()
          }
        ]
      };
      
      return await this.update(id, updateData);
    } catch (error) {
      console.error('Schedule follow-up error:', error);
      throw new Error(`Failed to schedule follow-up: ${error.message}`);
    }
  }

  /**
   * Get leads that need follow-up today
   * @returns {Promise<Lead[]>} Array of leads
   */
  async getLeadsNeedingFollowUp() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Get all leads
      const allLeads = await this.list();
      
      // Filter for leads with follow-up date today
      return allLeads.filter(lead => {
        if (!lead.nextFollowUp) return false;
        
        const followUpDate = new Date(lead.nextFollowUp);
        followUpDate.setHours(0, 0, 0, 0);
        
        return followUpDate >= today && followUpDate < tomorrow;
      });
    } catch (error) {
      console.error('Get leads needing follow-up error:', error);
      throw new Error(`Failed to get leads needing follow-up: ${error.message}`);
    }
  }

  /**
   * Change the status of a lead
   * @param {number} id - Lead ID
   * @param {string} status - New status
   * @returns {Promise<Lead>} Updated lead
   */
  async changeStatus(id, status) {
    try {
      // Validate status
      const validStatuses = ['new', 'contacted', 'qualified', 'proposal', 'closed-won', 'closed-lost'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }
      
      return await this.update(id, { status });
    } catch (error) {
      console.error('Change status error:', error);
      throw new Error(`Failed to change lead status: ${error.message}`);
    }
  }

  /**
   * Update the priority of a lead
   * @param {number} id - Lead ID
   * @param {number} priority - New priority (1-5)
   * @returns {Promise<Lead>} Updated lead
   */
  async updatePriority(id, priority) {
    try {
      // Validate priority
      if (priority < 1 || priority > 5) {
        throw new Error('Priority must be between 1 and 5');
      }
      
      return await this.update(id, { priority });
    } catch (error) {
      console.error('Update priority error:', error);
      throw new Error(`Failed to update lead priority: ${error.message}`);
    }
  }
}

// Export for both web and React Native
export { LeadService };