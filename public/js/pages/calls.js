/**
 * CallsController - Calls page controller
 * Manages the calls view and interactions
 */
class CallsController {
  /**
   * Create a new CallsController instance
   */
  constructor() {
    // Initialize services
    this.apiClient = apiClient;
    this.storageManager = storageManager;
    this.leadService = new LeadService(this.apiClient, this.storageManager);
    this.callService = new CallService(this.apiClient, this.storageManager);
    
    // UI elements
    this.callsContainer = document.getElementById('calls-container');
    this.filtersContainer = document.getElementById('filters-container');
    this.dateRangeStart = document.getElementById('date-range-start');
    this.dateRangeEnd = document.getElementById('date-range-end');
    this.outcomeFilter = document.getElementById('outcome-filter');
    this.leadFilter = document.getElementById('lead-filter');
    this.loadingIndicator = document.getElementById('loading-indicator');
    
    // State
    this.calls = [];
    this.filteredCalls = [];
    this.leads = [];
    this.filters = {
      dateStart: null,
      dateEnd: null,
      outcome: 'all',
      leadId: 'all'
    };
  }

  /**
   * Initialize the calls page
   */
  async init() {
    try {
      // Check authentication first
      await this.checkAuth();
      
      // Show loading state
      this.showLoading(true);
      
      // Load data concurrently
      await Promise.all([
        this.loadCalls(),
        this.loadLeads()
      ]);
      
      // Populate lead filter
      this.populateLeadFilter();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Apply initial filters
      this.applyFilters();
      
      // Hide loading state
      this.showLoading(false);
    } catch (error) {
      console.error('Error initializing calls page:', error);
      this.showError('Failed to initialize calls page. Please try refreshing the page.');
      this.showLoading(false);
    }
  }

