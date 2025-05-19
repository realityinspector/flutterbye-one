/**
 * DashboardController - Dashboard page controller
 * Manages the dashboard view and interactions
 */
class DashboardController {
  /**
   * Create a new DashboardController instance
   */
  constructor() {
    // Initialize services
    this.apiClient = apiClient;
    this.storageManager = storageManager;
    this.leadService = new LeadService(this.apiClient, this.storageManager);
    this.callService = new CallService(this.apiClient, this.storageManager);
    
    // UI elements
    this.leadContainer = document.getElementById('recent-leads-container');
    this.callContainer = document.getElementById('recent-calls-container');
    this.statsContainer = document.getElementById('stats-container');
    
    // State
    this.currentUser = null;
    this.recentLeads = [];
    this.recentCalls = [];
    this.stats = {};
  }

  /**
   * Initialize the dashboard
   */
  async init() {
    try {
      // Explicitly hide loading indicator at startup
      this.showLoading(false);
      
      // Check authentication first
      await this.checkAuth();
      
      // Load all data concurrently
      await Promise.all([
        this.loadRecentLeads(),
        this.loadRecentCalls(),
        this.loadDashboardStats()
      ]);
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Show notifications for any due reminders
      this.checkDueReminders();
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      this.showError('Failed to initialize dashboard. Please try refreshing the page.');
    }
  }

  /**
   * Check authentication status
   */
  async checkAuth() {
    try {
      const response = await this.apiClient.checkAuth();
      
      if (response.authenticated) {
        this.currentUser = response.user;
        this.updateUserInfo();
      } else {
        // Redirect to login if not authenticated
        window.location.href = '/login.html';
      }
    } catch (error) {
      console.error('Authentication error:', error);
      // Redirect to login
      window.location.href = '/login.html';
    }
  }

  /**
   * Update the user info display
   */
  updateUserInfo() {
    const userInfoElement = document.getElementById('user-info');
    
    if (userInfoElement && this.currentUser) {
      userInfoElement.innerHTML = `
        <span class="user-name">${this.currentUser.fullName || this.currentUser.username}</span>
        <span class="user-company">${this.currentUser.companyName || ''}</span>
      `;
    }
  }

  /**
   * Load recent leads
   */
  async loadRecentLeads() {
    try {
      // Get the most recent leads (limit to 5)
      const leads = await this.leadService.list({ limit: 5 });
      this.recentLeads = leads;
      
      // Render leads
      this.renderLeads();
    } catch (error) {
      console.error('Error loading recent leads:', error);
      this.showError('Failed to load recent leads');
    }
  }

  /**
   * Load recent calls
   */
  async loadRecentCalls() {
    try {
      // Get the most recent calls (limit to 5)
      const calls = await this.callService.getCallHistory();
      this.recentCalls = calls.slice(0, 5);
      
      // Render calls
      this.renderCalls();
    } catch (error) {
      console.error('Error loading recent calls:', error);
      this.showError('Failed to load recent calls');
    }
  }

  /**
   * Load dashboard statistics
   */
  async loadDashboardStats() {
    try {
      // Get dashboard stats from API
      const response = await fetch('/api/analytics/dashboard');
      const data = await response.json();
      
      if (data.success) {
        this.stats = data.data;
        this.renderStats();
      } else {
        throw new Error(data.message || 'Failed to load dashboard statistics');
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      this.showError('Failed to load dashboard statistics');
    }
  }

  /**
   * Render leads in the container
   */
  renderLeads() {
    if (!this.leadContainer) return;
    
    // Clear the container
    this.leadContainer.innerHTML = '';
    
    if (this.recentLeads.length === 0) {
      this.leadContainer.innerHTML = '<div class="no-data">No recent leads</div>';
      return;
    }
    
    // Render each lead card
    this.recentLeads.forEach(lead => {
      const leadCard = new LeadCard(lead, {
        compact: true,
        onCall: (lead) => this.handleCallLead(lead),
        onEdit: (lead) => this.handleEditLead(lead),
        onDelete: (lead) => this.handleDeleteLead(lead)
      });
      
      leadCard.attachTo(this.leadContainer);
    });
  }

  /**
   * Render calls in the container
   */
  renderCalls() {
    if (!this.callContainer) return;
    
    // Clear the container
    this.callContainer.innerHTML = '';
    
    if (this.recentCalls.length === 0) {
      this.callContainer.innerHTML = '<div class="no-data">No recent calls</div>';
      return;
    }
    
    // Create a table for the calls
    const table = document.createElement('table');
    table.className = 'calls-table';
    
    // Add header
    table.innerHTML = `
      <thead>
        <tr>
          <th>Lead</th>
          <th>Date</th>
          <th>Duration</th>
          <th>Outcome</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    
    const tbody = table.querySelector('tbody');
    
    // Add calls
    this.recentCalls.forEach(call => {
      // Find the associated lead
      const lead = this.recentLeads.find(l => l.id === call.leadId) || { globalLead: { companyName: 'Unknown' } };
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${lead.globalLead.companyName}</td>
        <td>${call.getStartTimeText()}</td>
        <td>${call.getDurationText()}</td>
        <td>${call.getOutcomeText()}</td>
      `;
      
      tbody.appendChild(row);
    });
    
