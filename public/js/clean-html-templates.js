/**
 * Clean HTML Templates
 * 
 * This script helps fix issues with HTML template strings in JavaScript
 * by escaping and processing them safely.
 */
(function() {
  console.log('Clean HTML Templates script loaded');
  
  // Function to safely process template strings with HTML
  window.safeTemplateHTML = function(strings, ...values) {
    return strings.reduce((result, string, i) => {
      return result + string + (values[i] !== undefined ? values[i] : '');
    }, '');
  };
  
  // Function to safely create HTML elements from template strings
  window.createElementFromTemplate = function(templateHTML) {
    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = templateHTML.trim();
    
    // Return the first child
    return container.firstChild;
  };
  
  // Helper for notification templates
  window.renderNotificationTemplate = function(title, message, icon, type = 'default') {
    return `
      <div class="notification-icon">
        <i class="fas fa-${icon}"></i>
      </div>
      <div class="notification-content">
        <div class="notification-title">${title}</div>
        <p class="notification-message">${message}</p>
      </div>
      <button class="notification-close">&times;</button>
    `.trim();
  };
  
  // Helper for lead card templates
  window.renderLeadCardTemplate = function(lead, priorityClass, isShared, orgName) {
    return `
      <div class="lead-card-header">
        <h3 class="lead-company">${lead.globalLead.companyName}</h3>
        <div class="lead-status">
          <span class="lead-status-pill ${lead.status}">${lead.status}</span>
          <span class="lead-status-pill ${priorityClass}">Priority ${lead.priority}</span>
          ${isShared ? `<span class="org-pill shared"><i class="fas fa-users"></i>${orgName}</span>` : ''}
        </div>
      </div>
      <div class="lead-card-body">
        <div class="lead-contact-info">
          <div class="lead-contact-item"><i class="fas fa-user"></i>${lead.globalLead.contactName}</div>
          <div class="lead-contact-item"><i class="fas fa-phone"></i>${lead.globalLead.phoneNumber || 'No phone'}</div>
          <div class="lead-contact-item"><i class="fas fa-envelope"></i>${lead.globalLead.email || 'No email'}</div>
        </div>
        <div class="lead-notes">${lead.notes || 'No notes'}</div>
      </div>
      <div class="lead-card-actions">
        <button class="action-btn view-btn"><i class="fas fa-eye"></i>View</button>
        <button class="action-btn call-btn"><i class="fas fa-phone"></i>Call</button>
        <button class="action-btn edit-btn"><i class="fas fa-edit"></i>Edit</button>
      </div>
    `.trim();
  };
  
  // Helper for call card templates
  window.renderCallCardTemplate = function(call) {
    const date = new Date(call.callDate);
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return `
      <div class="call-card-header">
        <span class="call-date">${formattedDate}</span>
        <span class="status ${call.outcome === 'interested' ? 'qualified' : 'new'}">${call.outcome || 'No outcome'}</span>
      </div>
      <div class="call-card-body">
        <div class="call-details">
          <div class="call-detail-item"><i class="fas fa-clock"></i>${call.duration} minutes</div>
          <div class="call-detail-item"><i class="fas fa-comment"></i>${call.notes || 'No notes'}</div>
        </div>
      </div>
    `.trim();
  };
  
  console.log('Clean HTML Templates script initialized');
})();