# CRM Refactoring Plan: Single Source of Truth

## Overview
Transform the current fragmented codebase into a unified, maintainable system with clear separation of concerns and no duplication.

## Core Architecture Principles

### 1. Data Layer (Single Source of Truth)
```
/public/js/core/
├── api-client.js       # All API interactions
├── lead-model.js       # Lead data structure & validation
├── call-model.js       # Call data structure & validation
└── storage-manager.js  # Local storage/caching
```

### 2. Business Logic Layer
```
/public/js/services/
├── lead-service.js     # All lead operations
├── call-service.js     # All call operations
└── sync-service.js     # Data synchronization
```

### 3. UI Layer
```
/public/js/components/
├── lead-card.js        # Single lead card implementation
├── call-tracker.js     # Single call tracking UI
└── modal-manager.js    # Reusable modal system
```

## Phase 1: Core Infrastructure (Week 1)

### api-client.js (Unified API Layer)
```javascript
class APIClient {
  async makeRequest(endpoint, options = {}) { /* ... */ }
  
  // Lead endpoints
  async getLeads(filters = {}) { /* ... */ }
  async getLead(id) { /* ... */ }
  async createLead(data) { /* ... */ }
  async updateLead(id, data) { /* ... */ }
  async deleteLead(id) { /* ... */ }
  
  // Call endpoints
  async getCalls(leadId = null) { /* ... */ }
  async createCall(data) { /* ... */ }
  async updateCall(id, data) { /* ... */ }
}
```

### lead-model.js (Data Structure Definition)
```javascript
class Lead {
  constructor(data) { /* validate and normalize */ }
  
  validate() { /* validation rules */ }
  toJSON() { /* serialize for API */ }
  fromJSON(data) { /* deserialize from API */ }
  
  // Business rules
  canMakeCall() { /* ... */ }
  getDisplayName() { /* ... */ }
  getStatusColor() { /* ... */ }
}
```

### call-model.js (Call Data Structure)
```javascript
class Call {
  constructor(data) { /* ... */ }
  
  validate() { /* ... */ }
  calculateDuration() { /* ... */ }
  isCompleted() { /* ... */ }
  getOutcomeText() { /* ... */ }
}
```

## Phase 2: Service Layer (Week 2)

### lead-service.js (All Lead Operations)
```javascript
class LeadService {
  constructor(apiClient, storageManager) { /* ... */ }
  
  async create(leadData) {
    const lead = new Lead(leadData);
    lead.validate();
    return await this.apiClient.createLead(lead.toJSON());
  }
  
  async update(id, updateData) { /* ... */ }
  async delete(id) { /* ... */ }
  async get(id) { /* ... */ }
  async list(filters = {}) { /* ... */ }
  
  // Business operations
  async markAsContacted(id, callData) { /* ... */ }
  async scheduleFollowUp(id, date) { /* ... */ }
}
```

### call-service.js (All Call Operations)
```javascript
class CallService {
  constructor(apiClient, storageManager) { /* ... */ }
  
  async startCall(leadId) {
    const call = new Call({
      leadId,
      startTime: new Date(),
      status: 'active'
    });
    return await this.apiClient.createCall(call.toJSON());
  }
  
  async endCall(callId, outcome, notes) { /* ... */ }
  async getCallHistory(leadId = null) { /* ... */ }
}
```

## Phase 3: UI Components (Week 3)

### lead-card.js (Single Implementation)
```javascript
class LeadCard {
  constructor(lead, options = {}) {
    this.lead = new Lead(lead);
    this.options = options;
  }
  
  render() {
    // Single template that works everywhere
    return `
      <div class="lead-card" data-lead-id="${this.lead.id}">
        <!-- Unified card layout -->
      </div>
    `;
  }
  
  attachEventListeners() {
    // Call, edit, view actions
  }
}
```

