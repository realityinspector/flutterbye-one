/**
 * Authentication Service
 * Handles user authentication for the FlutterBye CRM
 */

class AuthService {
  /**
   * Create a new AuthService
   * @param {Object} apiClient - API client for server communication
   * @param {Object} storageManager - Storage for token persistence
   */
  constructor(apiClient, storageManager) {
    this.apiClient = apiClient;
    this.storageManager = storageManager;
    this.tokenKey = 'auth_token';
    this.userKey = 'current_user';
    this.authEvents = new EventTarget();
  }

  /**
   * Login a user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object>} Login result with user data
   */
  async login(username, password) {
    try {
      // Make login request to server
      const response = await this.apiClient.makeRequest('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      // Check if login was successful
      if (!response.success) {
        throw new Error(response.message || 'Login failed');
      }
      
      // Save auth token and user data
      const { token, user } = response.data;
      await this.setAuthToken(token);
      await this.setCurrentUser(user);
      
      // Dispatch login event
      this.dispatchAuthEvent('login', { user });
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result
   */
  async register(userData) {
    try {
      // Make registration request
      const response = await this.apiClient.makeRequest('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      // Check if registration was successful
      if (!response.success) {
        throw new Error(response.message || 'Registration failed');
      }
      
      return { success: true, message: 'Registration successful' };
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Logout the current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      // Clear auth data
      await this.clearAuthData();
      
      // Try to notify server of logout
      try {
        await this.apiClient.makeRequest('/api/auth/logout', {
          method: 'POST'
        });
      } catch (error) {
        // Logout on server failed, but we can still logout locally
        console.warn('Server logout failed, but local logout successful');
      }
      
      // Dispatch logout event
      this.dispatchAuthEvent('logout');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  /**
   * Check if the user is authenticated
   * @returns {Promise<boolean>} True if authenticated
   */
  async isAuthenticated() {
    try {
      const token = await this.getAuthToken();
      if (!token) return false;
      
      // Verify token with server
      const response = await this.apiClient.makeRequest('/api/auth/check', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.success;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  /**
   * Get the current user
   * @returns {Promise<Object|null>} User data or null if not logged in
   */
  async getCurrentUser() {
    return await this.storageManager.get(this.userKey);
  }

  /**
   * Set the current user
   * @param {Object} user - User data
   * @returns {Promise<void>}
   */
  async setCurrentUser(user) {
    await this.storageManager.set(this.userKey, user);
  }

  /**
   * Get the authentication token
   * @returns {Promise<string|null>} Auth token or null if not logged in
   */
  async getAuthToken() {
    return await this.storageManager.get(this.tokenKey);
  }

  /**
   * Set the authentication token
   * @param {string} token - Auth token
   * @returns {Promise<void>}
   */
  async setAuthToken(token) {
    await this.storageManager.set(this.tokenKey, token);
    
    // Also set the token in the API client
    if (this.apiClient.setAuthToken) {
      this.apiClient.setAuthToken(token);
    }
  }

  /**
   * Clear authentication data
   * @returns {Promise<void>}
   */
  async clearAuthData() {
    await this.storageManager.remove(this.tokenKey);
    await this.storageManager.remove(this.userKey);
    
    // Clear token from API client
    if (this.apiClient.setAuthToken) {
      this.apiClient.setAuthToken(null);
    }
  }

  /**
   * Add an authentication event listener
   * @param {string} event - Event name ('login', 'logout')
   * @param {Function} callback - Event callback
   * @returns {Function} Function to remove the listener
   */
  onAuthEvent(event, callback) {
    const eventListener = (e) => callback(e.detail);
    this.authEvents.addEventListener(event, eventListener);
    
    // Return a function to remove this listener
    return () => {
      this.authEvents.removeEventListener(event, eventListener);
    };
  }

  /**
   * Dispatch an authentication event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  dispatchAuthEvent(event, data = {}) {
    const customEvent = new CustomEvent(event, { detail: data });
    this.authEvents.dispatchEvent(customEvent);
  }
}

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthService };
} else {
  // For browser
  window.AuthService = AuthService;
}