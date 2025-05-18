/**
 * API Adapter - Adapts the existing server API to work with our refactored client
 * Provides a bridge between the existing API and the new API interface
 */

// Override some APIClient methods to work with the existing server API
document.addEventListener('DOMContentLoaded', () => {
  if (typeof apiClient !== 'undefined') {
    // Store original methods
    const originalCheckAuth = apiClient.checkAuth;
    const originalGetLeads = apiClient.getLeads;
    const originalGetCalls = apiClient.getCalls;
    
    // Override checkAuth to work with the existing /api/auth/check endpoint
    apiClient.checkAuth = async function() {
      try {
        // First try the dashboard-check endpoint
        console.log('Using dashboard-check endpoint');
        const response = await fetch('/dashboard-check', {
          method: 'GET',
          headers: {
            'Authorization': this.token ? `Bearer ${this.token}` : ''
          },
          credentials: 'include'  // Include cookies
        });
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Dashboard check result:', result);
        return result;
      } catch (error) {
        console.error('Dashboard check failed:', error);
        
        // Try the /api/auth/check endpoint
        try {
          console.log('Trying /api/auth/check endpoint');
          const response = await fetch('/api/auth/check', {
            method: 'GET',
            headers: {
              'Authorization': this.token ? `Bearer ${this.token}` : ''
            },
            credentials: 'include'  // Include cookies
          });
          
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }
          
          const result = await response.json();
          console.log('Auth check result:', result);
          return result;
        } catch (authError) {
          console.error('Auth check failed:', authError);
          
          // Fall back to the original implementation as a last resort
          try {
            return await originalCheckAuth.call(this);
          } catch (fallbackError) {
            console.error('All auth checks failed:', fallbackError);
            return { authenticated: false };
          }
        }
      }
    };
    
    // Override getLeads to work with the existing /api/leads endpoint
    apiClient.getLeads = async function(filters = {}) {
      try {
        // First try the new endpoint
        return await originalGetLeads.call(this, filters);
      } catch (error) {
        // If it fails, try the existing endpoint
        console.log('Falling back to legacy leads endpoint');
        const queryParams = new URLSearchParams();
        
        // Add any filters to query string
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            queryParams.append(key, value);
          }
        });
        
        const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const response = await fetch(`/api/leads${query}`, {
          method: 'GET',
          headers: {
            'Authorization': this.token ? `Bearer ${this.token}` : ''
          }
        });
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        return await response.json();
      }
    };
    
    // Override getCalls to work with the existing /api/calls endpoint
    apiClient.getCalls = async function(leadId = null) {
      try {
        // First try the new endpoint
        return await originalGetCalls.call(this, leadId);
      } catch (error) {
        // If it fails, try the existing endpoint
        console.log('Falling back to legacy calls endpoint');
        const query = leadId ? `?userLeadId=${leadId}` : '';
        const response = await fetch(`/api/calls${query}`, {
          method: 'GET',
          headers: {
            'Authorization': this.token ? `Bearer ${this.token}` : ''
          }
        });
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        return await response.json();
      }
    };
  }
});