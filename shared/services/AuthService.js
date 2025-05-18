/**
 * Authentication Service
 * Shared between web and React Native applications
 * 
 * This service provides consistent authentication logic across platforms,
 * handling login, registration, and session management.
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
      
      // Extract token and user info from response
      const { token, user } = response.data;
      
      if (!token) {
        throw new Error('No authentication token received');
      }
      
      // Save auth token
      await this.setAuthToken(token);
      
      // Save user data
      await this.setCurrentUser(user);
      
      return {
        success: true,
        user
      };
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
      // Validate user data
      if (!userData.username || !userData.password || !userData.email) {
        throw new Error('Username, password, and email are required');
      }
      
      // Make registration request
      const response = await this.apiClient.makeRequest('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      return {
        success: true,
        message: 'Registration successful'
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(`Registration failed: ${error.message}`);
    }
  }
  
  /**
   * Logout the current user
   * @returns {Promise<Object>} Logout result
   */
  async logout() {
    try {
      // Clear stored authentication data
      await this.clearAuthData();
      
      // Notify server of logout (for session cleanup)
      try {
        await this.apiClient.makeRequest('/api/auth/logout', {
          method: 'POST'
        });
      } catch (error) {
        // If server logout fails, we still want to logout locally
        console.warn('Server logout failed, but local logout successful');
      }
      
      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error(`Logout failed: ${error.message}`);
    }
  }
  
  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} True if authenticated
   */
  async isAuthenticated() {
    try {
      const token = await this.getAuthToken();
      
      if (!token) {
        return false;
      }
      
      // Verify token with server
      const response = await this.apiClient.makeRequest('/api/auth/verify', {
        method: 'GET'
      });
      
      return response.valid === true;
    } catch (error) {
      console.warn('Auth verification error:', error);
      return false;
    }
  }
  
  /**
   * Get current user profile
   * @returns {Promise<Object|null>} User profile or null if not logged in
   */
  async getCurrentUser() {
    try {
      // Try to get from storage first
      const storedUser = await this.storageManager.get(this.userKey);
      
      if (storedUser) {
        return storedUser;
      }
      
      // If not in storage but we have a token, fetch from API
      const token = await this.getAuthToken();
      
      if (!token) {
        return null;
      }
      
      // Get user profile from API
      const response = await this.apiClient.makeRequest('/api/user/profile', {
        method: 'GET'
      });
      
      if (response.success) {
        // Save to storage for future use
        const user = response.data;
        await this.setCurrentUser(user);
        return user;
      }
      
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }
  
  /**
   * Update user profile
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} Updated user profile
   */
  async updateProfile(userData) {
    try {
      // Make update request
      const response = await this.apiClient.makeRequest('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      // Update stored user data
      const updatedUser = response.data;
      await this.setCurrentUser(updatedUser);
      
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw new Error(`Profile update failed: ${error.message}`);
    }
  }
  
  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Password change result
   */
  async changePassword(currentPassword, newPassword) {
    try {
      // Validate passwords
      if (!currentPassword || !newPassword) {
        throw new Error('Current and new passwords are required');
      }
      
      // Make password change request
      const response = await this.apiClient.makeRequest('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      
      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      console.error('Password change error:', error);
      throw new Error(`Password change failed: ${error.message}`);
    }
  }
  
  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Reset request result
   */
  async requestPasswordReset(email) {
    try {
      // Validate email
      if (!email) {
        throw new Error('Email is required');
      }
      
      // Make reset request
      const response = await this.apiClient.makeRequest('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      return {
        success: true,
        message: 'Password reset email sent'
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      throw new Error(`Password reset request failed: ${error.message}`);
    }
  }
  
  /**
   * Get auth token from storage
   * @returns {Promise<string|null>} Auth token or null if not found
   */
  async getAuthToken() {
    return this.storageManager.get(this.tokenKey);
  }
  
  /**
   * Set auth token in storage
   * @param {string} token - Auth token
   * @returns {Promise<void>}
   */
  async setAuthToken(token) {
    await this.storageManager.set(this.tokenKey, token);
    
    // Update API client with new token
    if (this.apiClient.setAuthToken) {
      this.apiClient.setAuthToken(token);
    }
  }
  
  /**
   * Get current user from storage
   * @returns {Promise<Object|null>} User data or null if not found
   */
  async setCurrentUser(user) {
    await this.storageManager.set(this.userKey, user);
  }
  
  /**
   * Clear all authentication data from storage
   * @returns {Promise<void>}
   */
  async clearAuthData() {
    await this.storageManager.remove(this.tokenKey);
    await this.storageManager.remove(this.userKey);
    
    // Update API client to remove token
    if (this.apiClient.setAuthToken) {
      this.apiClient.setAuthToken(null);
    }
  }
}

// Export for both environments
export { AuthService };