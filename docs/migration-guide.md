# Migration Guide: Moving to the Refactored Architecture

This guide provides instructions for developers who need to migrate existing code to the new architecture, or who need to understand how the old system maps to the new one.

## Overview of Changes

The refactoring has transformed the codebase from a collection of loosely organized scripts into a structured, layered architecture with clear separation of concerns. Here's how the old code maps to the new structure:

| Old Structure | New Structure |
|---------------|--------------|
| Inline JavaScript in HTML files | Page controllers in `/js/pages/` |
| Direct DOM manipulation | Component-based UI in `/js/components/` |
| Direct API calls | Unified API client in `/js/core/api-client.js` |
| Ad-hoc data handling | Data models in `/js/core/` |
| Mixed business logic | Services in `/js/services/` |
| Scattered CSS styles | Unified CSS in `/css/components.css` |

## Step-by-Step Migration Process

### 1. Initial Setup

Before migrating specific features, ensure you have all the core libraries in place:

```html
<!-- Include Core Files -->
<script src="js/core/api-client.js"></script>
<script src="js/core/storage-manager.js"></script>
<script src="js/core/lead-model.js"></script>
<script src="js/core/call-model.js"></script>
<script src="js/core/api-adapter.js"></script>

<!-- Include Services -->
<script src="js/services/lead-service.js"></script>
<script src="js/services/call-service.js"></script>
<script src="js/services/sync-service.js"></script>

<!-- Include Components -->
<script src="js/components/lead-card.js"></script>
<script src="js/components/call-tracker.js"></script>
<script src="js/components/modal-manager.js"></script>
```

### 2. Migrating Lead Management Features

#### Old Implementation (example):

```javascript
// Direct DOM manipulation and API calls
function displayLeads() {
  fetch('/api/leads')
    .then(response => response.json())
    .then(data => {
      const leadsContainer = document.getElementById('leads-container');
      leadsContainer.innerHTML = '';
      
      data.forEach(lead => {
        const leadElement = document.createElement('div');
        leadElement.className = 'lead-card';
        leadElement.innerHTML = `<h3>${lead.name}</h3>...`;
        leadsContainer.appendChild(leadElement);
      });
    });
}

function updateLead(id, data) {
  fetch(`/api/leads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
  .then(/* ... */);
}
```

#### New Implementation:

```javascript
// In your page controller (e.g., leads.js)
class LeadsController {
  constructor() {
    this.leadService = new LeadService(apiClient, storageManager);
    this.leadsContainer = document.getElementById('leads-container');
  }
  
  async init() {
    const leads = await this.leadService.list();
    this.renderLeads(leads);
  }
  
  renderLeads(leads) {
    this.leadsContainer.innerHTML = '';
    
    leads.forEach(lead => {
      const leadCard = new LeadCard(lead, {
        onEdit: (lead) => this.handleEditLead(lead)
      });
      leadCard.attachTo(this.leadsContainer);
    });
  }
  
  async handleEditLead(lead) {
    // Use modal-manager for editing
    // Update using leadService
  }
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const controller = new LeadsController();
  controller.init();
});
```

### 3. Migrating Call Tracking Features

#### Old Implementation (example):

```javascript
let activeCall = null;
let timer = null;

function startCall(leadId) {
  fetch('/api/calls', {
    method: 'POST',
    body: JSON.stringify({ leadId, startTime: new Date() })
  })
  .then(response => response.json())
  .then(data => {
    activeCall = data;
    startTimer();
    updateCallUI();
  });
}

function endCall(outcome, notes) {
  activeCall.endTime = new Date();
  activeCall.outcome = outcome;
  activeCall.notes = notes;
  
  fetch(`/api/calls/${activeCall.id}`, {
    method: 'PUT',
    body: JSON.stringify(activeCall)
  })
  .then(/* ... */);
}

function startTimer() {
  timer = setInterval(() => {
    // Update timer UI
  }, 1000);
}
```

#### New Implementation:

```javascript
// In your page controller
class CallsController {
  constructor() {
    this.callService = new CallService(apiClient, storageManager);
    this.callContainer = document.getElementById('call-container');
  }
  
  async handleCallLead(lead) {
    const callTracker = new CallTracker(lead.id, this.callService, {
      containerSelector: this.callContainer,
      onCallEnd: (call) => this.handleCallEnded(call)
    });
    
    await callTracker.init();
    await callTracker.startCall();
  }
  
  handleCallEnded(call) {
    // Handle call completion
  }
}
```

### 4. Migrating UI Elements

#### Old Implementation (example):

```javascript
function createLeadCard(lead) {
  const card = document.createElement('div');
  card.className = 'lead-card';
  card.innerHTML = `
    <div class="lead-header">
      <h3>${lead.name}</h3>
      <span class="lead-status">${lead.status}</span>
    </div>
    <!-- ... more HTML ... -->
  `;
  
  const callBtn = card.querySelector('.call-btn');
  callBtn.addEventListener('click', () => startCall(lead.id));
  
  return card;
}
```

#### New Implementation:

Use the `LeadCard` component:

```javascript
const leadCard = new LeadCard(lead, {
  onCall: (lead) => this.handleCallLead(lead),
  onEdit: (lead) => this.handleEditLead(lead),
  onDelete: (lead) => this.handleDeleteLead(lead)
});

leadCard.attachTo(container);
```

### 5. Migrating Utility Functions

#### Old Implementation (example):

```javascript
function saveToLocalStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getFromLocalStorage(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}
```

#### New Implementation:

Use the `StorageManager`:

```javascript
// Store data
storageManager.set('my-key', data);

// Retrieve data
const data = storageManager.get('my-key');
```

## Handling Compatibility Issues

The `api-adapter.js` file is designed to handle compatibility between the new architecture and the existing server API. If you encounter API-related issues, check this file to ensure it properly adapts the API calls.

## Testing the Migration

After migrating a feature:

1. Test the feature thoroughly to ensure it works as expected
2. Check the browser console for errors
3. Verify that API calls are being made correctly
4. Ensure the UI updates properly

## Browser Compatibility

The refactored code uses modern JavaScript features. If you need to support older browsers, consider adding appropriate polyfills or using a transpiler like Babel.

## Incomplete Features

If you find features that have not been fully migrated to the new architecture, follow these steps:

1. Identify the old implementation
2. Determine which layer(s) of the new architecture should contain the feature
3. Create the necessary files and implement the feature using the new patterns
4. Update any referencing code to use the new implementation

## Troubleshooting Common Migration Issues

### API Communication Issues

- Verify that API endpoints in `api-client.js` match the server's expectations
- Check that authentication tokens are being passed correctly
- Use the browser's Network tab to debug API requests

### UI Rendering Issues

- Ensure components are being instantiated with correct data
- Check CSS class names match the component templates
- Verify event handlers are attached correctly

### Data Model Issues

- Validate input data against the model's expectations
- Check for data transformation issues between server and client formats
- Verify validation rules match business requirements

## Next Steps

After completing the migration:

1. Remove any obsolete code files
2. Update documentation
3. Implement automated tests
4. Plan for future enhancements based on the new architecture