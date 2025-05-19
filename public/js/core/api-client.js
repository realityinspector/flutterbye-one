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
    // Try to get token from multiple possible storage locations
    const token = localStorage.getItem('auth_token') || 
                  sessionStorage.getItem('auth_token') || 
                  this.getCookie('auth_token');
    
    // Log token status for debugging (without exposing full token)
    if (token) {
      console.log('Auth token found in storage');
    } else {
      console.warn('No auth token found in storage');
    }
    
    return token;
  }

  /**
   * Extract a cookie value by name
   */
  getCookie(name) {
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        const token = parts.pop().split(';').shift();
        return token;
      }
    } catch (e) {
      console.error('Error parsing cookie:', e);
    }
    return null;
  }
  
  /**
   * Ensure we have a valid authentication token
   * @returns {boolean} True if token is available
   */
  ensureAuthenticated() {
    this.token = this.getStoredToken();
    if (!this.token) {
      console.warn('No authentication token available, redirecting to login');
      window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.href);
      return false;
    }
    return true;
  }

  /**
   * Make a request to the API
   */
  async makeRequest(endpoint, options = {}) {
    // Make sure we're using the current token in case it was refreshed
    this.token = this.getStoredToken();
    
    // Ensure endpoint starts with a slash
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseURL}/api${formattedEndpoint}`;
    
    console.log(`Making API request to: ${url}`);
    
    // Default headers with authentication
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers || {}
    };

    // Add authorization token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      console.log('Request includes authorization token');
    } else {
      console.warn('No authorization token available for request');
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
      // Log full request details for debugging
    console.log('API Request:', {
      url,
      method: requestOptions.method,
      headers: requestOptions.headers,
      body: requestOptions.body ? JSON.parse(requestOptions.body) : undefined
    });
    
    // Make the fetch request
    const response = await fetch(url, requestOptions);
    
    // Log response status
    console.log(`API Response status: ${response.status} ${response.statusText}`);
    
    // Handle any error responses
    if (!response.ok) {
      // Try to get error details from response
      const errorText = await response.text();
      let errorMessage = `API request failed with status ${response.status}`;
      
      try {
        // Try to parse as JSON if possible
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If not JSON, use the raw text if it exists
        if (errorText) {
          errorMessage += `: ${errorText}`;
        }
      }
      
      console.error('API Error:', errorMessage);
      throw new Error(errorMessage);
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
    // Make sure the call object has the correct properties expected by the server
    const callData = {
      ...data,
      userLeadId: data.leadId || data.userLeadId // Ensure userLeadId is set
    };
    
    // Debug logging
    console.log('Creating call with data:', callData);
    
    // IMPORTANT: Make a direct fetch call to avoid routing issues
    try {
      const token = this.getStoredToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(callData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Call API error (${response.status}):`, errorText);
        throw new Error(`Failed to create call: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Direct call creation failed:', error);
      // Fall back to regular request method
      return this.makeRequest('/calls', { 
        method: 'POST',
        body: callData
      });
    }
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
    try {
      // IMPORTANT: The dashboard-check endpoint is at the root level, not under /api
      // Make a direct fetch call to avoid the API prefix
      const response = await fetch('/dashboard-check', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.token ? `Bearer ${this.token}` : undefined
        },
        credentials: 'include' // Include cookies in the request
      });
      
      const result = await response.json();
      
      // If we received a token in the response, store it for future use
      if (result.authenticated && result.token) {
        this.token = result.token;
        localStorage.setItem('auth_token', result.token);
        console.log('Authentication token refreshed from server');
      }
      
      return result;
    } catch (error) {
      console.warn('Auth check failed:', error.message);
      // Return a default response to prevent errors breaking the page
      return { 
        authenticated: false,
        message: 'Failed to verify authentication status'
      };
    }
  }
}

// Create a singleton instance
const apiClient = new APIClient();