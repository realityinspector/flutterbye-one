/**
 * Login Page Controller
 * Handles login functionality using the shared authentication service
 */

// Initialize storage and API client
const apiClient = {
  async makeRequest(endpoint, options = {}) {
    const response = await fetch(endpoint, options);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // Handle non-JSON responses
      const text = await response.text();
      throw new Error(`Expected JSON response, got: ${text.substring(0, 50)}...`);
    }
    
    return {
      success: response.ok,
      status: response.status,
      data: data
    };
  },
  
  setAuthToken(token) {
    this.authToken = token;
  }
};

const storageManager = {
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  
  get(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  
  remove(key) {
    localStorage.removeItem(key);
  }
};

// Create auth service
const authService = new AuthService(apiClient, storageManager);

/**
 * Login Page Controller
 */
class LoginPage {
  constructor() {
    this.loginForm = document.getElementById('login-form');
    this.usernameInput = document.getElementById('username');
    this.passwordInput = document.getElementById('password');
    this.errorContainer = document.getElementById('login-error');
    this.submitButton = document.querySelector('#login-form button[type="submit"]');
    
    this.initialize();
  }
  
  /**
   * Initialize the login page
   */
  initialize() {
    // Check if already logged in
    this.checkAuthState();
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Check if user is already authenticated
   */
  async checkAuthState() {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        // Already logged in, redirect to dashboard
        window.location.href = '/dashboard.html';
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Handle form submission
    this.loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      await this.handleLogin();
    });
  }
  
  /**
   * Handle login form submission
   */
  async handleLogin() {
    try {
      // Clear previous errors
      this.hideError();
      
      // Disable submit button during login
      this.setLoading(true);
      
      // Get form values
      const username = this.usernameInput.value.trim();
      const password = this.passwordInput.value;
      
      // Validate input
      if (!username || !password) {
        throw new Error('Username and password are required');
      }
      
      // Attempt login
      const result = await authService.login(username, password);
      
      if (result.success) {
        // Redirect to dashboard
        window.location.href = '/dashboard.html';
      } else {
        throw new Error(result.message || 'Login failed');
      }
    } catch (error) {
      // Display error
      this.showError(error.message);
      console.error('Login error:', error);
    } finally {
      // Re-enable submit button
      this.setLoading(false);
    }
  }
  
  /**
   * Show an error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    this.errorContainer.textContent = message;
    this.errorContainer.style.display = 'block';
  }
  
  /**
   * Hide error message
   */
  hideError() {
    this.errorContainer.textContent = '';
    this.errorContainer.style.display = 'none';
  }
  
  /**
   * Set loading state
   * @param {boolean} isLoading - Whether the form is in loading state
   */
  setLoading(isLoading) {
    this.submitButton.disabled = isLoading;
    this.submitButton.innerHTML = isLoading 
      ? '<span class="spinner"></span> Logging in...'
      : 'Login';
  }
}

// Initialize login page controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the login page
  if (document.getElementById('login-form')) {
    new LoginPage();
  }
});