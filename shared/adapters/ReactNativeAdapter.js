/**
 * React Native Adapter
 * 
 * This file provides adapter functions to ensure our shared data models
 * work properly in the React Native environment.
 * 
 * React Native may have different storage mechanisms, network requests,
 * and UI rendering - this adapter provides the compatibility layer.
 */

import { Lead } from '../models/Lead';
import { Call } from '../models/Call';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage adapter for React Native's AsyncStorage
 */
class ReactNativeStorageAdapter {
  /**
   * Initialize storage with namespace
   * @param {string} namespace - Storage namespace to avoid key conflicts
   */
  constructor(namespace = 'flutterbye') {
    this.namespace = namespace;
  }

  /**
   * Format a key with the namespace
   * @param {string} key - Storage key
   * @returns {string} Namespaced key
   */
  formatKey(key) {
    return `${this.namespace}:${key}`;
  }

  /**
   * Store data
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @returns {Promise<void>}
   */
  async set(key, value) {
    const formattedKey = this.formatKey(key);
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(formattedKey, jsonValue);
  }

  /**
   * Retrieve data
   * @param {string} key - Storage key
   * @returns {Promise<any>} Stored value or null
   */
  async get(key) {
    const formattedKey = this.formatKey(key);
    const jsonValue = await AsyncStorage.getItem(formattedKey);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  }

  /**
   * Remove data
   * @param {string} key - Storage key
   * @returns {Promise<void>}
   */
  async remove(key) {
    const formattedKey = this.formatKey(key);
    await AsyncStorage.removeItem(formattedKey);
  }

  /**
   * Clear all data for this namespace
   * @returns {Promise<void>}
   */
  async clear() {
    const keys = await AsyncStorage.getAllKeys();
    const namespacedKeys = keys.filter(key => key.startsWith(`${this.namespace}:`));
    await AsyncStorage.multiRemove(namespacedKeys);
  }

  /**
   * Get all keys in this namespace
   * @returns {Promise<string[]>} Array of keys
   */
  async getAllKeys() {
    const keys = await AsyncStorage.getAllKeys();
    return keys
      .filter(key => key.startsWith(`${this.namespace}:`))
      .map(key => key.replace(`${this.namespace}:`, ''));
  }
}

/**
 * API client adapter for React Native
 */
class ReactNativeAPIAdapter {
  /**
   * Create an API adapter
   * @param {string} baseUrl - API base URL
   * @param {Object} options - Configuration options
   */
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.options = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: options.timeout || 30000,
      ...options
    };
  }

  /**
   * Set authentication token
   * @param {string} token - Authentication token
   */
  setAuthToken(token) {
    if (token) {
      this.options.headers.Authorization = `Bearer ${token}`;
    } else {
      delete this.options.headers.Authorization;
    }
  }

  /**
   * Make API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} API response
   */
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const requestOptions = {
        ...this.options,
        ...options,
        headers: {
          ...this.options.headers,
          ...options.headers
        }
      };

      // Handle timeouts for React Native fetch
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timeout'));
        }, this.options.timeout);
      });

      const fetchPromise = fetch(url, requestOptions);
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      // Parse JSON response
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle API errors
      if (!response.ok) {
        throw new Error(data.message || `API Error: ${response.status}`);
      }

      return { data, status: response.status };
    } catch (error) {
      // Convert network errors to a consistent format
      console.error('API Request Error:', error);
      throw new Error(`API Request Failed: ${error.message}`);
    }
  }

  /**
   * Get leads from API
   * @param {Object} filters - Query filters
   * @returns {Promise<Lead[]>} Array of Lead objects
   */
  async getLeads(filters = {}) {
    const queryString = Object.keys(filters)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(filters[key])}`)
      .join('&');
    
    const endpoint = `/api/leads${queryString ? `?${queryString}` : ''}`;
    const response = await this.makeRequest(endpoint);
    
    // Convert API response to Lead objects
    return response.data.map(leadData => new Lead(leadData));
  }

  /**
   * Get a specific lead
   * @param {number} id - Lead ID
   * @returns {Promise<Lead>} Lead object
   */
  async getLead(id) {
    const response = await this.makeRequest(`/api/leads/${id}`);
    return new Lead(response.data);
  }

  /**
   * Create a new lead
   * @param {Lead} lead - Lead data
   * @returns {Promise<Lead>} Created lead
   */
  async createLead(lead) {
    const response = await this.makeRequest('/api/leads', {
      method: 'POST',
      body: JSON.stringify(lead.toJSON())
    });
    return new Lead(response.data);
  }

  /**
   * Update a lead
   * @param {number} id - Lead ID
   * @param {Object} data - Data to update
   * @returns {Promise<Lead>} Updated lead
   */
  async updateLead(id, data) {
    const response = await this.makeRequest(`/api/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return new Lead(response.data);
  }

  /**
   * Delete a lead
   * @param {number} id - Lead ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteLead(id) {
    await this.makeRequest(`/api/leads/${id}`, {
      method: 'DELETE'
    });
    return true;
  }

  /**
   * Get call history
   * @param {number} leadId - Optional lead ID to filter by
   * @returns {Promise<Call[]>} Array of Call objects
   */
  async getCalls(leadId = null) {
    const endpoint = leadId ? `/api/calls?leadId=${leadId}` : '/api/calls';
    const response = await this.makeRequest(endpoint);
    
    // Convert API response to Call objects
    return response.data.map(callData => new Call(callData));
  }

  /**
   * Create a new call
   * @param {Call} call - Call data
   * @returns {Promise<Call>} Created call
   */
  async createCall(call) {
    const response = await this.makeRequest('/api/calls', {
      method: 'POST',
      body: JSON.stringify(call.toJSON())
    });
    return new Call(response.data);
  }

  /**
   * Update a call
   * @param {number} id - Call ID
   * @param {Object} data - Data to update
   * @returns {Promise<Call>} Updated call
   */
  async updateCall(id, data) {
    const response = await this.makeRequest(`/api/calls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return new Call(response.data);
  }
}

/**
 * UI component adapters for React Native
 */
const ReactNativeUIAdapters = {
  /**
   * Format status for React Native UI
   * @param {string} status - Status value
   * @returns {Object} Styling properties
   */
  formatStatus(status) {
    // Status color mapping
    const colorMap = {
      'new': '#3498db',
      'contacted': '#9b59b6',
      'qualified': '#2ecc71',
      'proposal': '#f39c12',
      'closed-won': '#27ae60',
      'closed-lost': '#e74c3c',
      'scheduled': '#3498db',
      'active': '#f39c12',
      'completed': '#2ecc71',
      'missed': '#e74c3c',
      'cancelled': '#95a5a6'
    };

    // Return React Native compatible styling
    return {
      color: colorMap[status] || '#7f8c8d',
      text: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')
    };
  },
  
  /**
   * Format date for React Native UI
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date string
   */
  formatDate(date) {
    if (!date) return '';
    
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },
  
  /**
   * Format time for React Native UI
   * @param {Date|string} date - Date to extract time from
   * @returns {string} Formatted time string
   */
  formatTime(date) {
    if (!date) return '';
    
    const dateObj = new Date(date);
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  /**
   * Format phone number for React Native UI
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    
    // Simple US phone number formatting
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
    return phoneNumber;
  }
};

// Export for both React Native
export {
  ReactNativeStorageAdapter,
  ReactNativeAPIAdapter,
  ReactNativeUIAdapters,
  Lead,
  Call
};