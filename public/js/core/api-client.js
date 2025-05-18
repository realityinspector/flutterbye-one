/**
 * APIClient - Unified API interaction layer
 * Handles all communication with the server API endpoints
 */
class APIClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL || '';
    this.token = this.getStoredToken();
  }

  /**
   * Get the authentication token from storage
   */
  getStoredToken() {
    return localStorage.getItem('auth_token') || this.getCookie('auth_token');
  }

  /**
   * Extract a cookie value by name
   */
  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  /**
   * Make a request to the API
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}/api${endpoint}`;
    
    // Default headers with authentication
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers || {}
    };

    // Add authorization token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    // Prepare request options
    const requestOptions = {
      ...options,
      headers
    };

    // If there's a body and it's not already a string, stringify it
    if (requestOptions.body && typeof requestOptions.body !== 'string') {
      requestOptions.body = JSON.stringify(requestOptions.body);
    }

    try {
      // Make the fetch request
      const response = await fetch(url, requestOptions);
      
      // Handle any error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }

      // Parse and return the response data
      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error.message);
      throw error;
    }
  }

  // Lead endpoints
  
  /**
   * Get all leads with optional filters
   */
  async getLeads(filters = {}) {
    const queryParams = new URLSearchParams();
    
    // Add any filters to the query string
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value);
      }
    });

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.makeRequest(`/leads${query}`, { method: 'GET' });
  }

  /**
   * Get a single lead by ID
   */
  async getLead(id) {
    return this.makeRequest(`/leads/${id}`, { method: 'GET' });
  }

  /**
   * Create a new lead
   */
  async createLead(data) {
    return this.makeRequest('/leads', { 
      method: 'POST',
      body: data
    });
  }

  /**
   * Update an existing lead
   */
  async updateLead(id, data) {
    return this.makeRequest(`/leads/${id}`, { 
      method: 'PUT',
      body: data
    });
  }

  /**
   * Delete a lead
   */
  async deleteLead(id) {
    return this.makeRequest(`/leads/${id}`, { method: 'DELETE' });
  }

  // Call endpoints
  
  /**
   * Get all calls with optional lead filter
   */
  async getCalls(leadId = null) {
    const query = leadId ? `?leadId=${leadId}` : '';
    return this.makeRequest(`/calls${query}`, { method: 'GET' });
  }

  /**
   * Create a new call record
   */
  async createCall(data) {
    return this.makeRequest('/calls', { 
      method: 'POST',
      body: data
    });
  }

  /**
   * Update an existing call record
   */
  async updateCall(id, data) {
    return this.makeRequest(`/calls/${id}`, { 
      method: 'PUT',
      body: data
    });
  }

  // Auth endpoints

  /**
   * Perform a login request
   */
  async login(username, password) {
    const result = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: { username, password }
    });
    
    if (result.token) {
      this.token = result.token;
      localStorage.setItem('auth_token', result.token);
    }
    
    return result;
  }

  /**
   * Check the current authentication status
   */
  async checkAuth() {
    return this.makeRequest('/dashboard-check', { method: 'GET' });
  }
}

// Create a singleton instance
const apiClient = new APIClient();