  /**
   * Check authentication status
   */
  async checkAuth() {
    try {
      const response = await this.apiClient.checkAuth();
      
      if (!response.authenticated) {
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
   * Load all calls
   */
  async loadCalls() {
    try {
      // Get all calls
      const calls = await this.callService.getCallHistory();
      this.calls = calls;
      
      // Initialize filtered calls
      this.filteredCalls = [...calls];
    } catch (error) {
      console.error('Error loading calls:', error);
      this.showError('Failed to load calls');
    }
  }

  /**
   * Load all leads for filters
   */
  async loadLeads() {
    try {
      // Get all leads
      const leads = await this.leadService.list();
      this.leads = leads;
    } catch (error) {
      console.error('Error loading leads:', error);
      this.showError('Failed to load leads for filters');
    }
  }

  /**
   * Populate the lead filter dropdown
   */
  populateLeadFilter() {
    if (!this.leadFilter) return;
    
    // Clear existing options except the "All" option
    while (this.leadFilter.options.length > 1) {
      this.leadFilter.remove(1);
    }
    
    // Add options for each lead
    this.leads.forEach(lead => {
      const option = document.createElement('option');
      option.value = lead.id;
      option.textContent = lead.globalLead.companyName;
      this.leadFilter.appendChild(option);
    });
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Date range filters
    if (this.dateRangeStart) {
      this.dateRangeStart.addEventListener('change', () => {
        this.filters.dateStart = this.dateRangeStart.value ? new Date(this.dateRangeStart.value) : null;
        this.applyFilters();
      });
    }
    
    if (this.dateRangeEnd) {
      this.dateRangeEnd.addEventListener('change', () => {
        this.filters.dateEnd = this.dateRangeEnd.value ? new Date(this.dateRangeEnd.value) : null;
        this.applyFilters();
      });
    }
    
    // Outcome filter
    if (this.outcomeFilter) {
      this.outcomeFilter.addEventListener('change', () => {
        this.filters.outcome = this.outcomeFilter.value;
        this.applyFilters();
      });
    }
    
    // Lead filter
    if (this.leadFilter) {
      this.leadFilter.addEventListener('change', () => {
        this.filters.leadId = this.leadFilter.value;
        this.applyFilters();
      });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshCalls());
    }
    
    // New call button
    const newCallBtn = document.getElementById('new-call-btn');
    if (newCallBtn) {
      newCallBtn.addEventListener('click', () => this.handleNewCall());
    }
  }

  /**
   * Apply filters to calls
   */
  applyFilters() {
    let filtered = [...this.calls];
    
    // Apply date start filter
    if (this.filters.dateStart) {
      filtered = filtered.filter(call => {
        return call.startTime && new Date(call.startTime) >= this.filters.dateStart;
      });
    }
    
    // Apply date end filter
    if (this.filters.dateEnd) {
      // Add one day to include the end date
      const endDate = new Date(this.filters.dateEnd);
      endDate.setDate(endDate.getDate() + 1);
      
      filtered = filtered.filter(call => {
        return call.startTime && new Date(call.startTime) < endDate;
      });
    }
    
    // Apply outcome filter
    if (this.filters.outcome !== 'all') {
      filtered = filtered.filter(call => call.outcome === this.filters.outcome);
    }
    
    // Apply lead filter
    if (this.filters.leadId !== 'all') {
      filtered = filtered.filter(call => call.leadId == this.filters.leadId);
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => {
      return new Date(b.startTime || 0) - new Date(a.startTime || 0);
    });
    
    // Update filtered calls
    this.filteredCalls = filtered;
    
    // Render the filtered calls
    this.renderCalls();
  }

  /**
   * Render calls in the container
   */
  renderCalls() {
    if (!this.callsContainer) return;
    
    // Clear the container
    this.callsContainer.innerHTML = '';
    
    if (this.filteredCalls.length === 0) {
      this.callsContainer.innerHTML = '<div class="no-data">No calls found</div>';
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
          <th>Date & Time</th>
          <th>Duration</th>
          <th>Outcome</th>
          <th>Notes</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    
    const tbody = table.querySelector('tbody');
    
    // Add calls
    this.filteredCalls.forEach(call => {
      // Find the associated lead
      const lead = this.leads.find(l => l.id == call.leadId) || null;
      const leadName = lead ? lead.globalLead.companyName : 'Unknown Lead';
      
      const row = document.createElement('tr');
      row.dataset.callId = call.id;
      
      row.innerHTML = `
        <td>${this._escapeHtml(leadName)}</td>
        <td>${call.getStartTimeText()}</td>
        <td>${call.getDurationText()}</td>
        <td><span class="call-outcome" style="background-color: ${this._getOutcomeColor(call.outcome)}">${call.getOutcomeText()}</span></td>
        <td>${call.getFormattedNotes(50)}</td>
        <td>
          <button class="btn btn-view" data-action="view" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          ${lead ? `
            <button class="btn btn-call" data-action="call" title="Call Again">
              <i class="fas fa-phone"></i>
            </button>
          ` : ''}
        </td>
      `;
      
      // Add event listeners
      const viewBtn = row.querySelector('[data-action="view"]');
      if (viewBtn) {
        viewBtn.addEventListener('click', () => this.handleViewCall(call));
      }
      
      const callBtn = row.querySelector('[data-action="call"]');
      if (callBtn && lead) {
        callBtn.addEventListener('click', () => this.handleCallLead(lead));
      }
      
      tbody.appendChild(row);
    });
    
    this.callsContainer.appendChild(table);
  }

  /**
   * Get a color for a call outcome
   * @private
   * @param {string} outcome - Call outcome
   * @returns {string} CSS color value
   */
  _getOutcomeColor(outcome) {
    const colors = {
      'interested': '#4CAF50',     // Green
      'not_interested': '#F44336', // Red
      'callback': '#2196F3',       // Blue
      'no_answer': '#FF9800',      // Orange
      'left_voicemail': '#9C27B0', // Purple
      'wrong_number': '#9E9E9E'    // Grey
    };
    
    return colors[outcome] || '#9E9E9E'; // Default to grey
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   * @param {string} html - String to escape
   * @returns {string} Escaped string
   */
  _escapeHtml(html) {
    if (typeof html !== 'string') {
      return html;
    }
    
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Show/hide loading state
   */
  showLoading(isLoading) {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = isLoading ? 'block' : 'none';
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
   * Refresh calls data
   */
  async refreshCalls() {
    try {
      // Show loading state
      this.showLoading(true);
      
      // Clear cache to ensure fresh data
      this.callService.clearCache();
      
      // Load calls
      await this.loadCalls();
      
      // Apply filters
      this.applyFilters();
      
      // Hide loading state
      this.showLoading(false);
    } catch (error) {
      console.error('Error refreshing calls:', error);
      this.showError('Failed to refresh calls data');
      this.showLoading(false);
    }
  }

  /**
   * Handle view call details
   */
  handleViewCall(call) {
    // Find the associated lead
    const lead = this.leads.find(l => l.id == call.leadId) || null;
    const leadName = lead ? lead.globalLead.companyName : 'Unknown Lead';
    
    // Format call details
    const callDetails = `
      <div class="call-details">
        <div class="detail-group">
          <div class="detail-label">Lead:</div>
          <div class="detail-value">${this._escapeHtml(leadName)}</div>
        </div>
        <div class="detail-group">
          <div class="detail-label">Date & Time:</div>
          <div class="detail-value">${call.getStartTimeText()}</div>
        </div>
        <div class="detail-group">
          <div class="detail-label">Duration:</div>
          <div class="detail-value">${call.getDurationText()}</div>
        </div>
        <div class="detail-group">
          <div class="detail-label">Outcome:</div>
          <div class="detail-value">
            <span class="call-outcome" style="background-color: ${this._getOutcomeColor(call.outcome)}">
              ${call.getOutcomeText()}
            </span>
          </div>
        </div>
        <div class="detail-group">
          <div class="detail-label">Status:</div>
          <div class="detail-value">${call.getStatusText()}</div>
        </div>
        <div class="detail-group call-notes">
          <div class="detail-label">Notes:</div>
          <div class="detail-value">${call.notes || 'No notes'}</div>
        </div>
      </div>
    `;
    
    // Use the modal manager if available
    if (typeof modalManager !== 'undefined') {
      modalManager.show(callDetails, {
        title: 'Call Details',
        maxWidth: 600,
        onOpen: (modalElement) => {
          // Add action buttons if there's an associated lead
          if (lead) {
            const footer = modalElement.querySelector('.modal-footer');
            
            if (footer) {
              const callBtn = document.createElement('button');
              callBtn.className = 'btn btn-call';
              callBtn.innerHTML = '<i class="fas fa-phone"></i> Call Again';
              callBtn.addEventListener('click', () => {
                modalManager.closeAll();
                this.handleCallLead(lead);
              });
              
              footer.prepend(callBtn);
            }
          }
        }
      });
    } else {
      // Fallback to alert
      alert(`
Call Details:
- Lead: ${leadName}
- Date & Time: ${call.getStartTimeText()}
- Duration: ${call.getDurationText()}
- Outcome: ${call.getOutcomeText()}
- Status: ${call.getStatusText()}
- Notes: ${call.notes || 'No notes'}
      `);
    }
  }

  /**
   * Handle starting a new call
   */
  handleNewCall() {
    // Modal to select a lead
    if (typeof modalManager !== 'undefined') {
      const leadOptions = this.leads.map(lead => ({
        value: lead.id,
        label: lead.globalLead.companyName
      }));
      
      modalManager.form({
        fields: [
          {
            name: 'leadId',
            label: 'Select Lead',
            type: 'select',
            options: leadOptions,
            placeholder: '-- Select a Lead --',
            required: true
          }
        ]
      }, { title: 'New Call' }).then((values) => {
        if (!values) return;
        
        // Find the selected lead
        const leadId = values.leadId;
        const lead = this.leads.find(l => l.id == leadId);
        
        if (lead) {
          this.handleCallLead(lead);
        }
      });
    } else {
      // Fallback to redirect
      window.location.href = '/leads.html?action=call';
    }
  }

  /**
   * Handle calling a lead
   */
  handleCallLead(lead) {
    if (!lead.canMakeCall()) {
      this.showError('This lead does not have a phone number');
      return;
    }
    
    // Create a modal for the call tracker
    if (typeof modalManager !== 'undefined') {
      const callTrackerContainer = document.createElement('div');
      callTrackerContainer.className = 'call-tracker-container';
      
      const modal = modalManager.show(callTrackerContainer, {
        title: `Call ${lead.getDisplayName()}`,
        width: 500,
        closeOnOverlayClick: false,
        onClose: () => {
          // If there's an active call, prompt to confirm
          if (callTracker && callTracker.callService.hasActiveCall()) {
            return confirm('There is an active call. Are you sure you want to close?');
          }
          return true;
        }
      });
      
      // Initialize call tracker
      const callTracker = new CallTracker(lead.id, this.callService, {
        containerSelector: callTrackerContainer,
        onCallStart: () => {
          // Update modal title
          modal.modal.querySelector('.modal-header h3').textContent = `On Call: ${lead.getDisplayName()}`;
        },
        onCallEnd: async (completedCall) => {
          // Update lead as contacted
          try {
            await this.leadService.markAsContacted(lead.id, {
              notes: completedCall.notes
            });
            
            // Refresh calls
            this.refreshCalls();
            
            // Close modal after a delay
            setTimeout(() => {
              modal.close();
            }, 2000);
          } catch (error) {
            console.error('Error updating lead after call:', error);
          }
        },
        onCallCancel: () => {
          // Close modal after a delay
          setTimeout(() => {
            modal.close();
          }, 1000);
        }
      });
      
      callTracker.init();
    } else {
      // Fallback to redirect
      window.location.href = `/lead-detail.html?id=${lead.id}&action=call`;
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const callsController = new CallsController();
  callsController.init();
});