    this.callContainer.appendChild(table);
  }

  /**
   * Render dashboard statistics
   */
  renderStats() {
    if (!this.statsContainer) return;
    
    // Clear the container
    this.statsContainer.innerHTML = '';
    
    // Create stats cards
    const stats = this.stats;
    
    const statsHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.leadCount || 0}</div>
          <div class="stat-label">Total Leads</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.callCount || 0}</div>
          <div class="stat-label">Total Calls</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.newLeadCount || 0}</div>
          <div class="stat-label">New Leads</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.callsThisWeek || 0}</div>
          <div class="stat-label">Calls This Week</div>
        </div>
      </div>
    `;
    
    this.statsContainer.innerHTML = statsHTML;
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshDashboard());
    }
    
    // View all leads button
    const viewLeadsBtn = document.getElementById('view-all-leads');
    if (viewLeadsBtn) {
      viewLeadsBtn.addEventListener('click', () => {
        window.location.href = '/leads.html';
      });
    }
    
    // View all calls button
    const viewCallsBtn = document.getElementById('view-all-calls');
    if (viewCallsBtn) {
      viewCallsBtn.addEventListener('click', () => {
        window.location.href = '/calls.html';
      });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }
  }

  /**
   * Refresh all dashboard data
   */
  async refreshDashboard() {
    try {
      // Show loading state
      this.showLoading(true);
      
      // Clear cache to ensure fresh data
      this.leadService.clearCache();
      this.callService.clearCache();
      
      // Load all data concurrently
      await Promise.all([
        this.loadRecentLeads(),
        this.loadRecentCalls(),
        this.loadDashboardStats()
      ]);
      
      // Hide loading state
      this.showLoading(false);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      this.showError('Failed to refresh dashboard data');
      this.showLoading(false);
    }
  }

  /**
   * Show/hide loading state
   */
  showLoading(isLoading) {
    const loadingElement = document.getElementById('loading-indicator');
    
    if (loadingElement) {
      loadingElement.style.display = isLoading ? 'block' : 'none';
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    // Use the modal manager if available
    if (typeof modalManager !== 'undefined') {
      modalManager.alert(message, { title: 'Error' });
    } else {
      alert(message);
    }
  }

  /**
   * Handle calling a lead
   */
  handleCallLead(lead) {
    // Navigate to the lead detail page with call option
    window.location.href = `/lead-detail.html?id=${lead.id}&action=call`;
  }

  /**
   * Handle editing a lead
   */
  handleEditLead(lead) {
    // Navigate to the lead edit page
    window.location.href = `/lead-edit.html?id=${lead.id}`;
  }

  /**
   * Handle deleting a lead
   */
  async handleDeleteLead(lead) {
    // Use the modal manager if available
    if (typeof modalManager !== 'undefined') {
      const confirmed = await modalManager.confirm(
        `Are you sure you want to delete ${lead.getDisplayName()}?`,
        { title: 'Confirm Deletion' }
      );
      
      if (!confirmed) return;
    } else {
      if (!confirm(`Are you sure you want to delete ${lead.getDisplayName()}?`)) {
        return;
      }
    }
    
    try {
      // Delete the lead
      await this.leadService.delete(lead.id);
      
      // Remove from list and re-render
      this.recentLeads = this.recentLeads.filter(l => l.id !== lead.id);
      this.renderLeads();
      
      // Reload stats
      this.loadDashboardStats();
    } catch (error) {
      console.error('Error deleting lead:', error);
      this.showError(`Failed to delete lead: ${error.message}`);
    }
  }

  /**
   * Handle logout
   */
  async handleLogout() {
    try {
      // Call logout API
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      
      // Clear local storage
      localStorage.removeItem('auth_token');
      
      // Redirect to login
      window.location.href = '/login.html';
    } catch (error) {
      console.error('Logout error:', error);
      this.showError('Failed to logout. Please try again.');
    }
  }

  /**
   * Check for due reminders
   */
  async checkDueReminders() {
    try {
      const dueReminders = await this.leadService.getDueReminders();
      
      if (dueReminders.length > 0) {
        // Show notification
        const message = dueReminders.length === 1
          ? `You have a follow-up reminder due for ${dueReminders[0].getDisplayName()}`
          : `You have ${dueReminders.length} follow-up reminders due`;
          
        // Use the modal manager if available
        if (typeof modalManager !== 'undefined') {
          modalManager.alert(message, {
            title: 'Reminder',
            confirmText: 'View Reminders'
          });
        } else {
          alert(message);
        }
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const dashboardController = new DashboardController();
  dashboardController.init();
});