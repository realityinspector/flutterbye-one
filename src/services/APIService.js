/**
 * API Service for React Native
 * 
 * Provides unified API communication with error handling and authentication
 * specifically tailored for React Native applications.
 */

import { API_CONFIG, STORAGE_KEYS } from '../config/AppConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

class APIService {
  constructor(baseURL = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Store for pending offline requests
    this.offlineQueue = [];
    this.isProcessingQueue = false;
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize API service
   */
  async initialize() {
    // Restore authentication token if available
    await this.restoreAuth();
    
    // Load any pending offline requests
    await this.loadOfflineQueue();
    
    // Set up network status listener
    NetInfo.addEventListener(state => {
      if (state.isConnected && this.offlineQueue.length > 0) {
        this.processOfflineQueue();
      }
    });
  }
  
  /**
   * Restore authentication from storage
   */
  async restoreAuth() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        this.setAuthToken(token);
      }
    } catch (error) {
      console.error('Failed to restore authentication:', error);
    }
  }
  
  /**
   * Set authentication token
   * @param {string} token - JWT token
   */
  setAuthToken(token) {
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`;
      AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } else {
      delete this.headers['Authorization'];
      AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    }
  }
  
  /**
   * Clear authentication token
   */
  clearAuthToken() {
    this.setAuthToken(null);
  }
  
  /**
   * Check if the device is online
   * @returns {Promise<boolean>} Online status
   */
  async isOnline() {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected;
  }
  
  /**
   * Make an API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @param {boolean} requiresAuth - Whether auth is required
   * @returns {Promise<Object>} Response data
   */
  async request(endpoint, options = {}, requiresAuth = true) {
    // Build complete URL
    const url = this.baseURL + endpoint;
    
    // Merge headers
    const headers = { ...this.headers, ...options.headers };
    
    // Check if auth is required but not available
    if (requiresAuth && !headers.Authorization) {
      throw new Error('Authentication required for this request');
    }
    
    // Prepare request options
    const requestOptions = {
      ...options,
      headers,
      timeout: options.timeout || this.timeout
    };
    
    // Check if we're online
    const online = await this.isOnline();
    
    // If offline and not a GET request, queue for later
    if (!online && options.method !== 'GET') {
      await this.addToOfflineQueue(endpoint, requestOptions);
      throw new Error('You are offline. Request queued for later.');
    }
    
    // Set fetch timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    requestOptions.signal = controller.signal;
    
    try {
      // Make the request
      const response = await fetch(url, requestOptions);
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Handle non-success responses
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          this.clearAuthToken();
          throw new Error('Authentication failed. Please log in again.');
        }
        
        // Try to parse error response
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }
      
      // Parse JSON response
      const data = await response.json();
      return data;
    } catch (error) {
      // Clear timeout if request errored
      clearTimeout(timeoutId);
      
      // Re-throw abort errors as timeout errors
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      
      // Re-throw everything else
      throw error;
    }
  }
  
  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - URL parameters
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async get(endpoint, params = {}, options = {}) {
    // Build query string
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value);
      }
    });
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    return this.request(`${endpoint}${query}`, {
      method: 'GET',
      ...options
    });
  }
  
  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async post(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }
  
  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async put(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  }
  
  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options
    });
  }
  
  // Offline queue management
  
  /**
   * Add a request to the offline queue
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   */
  async addToOfflineQueue(endpoint, options) {
    try {
      // Add request to queue
      this.offlineQueue.push({ endpoint, options, timestamp: Date.now() });
      
      // Persist queue
      await this.saveOfflineQueue();
      
      console.log(`Added request to ${endpoint} to offline queue. Queue size: ${this.offlineQueue.length}`);
    } catch (error) {
      console.error('Failed to add request to offline queue:', error);
    }
  }
  
  /**
   * Save offline queue to persistent storage
   */
  async saveOfflineQueue() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }
  
  /**
   * Load offline queue from persistent storage
   */
  async loadOfflineQueue() {
    try {
      const queue = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (queue) {
        this.offlineQueue = JSON.parse(queue);
        console.log(`Loaded offline queue with ${this.offlineQueue.length} pending requests`);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }
  
  /**
   * Process offline queue when back online
   */
  async processOfflineQueue() {
    // Prevent concurrent processing
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    try {
      if (this.offlineQueue.length === 0) {
        this.isProcessingQueue = false;
        return;
      }
      
      console.log(`Processing offline queue with ${this.offlineQueue.length} requests`);
      
      // Process each request in order
      const queue = [...this.offlineQueue];
      this.offlineQueue = [];
      await this.saveOfflineQueue();
      
      for (const item of queue) {
        try {
          console.log(`Processing offline request to ${item.endpoint}`);
          await this.request(item.endpoint, item.options);
        } catch (error) {
          // If still failing, add back to queue
          console.error(`Failed to process offline request to ${item.endpoint}:`, error);
          this.offlineQueue.push(item);
          await this.saveOfflineQueue();
        }
      }
      
      console.log(`Completed processing offline queue. ${this.offlineQueue.length} requests remaining.`);
    } catch (error) {
      console.error('Error processing offline queue:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }
  
  /**
   * Clear offline queue
   */
  async clearOfflineQueue() {
    this.offlineQueue = [];
    await this.saveOfflineQueue();
  }
}

// Export a singleton instance
export default new APIService();