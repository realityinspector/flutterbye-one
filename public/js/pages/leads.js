/**
 * LeadsController - Leads page controller
 * Manages the leads view and interactions
 */
class LeadsController {
  /**
   * Create a new LeadsController instance
   */
  constructor() {
    // Initialize services
    this.apiClient = apiClient;
    this.storageManager = storageManager;
    this.leadService = new LeadService(this.apiClient, this.storageManager);
    this.callService = new CallService(this.apiClient, this.storageManager);
    
    // UI elements
    this.leadsContainer = document.getElementById('leads-container');
    this.filtersContainer = document.getElementById('filters-container');
    this.searchInput = document.getElementById('search-input');
    this.statusFilter = document.getElementById('status-filter');
    this.sortSelect = document.getElementById('sort-select');
    this.loadingIndicator = document.getElementById('loading-indicator');
    
    // State
    this.leads = [];
    this.filteredLeads = [];
    this.filters = {
      search: '',
      status: 'all',
      sort: 'updated-desc'
    };
  }

  /**
   * Initialize the leads page
   */
  async init() {
    try {
      // Check authentication first
      await this.checkAuth();
      
      // Show loading state
      this.showLoading(true);
      
      // Load all leads
      await this.loadLeads();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Apply initial filters
      this.applyFilters();
      
      // Hide loading state
      this.showLoading(false);
    } catch (error) {
      console.error('Error initializing leads page:', error);
      this.showError('Failed to initialize leads page. Please try refreshing the page.');
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
   * Load all leads
   */
  async loadLeads() {
    try {
      // Get all leads
      const leads = await this.leadService.list();
      this.leads = leads;
      
      // Initialize filtered leads
      this.filteredLeads = [...leads];
    } catch (error) {
      console.error('Error loading leads:', error);
      this.showError('Failed to load leads');
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.filters.search = this.searchInput.value.trim().toLowerCase();
        this.applyFilters();
      });
    }
    
    // Status filter
    if (this.statusFilter) {
      this.statusFilter.addEventListener('change', () => {
        this.filters.status = this.statusFilter.value;
        this.applyFilters();
      });
    }
    
    // Sort select
    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', () => {
        this.filters.sort = this.sortSelect.value;
        this.applyFilters();
      });
    }
    
    // Add lead button
    const addLeadBtn = document.getElementById('add-lead-btn');
    if (addLeadBtn) {
      addLeadBtn.addEventListener('click', () => this.handleAddLead());
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshLeads());
    }
  }

  /**
   * Apply filters and sort to leads
   */
  applyFilters() {
    let filtered = [...this.leads];
    
    // Apply search filter
    if (this.filters.search) {
      filtered = filtered.filter(lead => {
        // Search in company name
        if (lead.globalLead.companyName.toLowerCase().includes(this.filters.search)) {
          return true;
        }
        
        // Search in contact name
        if (lead.globalLead.contactName && lead.globalLead.contactName.toLowerCase().includes(this.filters.search)) {
          return true;
        }
        
        // Search in email
        if (lead.globalLead.email && lead.globalLead.email.toLowerCase().includes(this.filters.search)) {
          return true;
        }
        
        // Search in phone
        if (lead.globalLead.phoneNumber && lead.globalLead.phoneNumber.includes(this.filters.search)) {
          return true;
        }
        
        // Search in notes
        if (lead.notes && lead.notes.toLowerCase().includes(this.filters.search)) {
          return true;
        }
        
        return false;
      });
    }
    
    // Apply status filter
    if (this.filters.status !== 'all') {
      filtered = filtered.filter(lead => lead.status === this.filters.status);
    }
    
    // Apply sorting
    switch (this.filters.sort) {
      case 'name-asc':
        filtered.sort((a, b) => a.globalLead.companyName.localeCompare(b.globalLead.companyName));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.globalLead.companyName.localeCompare(a.globalLead.companyName));
        break;
      case 'created-asc':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'created-desc':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'updated-asc':
        filtered.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
        break;
      case 'updated-desc':
        filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        break;
      case 'priority-asc':
        filtered.sort((a, b) => a.priority - b.priority);
        break;
      case 'priority-desc':
        filtered.sort((a, b) => b.priority - a.priority);
        break;
    }
    
    // Update filtered leads
    this.filteredLeads = filtered;
    
    // Render the filtered leads
    this.renderLeads();
  }

  /**
   * Render leads in the container
   */
  renderLeads() {
    if (!this.leadsContainer) return;
    
    // Clear the container
    this.leadsContainer.innerHTML = '';
    
    if (this.filteredLeads.length === 0) {
      this.leadsContainer.innerHTML = '<div class="no-data">No leads found</div>';
      return;
    }
    
    // Render each lead card
    this.filteredLeads.forEach(lead => {
      const leadCard = new LeadCard(lead, {
        onCall: (lead) => this.handleCallLead(lead),
        onEdit: (lead) => this.handleEditLead(lead),
        onDelete: (lead) => this.handleDeleteLead(lead),
        onStatusChange: (lead, status) => this.handleStatusChange(lead, status),
        onPriorityChange: (lead, priority) => this.handlePriorityChange(lead, priority)
      });
      
      leadCard.attachTo(this.leadsContainer);
    });
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
   * Refresh leads data
   */
  async refreshLeads() {
    try {
      // Show loading state
      this.showLoading(true);
      
      // Clear cache to ensure fresh data
      this.leadService.clearCache();
      
      // Load leads
      await this.loadLeads();
      
      // Apply filters
      this.applyFilters();
      
      // Hide loading state
      this.showLoading(false);
    } catch (error) {
      console.error('Error refreshing leads:', error);
      this.showError('Failed to refresh leads data');
      this.showLoading(false);
    }
  }

  /**
   * Handle adding a new lead
   */
  handleAddLead() {
    // Use the modal manager if available
    if (typeof modalManager !== 'undefined') {
      modalManager.form({
        fields: [
          {
            name: 'companyName',
            label: 'Company Name',
            type: 'text',
            required: true
          },
          {
            name: 'contactName',
            label: 'Contact Name',
            type: 'text'
          },
          {
            name: 'phoneNumber',
            label: 'Phone Number',
            type: 'tel'
          },
          {
            name: 'email',
            label: 'Email',
            type: 'email'
          },
          {
            name: 'address',
            label: 'Address',
            type: 'text'
          },
          {
            name: 'city',
            label: 'City',
            type: 'text'
          },
          {
            name: 'state',
            label: 'State',
            type: 'text'
          },
          {
            name: 'zipCode',
            label: 'Zip Code',
            type: 'text'
          },
          {
            name: 'industry',
            label: 'Industry',
            type: 'text'
          },
          {
            name: 'website',
            label: 'Website',
            type: 'url'
          },
          {
            name: 'notes',
            label: 'Notes',
            type: 'textarea',
            rows: 4
          }
        ]
      }, { title: 'Add New Lead' }).then(async (values) => {
        if (!values) return;
        
        try {
          // Show loading state
          this.showLoading(true);
          
          // Create the new lead
          const newLead = await this.leadService.create({
            status: 'new',
            priority: 3,
            notes: values.notes || '',
            globalLead: {
              companyName: values.companyName,
              contactName: values.contactName || '',
              phoneNumber: values.phoneNumber || '',
              email: values.email || '',
              address: values.address || '',
              city: values.city || '',
              state: values.state || '',
              zipCode: values.zipCode || '',
              industry: values.industry || '',
              website: values.website || ''
            }
          });
          
          // Add to leads array
          this.leads.push(newLead);
          
          // Apply filters
          this.applyFilters();
          
          // Hide loading state
          this.showLoading(false);
        } catch (error) {
          console.error('Error creating lead:', error);
          this.showError(`Failed to create lead: ${error.message}`);
          this.showLoading(false);
        }
      });
    } else {
      // Fallback to redirect
      window.location.href = '/lead-add.html';
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
            
            // Refresh leads
            this.refreshLeads();
            
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

  /**
   * Handle editing a lead
   */
  handleEditLead(lead) {
    // Use the modal manager if available
    if (typeof modalManager !== 'undefined') {
      modalManager.form({
        fields: [
          {
            name: 'companyName',
            label: 'Company Name',
            type: 'text',
            value: lead.globalLead.companyName,
            required: true
          },
          {
            name: 'contactName',
            label: 'Contact Name',
            type: 'text',
            value: lead.globalLead.contactName || ''
          },
          {
            name: 'phoneNumber',
            label: 'Phone Number',
            type: 'tel',
            value: lead.globalLead.phoneNumber || ''
          },
          {
            name: 'email',
            label: 'Email',
            type: 'email',
            value: lead.globalLead.email || ''
          },
          {
            name: 'address',
            label: 'Address',
            type: 'text',
            value: lead.globalLead.address || ''
          },
          {
            name: 'city',
            label: 'City',
            type: 'text',
            value: lead.globalLead.city || ''
          },
          {
            name: 'state',
            label: 'State',
            type: 'text',
            value: lead.globalLead.state || ''
          },
          {
            name: 'zipCode',
            label: 'Zip Code',
            type: 'text',
            value: lead.globalLead.zipCode || ''
          },
          {
            name: 'industry',
            label: 'Industry',
            type: 'text',
            value: lead.globalLead.industry || ''
          },
          {
            name: 'website',
            label: 'Website',
            type: 'url',
            value: lead.globalLead.website || ''
          },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            value: lead.status,
            options: [
              { value: 'new', label: 'New' },
              { value: 'contacted', label: 'Contacted' },
              { value: 'qualified', label: 'Qualified' },
              { value: 'proposal', label: 'Proposal' },
              { value: 'negotiation', label: 'Negotiation' },
              { value: 'closed', label: 'Closed (Won)' },
              { value: 'lost', label: 'Closed (Lost)' }
            ]
          },
          {
            name: 'priority',
            label: 'Priority (1-5)',
            type: 'number',
            value: lead.priority
          },
          {
            name: 'notes',
            label: 'Notes',
            type: 'textarea',
            rows: 4,
            value: lead.notes || ''
          }
        ]
      }, { title: `Edit Lead: ${lead.getDisplayName()}` }).then(async (values) => {
        if (!values) return;
        
        try {
          // Show loading state
          this.showLoading(true);
          
          // Update the lead
          const updatedLead = await this.leadService.update(lead.id, {
            status: values.status,
            priority: parseInt(values.priority, 10),
            notes: values.notes || '',
            globalLead: {
              id: lead.globalLead.id,
              companyName: values.companyName,
              contactName: values.contactName || '',
              phoneNumber: values.phoneNumber || '',
              email: values.email || '',
              address: values.address || '',
              city: values.city || '',
              state: values.state || '',
              zipCode: values.zipCode || '',
              industry: values.industry || '',
              website: values.website || ''
            }
          });
          
          // Update in leads array
          const index = this.leads.findIndex(l => l.id === lead.id);
          if (index !== -1) {
            this.leads[index] = updatedLead;
          }
          
          // Apply filters
          this.applyFilters();
          
          // Hide loading state
          this.showLoading(false);
        } catch (error) {
          console.error('Error updating lead:', error);
          this.showError(`Failed to update lead: ${error.message}`);
          this.showLoading(false);
        }
      });
    } else {
      // Fallback to redirect
      window.location.href = `/lead-edit.html?id=${lead.id}`;
    }
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
      // Show loading state
      this.showLoading(true);
      
      // Delete the lead
      await this.leadService.delete(lead.id);
      
      // Remove from leads array
      this.leads = this.leads.filter(l => l.id !== lead.id);
      
      // Apply filters
      this.applyFilters();
      
      // Hide loading state
      this.showLoading(false);
    } catch (error) {
      console.error('Error deleting lead:', error);
      this.showError(`Failed to delete lead: ${error.message}`);
      this.showLoading(false);
    }
  }

  /**
   * Handle changing a lead's status
   */
  async handleStatusChange(lead, status) {
    try {
      // Update the lead
      const updatedLead = await this.leadService.updateStatus(lead.id, status);
      
      // Update in leads array
      const index = this.leads.findIndex(l => l.id === lead.id);
      if (index !== -1) {
        this.leads[index] = updatedLead;
      }
      
      // Apply filters
      this.applyFilters();
    } catch (error) {
      console.error('Error updating lead status:', error);
      this.showError(`Failed to update status: ${error.message}`);
    }
  }

  /**
   * Handle changing a lead's priority
   */
  async handlePriorityChange(lead, priority) {
    try {
      // Update the lead
      const updatedLead = await this.leadService.updatePriority(lead.id, priority);
      
      // Update in leads array
      const index = this.leads.findIndex(l => l.id === lead.id);
      if (index !== -1) {
        this.leads[index] = updatedLead;
      }
      
      // Apply filters
      this.applyFilters();
    } catch (error) {
      console.error('Error updating lead priority:', error);
      this.showError(`Failed to update priority: ${error.message}`);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const leadsController = new LeadsController();
  leadsController.init();
});