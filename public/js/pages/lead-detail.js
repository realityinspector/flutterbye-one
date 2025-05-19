/**
 * Lead Detail Page Controller
 * Handles lead detail display and call tracking functionality
 */

document.addEventListener('DOMContentLoaded', async function() {
  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const leadId = urlParams.get('id');
  const action = urlParams.get('action');

  // Get container reference
  const leadContainer = document.getElementById('leadContainer');

  if (!leadId) {
    showErrorMessage(
      leadContainer,
      'Missing Lead ID',
      'A lead ID is required to view lead details. Please select a lead from the leads page.',
      'Go to Leads Page',
      '/leads.html'
    );
    return;
  }

  try {
    // Initialize services
    const apiClient = new APIClient();
    const storageManager = new StorageManager('flutterbye-crm');
    const leadService = new LeadService(apiClient, storageManager);
    const callService = new CallService(apiClient, storageManager);

    // Check authentication before proceeding
    try {
      const authCheck = await apiClient.checkAuth();
      if (!authCheck.authenticated) {
        console.warn('User not authenticated, redirecting to login');
        window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.href);
        return;
      }

      // Store the token again to ensure it's available for API calls
      if (authCheck.token) {
        localStorage.setItem('auth_token', authCheck.token);
        document.cookie = `auth_token=${authCheck.token}; path=/; max-age=86400`;
        console.log('Authentication token refreshed and stored');
      }

      console.log('Authentication confirmed, user:', authCheck.user);
    } catch (error) {
      console.warn('Auth check failed:', error);
      // Continue anyway and let the API calls handle auth errors
    }

    // Display loading state
    leadContainer.innerHTML = `
      <div class="lead-info" style="padding: 20px; text-align: center;">
        <h2>Loading Lead...</h2>
        <p>Please wait while we load the lead details.</p>
      </div>
    `;

    // Fetch lead data
    let lead;
    try {
      lead = await leadService.get(leadId);
    } catch (error) {
      // Handle the specific API error for leads
      console.warn('Failed to get lead:', error.message);
      showErrorMessage(
        leadContainer,
        'Lead Not Available',
        'The requested lead could not be found or you don\'t have permission to view it.',
        'Return to Leads',
        '/leads.html'
      );
      return;
    }

    // Handle missing lead data
    if (!lead || !lead.id) {
      showErrorMessage(
        leadContainer,
        'Lead Not Found',
        'The requested lead could not be found. It may have been deleted or you may not have permission to view it.',
        'Return to Leads',
        '/leads.html'
      );
      return;
    }

    // Render lead details
    renderLeadDetails(lead);

    // If action is 'call', initialize call tracker
    if (action === 'call') {
      try {
        console.log(`Initializing call tracker for lead ID: ${lead.id}`);

        // Create call tracker container if it doesn't exist
        let callInterfaceContainer = document.getElementById('callInterface');
        if (!callInterfaceContainer) {
          callInterfaceContainer = document.createElement('div');
          callInterfaceContainer.className = 'call-interface';
          callInterfaceContainer.id = 'callInterface';
          document.body.appendChild(callInterfaceContainer);
        }

        const callTracker = new CallTracker(lead.id, callService, {
          containerSelector: '#callInterface',
          onCallEnd: async (call) => {
            try {
              await leadService.update(lead.id, {
                status: 'contacted',
                lastContactedAt: new Date().toISOString()
              });
              setTimeout(() => {
                window.location.href = `/lead-detail.html?id=${lead.id}`;
              }, 2000);
            } catch (error) {
              console.error('Error updating lead after call:', error);
            }
          },
          onCallCancel: () => {
            window.location.href = `/lead-detail.html?id=${lead.id}`;
          }
        });

        // Initialize call tracker
        callTracker.init().then(() => {
          // If the action parameter is 'call', automatically start the call
          if (action === 'call') {
            // Start the call in our system after a short delay
            setTimeout(() => callTracker.startCall(), 500);
          }
        }).catch(error => {
          console.error('Error initializing call tracker:', error);
        });
      } catch (error) {
        console.error('Error initializing call tracker:', error);
      }
    }
  } catch (error) {
    console.error('Error loading lead:', error);

    // Provide different error messages based on error type
    let errorTitle = 'Error Loading Lead';
    let errorMessage = 'An unexpected error occurred while loading the lead details.';

    if (error.message && error.message.includes('authentication')) {
      errorTitle = 'Authentication Error';
      errorMessage = 'Your session may have expired. Please login again.';
    } else if (error.message && error.message.includes('network')) {
      errorTitle = 'Network Error';
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    }

    showErrorMessage(
      leadContainer,
      errorTitle,
      errorMessage,
      'Return to Leads',
      '/leads.html'
    );
  }
});

