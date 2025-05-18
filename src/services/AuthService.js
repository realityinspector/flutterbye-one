/**
 * Authentication Service for React Native
 * 
 * Handles user authentication, login, registration, and token management 
 * for the FlutterBye CRM React Native application.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS, AUTH_SETTINGS } from '../config/AppConfig';
import APIService from './APIService';

class AuthService {
  constructor() {
    this.token = null;
    this.user = null;
    this.isAuthenticated = false;
    this.rememberMe = false;
    this.listeners = [];
    
    // Initialize auth state
    this.initialize();
  }
  
  /**
   * Initialize authentication state
   */
  async initialize() {
    try {
      // Check if we have a stored token
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      
      if (token) {
        // Set the token in the API service
        APIService.setAuthToken(token);
        this.token = token;
        
        // Get user data
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        
        if (userData) {
          this.user = JSON.parse(userData);
          this.isAuthenticated = true;
          
          // Notify listeners of authentication state change
          this.notifyListeners();
        } else {
          // If we have a token but no user data, verify the token
          await this.verifyToken();
        }
      }
      
      // Check remember me setting
      const rememberMe = await AsyncStorage.getItem('remember_me');
      this.rememberMe = rememberMe === 'true';
    } catch (error) {
      console.error('Error initializing auth service:', error);
      // Clear any invalid auth state
      this.logout(false);
    }
  }
  
  /**
   * Verify the authentication token
   * @returns {Promise<boolean>} Token validity
   */
  async verifyToken() {
    if (!this.token) return false;
    
    try {
      // Call the verify endpoint
      const response = await APIService.get(API_CONFIG.ENDPOINTS.AUTH.VERIFY);
      
      if (response && response.success && response.user) {
        // Update user data
        this.user = response.user;
        this.isAuthenticated = true;
        
        // Store user data
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(this.user));
        
        // Notify listeners
        this.notifyListeners();
        
        return true;
      } else {
        // Token is invalid, log out
        await this.logout(false);
        return false;
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      // Token is invalid or expired
      await this.logout(false);
      return false;
    }
  }
  
  /**
   * Log in a user
   * @param {string} username - Username
   * @param {string} password - Password
   * @param {boolean} rememberMe - Whether to remember login
   * @returns {Promise<Object>} Login result
   */
  async login(username, password, rememberMe = false) {
    try {
      // Store remember me setting
      this.rememberMe = rememberMe;
      await AsyncStorage.setItem('remember_me', rememberMe.toString());
      
      // Call login endpoint
      const response = await APIService.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, { 
        username, 
        password 
      });
      
      // Check if login was successful
      if (response && response.success && response.token) {
        // Store token
        this.token = response.token;
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, this.token);
        
        // Set token in API service
        APIService.setAuthToken(this.token);
        
        // Store user data
        this.user = response.user;
        this.isAuthenticated = true;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(this.user));
        
        // Notify listeners
        this.notifyListeners();
        
        return { 
          success: true, 
          user: this.user 
        };
      } else {
        // Login failed
        return { 
          success: false, 
          error: response.message || 'Login failed. Please check your credentials.'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed. Please try again.'
      };
    }
  }
  
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result
   */
  async register(userData) {
    try {
      // Call register endpoint
      const response = await APIService.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);
      
      // Check if registration was successful
      if (response && response.success && response.token) {
        // Store token
        this.token = response.token;
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, this.token);
        
        // Set token in API service
        APIService.setAuthToken(this.token);
        
        // Store user data
        this.user = response.user;
        this.isAuthenticated = true;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(this.user));
        
        // Notify listeners
        this.notifyListeners();
        
        return { 
          success: true, 
          user: this.user 
        };
      } else {
        // Registration failed
        return { 
          success: false, 
          error: response.message || 'Registration failed. Please try again.'
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.message || 'Registration failed. Please try again.'
      };
    }
  }
  
  /**
   * Log out the current user
   * @param {boolean} callServer - Whether to call the logout endpoint
   * @returns {Promise<boolean>} Logout success
   */
  async logout(callServer = true) {
    try {
      // Call logout endpoint if required
      if (callServer && this.token) {
        try {
          await APIService.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
        } catch (error) {
          console.error('Error calling logout endpoint:', error);
          // Continue with local logout even if server call fails
        }
      }
      
      // Clear token
      this.token = null;
      APIService.clearAuthToken();
      
      // Clear user data
      this.user = null;
      this.isAuthenticated = false;
      
      // Clear storage
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      
      // Keep remember me setting for convenience
      
      // Notify listeners
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }
  
  /**
   * Update user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Update result
   */
  async updateProfile(userData) {
    if (!this.isAuthenticated) {
      return { 
        success: false, 
        error: 'You must be logged in to update your profile' 
      };
    }
    
    try {
      // Call update profile endpoint
      const response = await APIService.put(`/api/user/${this.user.id}`, userData);
      
      if (response && response.success) {
        // Update local user data
        this.user = { ...this.user, ...response.data };
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(this.user));
        
        // Notify listeners
        this.notifyListeners();
        
        return { 
          success: true, 
          user: this.user 
        };
      } else {
        return { 
          success: false, 
          error: response.message || 'Failed to update profile'
        };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update profile'
      };
    }
  }
  
  /**
   * Change password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Change password result
   */
  async changePassword(currentPassword, newPassword) {
    if (!this.isAuthenticated) {
      return { 
        success: false, 
        error: 'You must be logged in to change your password' 
      };
    }
    
    try {
      // Call change password endpoint
      const response = await APIService.post('/api/user/change-password', {
        currentPassword,
        newPassword
      });
      
      return { 
        success: !!response.success,
        message: response.message || 'Password changed successfully',
        error: response.error || null
      };
    } catch (error) {
      console.error('Change password error:', error);
      return { 
        success: false,
        error: error.message || 'Failed to change password'
      };
    }
  }
  
  /**
   * Get the current authentication state
   * @returns {Object} Authentication state
   */
  getAuthState() {
    return {
      isAuthenticated: this.isAuthenticated,
      user: this.user,
      token: this.token
    };
  }
  
  /**
   * Add a listener for authentication state changes
   * @param {Function} listener - Listener function
   * @returns {Function} Function to remove the listener
   */
  addListener(listener) {
    this.listeners.push(listener);
    
    // Call listener immediately with current state
    listener(this.getAuthState());
    
    // Return function to remove listener
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Notify all listeners of authentication state changes
   */
  notifyListeners() {
    const authState = this.getAuthState();
    this.listeners.forEach(listener => {
      try {
        listener(authState);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }
}

// Export a singleton instance
export default new AuthService();