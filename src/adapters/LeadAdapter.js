/**
 * Lead Adapter for React Native
 * 
 * This adapter provides platform-specific implementations for lead functionality
 * in React Native, while maintaining API compatibility with the web version.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../config/AppConfig';

class LeadAdapter {
  /**
   * Create a new LeadAdapter instance
   * @param {Object} apiClient - API client with fetch capabilities
   */
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.cacheKey = STORAGE_KEYS.LEADS_CACHE;
  }

  /**
   * Fetch leads from the API
   * @param {Object} filters - Optional filters to apply
   * @returns {Promise<Array>} Array of lead objects
   */
  async fetchLeads(filters = {}) {
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          queryParams.append(key, value);
        }
      });
      
      // Create the endpoint URL
      const endpoint = `${API_CONFIG.ENDPOINTS.LEADS.LIST}${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;
      
      // Make the API request
      const response = await this.apiClient.get(endpoint);
      
      // Cache the results for offline access
      if (Object.keys(filters).length === 0) {
        await this.cacheLeads(response.data);
      }
      
      return response.data;
    } catch (error) {
      // Try to load from cache if API fails
      if (Object.keys(filters).length === 0) {
        const cachedLeads = await this.getCachedLeads();
        if (cachedLeads && cachedLeads.length > 0) {
          console.log('Using cached leads due to API error');
          return cachedLeads;
        }
      }
      
      console.error('Error fetching leads:', error);
      throw error;
    }
  }

  /**
   * Get a specific lead by ID
   * @param {string|number} id - The lead ID
   * @returns {Promise<Object>} The lead object
   */
  async fetchLeadById(id) {
    try {
      // Try to get from cache first
      const cachedLead = await this.getCachedLeadById(id);
      if (cachedLead) {
        return cachedLead;
      }
      
      // Make the API request
      const endpoint = API_CONFIG.ENDPOINTS.LEADS.DETAIL.replace(':id', id);
      const response = await this.apiClient.get(endpoint);
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching lead ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new lead
   * @param {Object} leadData - The lead data
   * @returns {Promise<Object>} The created lead
   */
  async createLead(leadData) {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.LEADS.CREATE;
      const response = await this.apiClient.post(endpoint, leadData);
      
      // Update the cache
      await this.addLeadToCache(response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  /**
   * Update an existing lead
   * @param {string|number} id - The lead ID
   * @param {Object} leadData - The lead data to update
   * @returns {Promise<Object>} The updated lead
   */
  async updateLead(id, leadData) {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.LEADS.UPDATE.replace(':id', id);
      const response = await this.apiClient.put(endpoint, leadData);
      
      // Update the cache
      await this.updateLeadInCache(response.data);
      
      return response.data;
    } catch (error) {
      console.error(`Error updating lead ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a lead
   * @param {string|number} id - The lead ID
   * @returns {Promise<boolean>} Success indicator
   */
  async deleteLead(id) {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.LEADS.DELETE.replace(':id', id);
      await this.apiClient.delete(endpoint);
      
      // Remove from cache
      await this.removeLeadFromCache(id);
      
      return true;
    } catch (error) {
      console.error(`Error deleting lead ${id}:`, error);
      throw error;
    }
  }

  /**
   * Process leads for display
   * @param {Array} leads - Array of lead objects
   * @returns {Array} Processed leads ready for display
   */
  processLeadsForDisplay(leads) {
    return leads.map(lead => ({
      ...lead,
      // Format dates for display
      createdAt: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'Unknown',
      updatedAt: lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : 'Unknown',
      // Calculate days since creation
      daysSinceCreation: lead.createdAt 
        ? Math.floor((new Date() - new Date(lead.createdAt)) / (1000 * 60 * 60 * 24))
        : 0,
      // Add formatted phone for display
      formattedPhone: this.formatPhoneNumber(lead.phone),
      // Add display-ready status
      statusDisplay: this.getStatusDisplay(lead.status),
      // Add priority color for UI
      priorityColor: this.getPriorityColor(lead.priority)
    }));
  }

  /**
   * Format a phone number for display
   * @param {string} phone - The phone number
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phone) {
    if (!phone) return 'No phone';
    
    // Remove non-numeric characters
    const cleaned = ('' + phone).replace(/\D/g, '');
    
    // Format based on length
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    } else {
      return phone; // Return original if can't format
    }
  }

  /**
   * Get display text for a status
   * @param {string} status - The status code
   * @returns {string} Human-readable status
   */
  getStatusDisplay(status) {
    const statusMap = {
      new: 'New',
      contacted: 'Contacted',
      qualified: 'Qualified',
      proposal: 'Proposal',
      negotiation: 'Negotiation',
      closed: 'Closed Won',
      lost: 'Closed Lost'
    };
    
    return statusMap[status] || 'Unknown';
  }

  /**
   * Get display color for a priority
   * @param {number} priority - The priority level (1-5)
   * @returns {string} Color code
   */
  getPriorityColor(priority) {
    const priorityColors = {
      1: '#e74c3c', // High (red)
      2: '#f39c12', // Medium-high (orange)
      3: '#3498db', // Medium (blue)
      4: '#2ecc71', // Medium-low (green)
      5: '#95a5a6'  // Low (gray)
    };
    
    return priorityColors[priority] || '#95a5a6';
  }

  // Cache management methods
  
  /**
   * Cache leads for offline access
   * @param {Array} leads - Array of lead objects
   */
  async cacheLeads(leads) {
    try {
      const now = new Date().getTime();
      const cacheData = {
        timestamp: now,
        data: leads
      };
      
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching leads:', error);
    }
  }

  /**
   * Get cached leads
   * @returns {Promise<Array>} Array of cached leads or empty array
   */
  async getCachedLeads() {
    try {
      const cachedData = await AsyncStorage.getItem(this.cacheKey);
      if (!cachedData) return [];
      
      const { timestamp, data } = JSON.parse(cachedData);
      const now = new Date().getTime();
      
      // Check if cache is expired (24 hours)
      if (now - timestamp > 24 * 60 * 60 * 1000) {
        return [];
      }
      
      return data;
    } catch (error) {
      console.error('Error getting cached leads:', error);
      return [];
    }
  }

  /**
   * Get a specific lead from cache
   * @param {string|number} id - The lead ID
   * @returns {Promise<Object|null>} Cached lead or null
   */
  async getCachedLeadById(id) {
    try {
      const leads = await this.getCachedLeads();
      return leads.find(lead => lead.id == id) || null;
    } catch (error) {
      console.error(`Error getting cached lead ${id}:`, error);
      return null;
    }
  }

  /**
   * Add a lead to the cache
   * @param {Object} lead - The lead to add
   */
  async addLeadToCache(lead) {
    try {
      const leads = await this.getCachedLeads();
      leads.push(lead);
      await this.cacheLeads(leads);
    } catch (error) {
      console.error('Error adding lead to cache:', error);
    }
  }

  /**
   * Update a lead in the cache
   * @param {Object} updatedLead - The updated lead
   */
  async updateLeadInCache(updatedLead) {
    try {
      const leads = await this.getCachedLeads();
      const index = leads.findIndex(lead => lead.id == updatedLead.id);
      
      if (index !== -1) {
        leads[index] = updatedLead;
        await this.cacheLeads(leads);
      }
    } catch (error) {
      console.error(`Error updating lead in cache:`, error);
    }
  }

  /**
   * Remove a lead from the cache
   * @param {string|number} id - The lead ID
   */
  async removeLeadFromCache(id) {
    try {
      const leads = await this.getCachedLeads();
      const filteredLeads = leads.filter(lead => lead.id != id);
      await this.cacheLeads(filteredLeads);
    } catch (error) {
      console.error(`Error removing lead from cache:`, error);
    }
  }

  /**
   * Clear the lead cache
   */
  async clearCache() {
    try {
      await AsyncStorage.removeItem(this.cacheKey);
    } catch (error) {
      console.error('Error clearing lead cache:', error);
    }
  }
}

export default LeadAdapter;