/**
 * Display an error message in the given container
 * @param {HTMLElement} container - Container element
 * @param {string} title - Error title
 * @param {string} message - Error message
 * @param {string} buttonText - Text for the action button
 * @param {string} buttonUrl - URL for the action button
 */
function showErrorMessage(container, title, message, buttonText = 'Return to Leads', buttonUrl = '/leads.html') {
  container.innerHTML = `
    <div class="lead-info" style="padding: 20px; text-align: center;">
      <h2>${title}</h2>
      <p>${message}</p>
      <a href="${buttonUrl}" class="btn btn-primary" style="display: inline-block; margin-top: 20px;">${buttonText}</a>
    </div>
  `;
}

/**
 * Render lead details in the container
 * @param {Object} lead - Lead data
 */
function renderLeadDetails(lead) {
  const leadContainer = document.getElementById('leadContainer');

  // Format the status display
  const getStatusClass = (status) => {
    const statusMap = {
      'new': 'new',
      'contacted': 'contacted',
      'qualified': 'qualified',
      'unqualified': 'unqualified',
      'proposal': 'proposal',
      'negotiation': 'negotiation',
      'closed-won': 'closed-won',
      'closed-lost': 'closed-lost'
    };
    
    return statusMap[status] || 'new';
  };

  // Format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Full lead details markup
  leadContainer.innerHTML = `
    <div class="lead-header">
      <div>
        <h2 class="lead-title">${lead.fullName || 'Unnamed Contact'}</h2>
        <p class="lead-subtitle">${lead.companyName || 'No Company'}</p>
      </div>
      <div class="lead-actions">
        <button class="btn btn-primary" id="callLeadBtn">
          <i class="fas fa-phone-alt"></i> Call
        </button>
        <button class="btn btn-secondary" id="editLeadBtn">
          <i class="fas fa-edit"></i> Edit
        </button>
      </div>
    </div>

    <div class="lead-content">
      <div class="lead-info">
        <div class="lead-section">
          <h3>Contact Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Phone</div>
              <div class="info-value" id="lead-phone">${lead.phone || 'No phone'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">${lead.email || 'No email'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Job Title</div>
              <div class="info-value">${lead.jobTitle || 'Unknown'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Location</div>
              <div class="info-value">${lead.location || 'Unknown'}</div>
            </div>
          </div>
        </div>

        <div class="lead-section">
          <h3>Lead Details</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Source</div>
              <div class="info-value">${lead.source || 'Unknown'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Lead Value</div>
              <div class="info-value">$${lead.value || '0'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Last Contacted</div>
              <div class="info-value">${formatDate(lead.lastContactedAt) || 'Never'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Created</div>
              <div class="info-value">${formatDate(lead.createdAt)}</div>
            </div>
          </div>
        </div>

        <div class="lead-section">
          <h3>Notes</h3>
          <div class="notes-text">
            ${lead.notes || 'No notes available for this lead.'}
          </div>
        </div>
      </div>

      <div class="sidebar">
        <div class="sidebar-card">
          <h3 style="margin-top: 0; margin-bottom: 10px;">Lead Status</h3>
          <div class="status-pill ${getStatusClass(lead.status)}">
            ${lead.status || 'New'}
          </div>
          <div style="margin-top: 15px;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="font-weight: 500; margin-right: 8px;">Priority:</span>
              <div class="lead-priority" data-priority="${lead.priority || 1}">
                ${Array(5).fill(0).map((_, i) => `
                  <i class="fas fa-star ${i < (lead.priority || 1) ? 'active' : ''}"></i>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <div class="sidebar-card">
          <h3 style="margin-top: 0; margin-bottom: 10px;">Recent Activities</h3>
          <div class="timeline" id="activitiesTimeline">
            <div class="timeline-item">
              <div class="timeline-icon">
                <i class="fas fa-plus"></i>
              </div>
              <div class="timeline-content">
                <div class="timeline-title">Lead Created</div>
                <div class="timeline-date">${formatDate(lead.createdAt)}</div>
              </div>
            </div>
            ${lead.lastContactedAt ? `
              <div class="timeline-item">
                <div class="timeline-icon">
                  <i class="fas fa-phone-alt"></i>
                </div>
                <div class="timeline-content">
                  <div class="timeline-title">Last Contacted</div>
                  <div class="timeline-date">${formatDate(lead.lastContactedAt)}</div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;

  // Add event listeners
  document.getElementById('callLeadBtn').addEventListener('click', () => {
    window.location.href = `/lead-detail.html?id=${lead.id}&action=call`;
  });

  document.getElementById('editLeadBtn').addEventListener('click', () => {
    // This could open an edit modal or redirect to an edit page
    alert('Edit functionality not implemented yet');
  });
}