### call-tracker.js (Unified Call Interface)
```javascript
class CallTracker {
  constructor(leadId, callService) { /* ... */ }
  
  async startCall() { /* ... */ }
  updateTimer() { /* ... */ }
  async endCall(outcome, notes) { /* ... */ }
  
  render() {
    // Single call UI template
  }
}
```

## Phase 4: Page Refactoring (Week 4)

### Updated File Structure
```
/public/
├── dashboard.html      # Uses unified components
├── leads.html          # Dedicated leads page
├── calls.html          # Dedicated calls page
├── js/
│   ├── core/          # Data & API layer
│   ├── services/      # Business logic
│   ├── components/    # UI components
│   └── pages/         # Page-specific controllers
│       ├── dashboard.js
│       ├── leads.js
│       └── calls.js
```

### dashboard.js (Page Controller)
```javascript
class DashboardController {
  constructor() {
    this.leadService = new LeadService(apiClient, storageManager);
    this.callService = new CallService(apiClient, storageManager);
  }
  
  async init() {
    await this.loadRecentLeads();
    await this.loadRecentCalls();
    this.setupEventListeners();
  }
  
  async loadRecentLeads() {
    const leads = await this.leadService.list({ limit: 10 });
    this.renderLeadsContainer(leads);
  }
}
```

## Phase 5: Cleanup & Migration (Week 5)

### Files to Remove
- `call-tracking.js` ✗
- `call-tracking-simple.js` ✗
- `lead-cards-demo.html` ✗
- `tmp/script_1.js` ✗
- `dashboard_backup.html` ✗
- Embedded scripts in HTML files ✗

### React Native Alignment
Update React Native components to use the same data models:
```javascript
// LeadScreen.jsx
import { Lead } from '../models/Lead';
import { LeadService } from '../services/LeadService';

// Use same validation and business rules
```

## Implementation Checklist

### Week 1: Core Infrastructure
- [x] Create `/public/js/core/` directory
- [x] Implement `api-client.js`
- [x] Implement `lead-model.js`
- [x] Implement `call-model.js`
- [x] Implement `storage-manager.js`
- [ ] Write unit tests for core classes

### Week 2: Services
- [x] Create `/public/js/services/` directory
- [x] Implement `lead-service.js`
- [x] Implement `call-service.js`
- [x] Implement `sync-service.js`
- [x] Integration testing

### Week 3: UI Components
- [x] Create `/public/js/components/` directory
- [x] Implement unified `lead-card.js`
- [x] Implement unified `call-tracker.js`
- [x] Implement `modal-manager.js`
- [x] Create CSS for unified styling

### Week 4: Page Updates
- [x] Refactor `dashboard.html`
- [x] Create new `leads.html`
- [x] Create new `calls.html`
- [x] Implement page controllers
- [ ] End-to-end testing

### Week 5: Cleanup
- [ ] Remove redundant files
- [ ] Update React Native to use same models
- [x] Documentation update
- [x] Performance optimization
- [ ] Final QA testing

## Success Metrics

1. **Code Reduction**: 60%+ reduction in lines of code
2. **Consistency**: Same functionality behaves identically across all interfaces
3. **Maintainability**: Single place to update each function
4. **Performance**: Faster load times due to code elimination
5. **Testing**: 100% test coverage on core components

## Risk Mitigation

1. **Backup Strategy**: Keep current files until refactoring is complete
2. **Gradual Migration**: Update one page at a time
3. **Feature Flagging**: Use flags to switch between old/new implementations
4. **Testing**: Comprehensive testing at each phase
5. **Rollback Plan**: Ability to revert to previous version if issues arise

## Post-Refactoring Benefits

- **Single Source of Truth**: Each function exists in exactly one place
- **Consistency**: Identical behavior across web and mobile
- **Maintainability**: Changes only need to be made once
- **Performance**: Reduced code size and faster loading
- **Testing**: Easier to test consolidated functions
- **Documentation**: Clear, single place for each feature