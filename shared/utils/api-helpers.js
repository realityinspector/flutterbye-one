/**
 * API Helper Utilities
 * Shared between web and mobile applications
 * 
 * These utilities help standardize API responses and error handling
 * across all platforms.
 */

/**
 * Parse API response with standardized error handling
 * @param {Response} response - Fetch API response object
 * @returns {Promise<Object>} Parsed response data
 * @throws {Error} If response is not ok or not valid JSON
 */
export async function parseApiResponse(response) {
  try {
    // Check for empty response
    if (!response) {
      throw new Error('Empty response received');
    }
    
    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Try to get response text for better error messages
      const text = await response.text();
      throw new Error(`Expected JSON response, got: ${text.substring(0, 100)}...`);
    }
    
    // Parse JSON response
    const data = await response.json();
    
    // Check for HTTP error status
    if (!response.ok) {
      const errorMessage = data.message || `API Error: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error) {
    // Check if it's a parsing error
    if (error.name === 'SyntaxError') {
      throw new Error('Invalid JSON response from server');
    }
    
    // Rethrow the error
    throw error;
  }
}

/**
 * Create a standardized error response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {Object} details - Additional error details
 * @returns {Object} Standardized error response
 */
export function createErrorResponse(message, status = 400, details = null) {
  return {
    success: false,
    status,
    message,
    details,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create a standardized success response
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @returns {Object} Standardized success response
 */
export function createSuccessResponse(data, message = 'Operation successful') {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Handle API errors consistently
 * @param {Error} error - Error object
 * @param {Function} errorCallback - Optional callback for error handling
 * @returns {Object} Standardized error response
 */
export function handleApiError(error, errorCallback = null) {
  // Log the error
  console.error('API Error:', error);
  
  // Call the error callback if provided
  if (errorCallback && typeof errorCallback === 'function') {
    errorCallback(error);
  }
  
  // Return a standardized error response
  return createErrorResponse(
    error.message || 'An unexpected error occurred',
    error.status || 500
  );
}

/**
 * Create a query string from an object of parameters
 * @param {Object} params - Query parameters object
 * @returns {string} Formatted query string
 */
export function createQueryString(params) {
  if (!params || typeof params !== 'object' || Object.keys(params).length === 0) {
    return '';
  }
  
  const queryParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      // Handle arrays
      if (Array.isArray(value)) {
        return value
          .map(item => `${encodeURIComponent(key)}=${encodeURIComponent(item)}`)
          .join('&');
      }
      
      // Handle dates
      if (value instanceof Date) {
        return `${encodeURIComponent(key)}=${encodeURIComponent(value.toISOString())}`;
      }
      
      // Handle objects
      if (typeof value === 'object') {
        return `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`;
      }
      
      // Handle primitives
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
  
  return queryParams ? `?${queryParams}` : '';
}

/**
 * Check if the client is online
 * Works in both web and React Native environments
 * @returns {boolean} True if online
 */
export function isOnline() {
  // Browser
  if (typeof navigator !== 'undefined' && navigator.onLine !== undefined) {
    return navigator.onLine;
  }
  
  // React Native - this is a simplification, in real RN apps
  // you would use NetInfo to check connectivity
  return true;
}

/**
 * Handle offline scenarios by returning cached data
 * @param {Function} fetchFn - Function to fetch data from API
 * @param {Function} getCacheFn - Function to get data from cache
 * @returns {Promise<Object>} Data from API or cache
 */
export async function handleOfflineScenario(fetchFn, getCacheFn) {
  // Check if online
  if (isOnline()) {
    try {
      // Try API request first
      return await fetchFn();
    } catch (error) {
      console.warn('API request failed, falling back to cache:', error);
      // Fall back to cache if API request fails
      return await getCacheFn();
    }
  } else {
    // Offline - use cache directly
    return await getCacheFn();
  }
}