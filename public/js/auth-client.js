/**
 * Auth Client
 * Client-side authentication handler for FlutterBye CRM
 */

class AuthClient {
  /**
   * Initialize the auth client
   */
  constructor() {
    this.tokenKey = 'auth_token';
    this.userKey = 'current_user';
    this.baseUrl = '';
  }

  /**
   * Login user
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @returns {Promise<Object>} Login result with user data
   */
  async login(username, password) {
    try {
      const response = await fetch(`${this.baseUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      // Save token and user data
      if (data.data && data.data.token) {
        this.setToken(data.data.token);
      }

      if (data.data && data.data.user) {
        this.setUser(data.data.user);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register a new user
   * @param {Object} userData - Registration data
   * @returns {Promise<Object>} Registration result
   */
  async register(userData) {
    try {
      const response = await fetch(`${this.baseUrl}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      // Attempt to call logout endpoint
      await fetch(`${this.baseUrl}/api/logout`, {
        method: 'POST',
        credentials: 'include'
      }).catch(error => {
        console.warn('Logout API call failed, but continuing with local logout', error);
      });

      // Clear local storage regardless of API call result
      this.clearAuth();

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if API call fails
      this.clearAuth();
      return { success: true };
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    return Boolean(this.getToken());
  }

  /**
   * Get authentication token
   * @returns {string|null} Token or null if not authenticated
   */
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Set authentication token
   * @param {string} token - Authentication token
   */
  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  /**
   * Get current user data
   * @returns {Object|null} User data or null if not authenticated
   */
  getUser() {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Set current user data
   * @param {Object} user - User data
   */
  setUser(user) {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  /**
   * Clear authentication data
   */
  clearAuth() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  /**
   * Redirect to login page
   */
  redirectToLogin() {
    window.location.href = '/';
  }

  /**
   * Redirect to dashboard page
   */
  redirectToDashboard() {
    window.location.href = '/dashboard.html';
  }
}

// Initialize global auth client
const authClient = new AuthClient();

// Check if user is already authenticated on page load
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on a protected page
  const isProtectedPage = 
    window.location.pathname.includes('/dashboard') || 
    window.location.pathname.includes('/leads') || 
    window.location.pathname.includes('/calls');
  
  // Redirect to dashboard if authenticated and on login page
  if (authClient.isAuthenticated() && window.location.pathname === '/') {
    authClient.redirectToDashboard();
  }
  
  // Redirect to login if not authenticated and on protected page
  if (!authClient.isAuthenticated() && isProtectedPage) {
    authClient.redirectToLogin();
  }
});