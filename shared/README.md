# FlutterBye CRM: Shared Code Module

This directory contains code that is shared between the web application and React Native mobile application, ensuring a consistent data model and business logic across platforms.

## Directory Structure

```
/shared/
├── models/           # Core data models
│   ├── Lead.js       # Lead data structure
│   └── Call.js       # Call data structure
│
├── services/         # Business logic services
│   ├── LeadService.js     # Lead operations
│   ├── CallService.js     # Call operations
│   └── SyncService.js     # Data synchronization
│
└── adapters/         # Platform-specific adapters
    └── ReactNativeAdapter.js  # React Native compatibility
```

## Using Shared Models in React Native

To use these shared models in your React Native application:

### 1. Import the Models and Adapters

```javascript
// In your React Native component
import { Lead, Call } from '../shared/models/';
import { 
  ReactNativeStorageAdapter,
  ReactNativeAPIAdapter,
  ReactNativeUIAdapters
} from '../shared/adapters/ReactNativeAdapter';
```

### 2. Initialize the Adapters

```javascript
// Create platform-specific instances
const apiClient = new ReactNativeAPIAdapter('https://api.flutterbye.com');
const storageManager = new ReactNativeStorageAdapter('flutterbye');
```

### 3. Use the Services with Platform Adapters

```javascript
// Import services
import { LeadService } from '../shared/services/LeadService';
import { CallService } from '../shared/services/CallService';
import { SyncService } from '../shared/services/SyncService';

// Initialize services with platform adapters
const leadService = new LeadService(apiClient, storageManager);
const callService = new CallService(apiClient, storageManager);
const syncService = new SyncService(apiClient, storageManager);
```

### 4. Use Consistent Business Logic

The shared services contain all business logic, ensuring that both web and mobile platforms behave identically:

```javascript
// Example: Creating a lead (identical API on web and mobile)
const newLead = {
  globalLead: {
    companyName: 'New Company',
    contactName: 'John Smith',
    phoneNumber: '+1234567890',
    email: 'john@example.com'
  },
  status: 'new',
  priority: 3
};

// Create the lead
try {
  const createdLead = await leadService.create(newLead);
  console.log('Lead created:', createdLead);
} catch (error) {
  console.error('Lead creation failed:', error.message);
}
```

### 5. Managing Calls

Call handling is also consistent across platforms:

```javascript
// Example: Starting a call
const startCall = async (leadId) => {
  try {
    const activeCall = await callService.startCall(leadId);
    console.log('Call started:', activeCall);
    
    // Register for timer updates
    const unsubscribe = callService.onTimerUpdate((duration) => {
      console.log(`Call duration: ${duration} seconds`);
    });
    
    return unsubscribe; // Call this function to stop receiving updates
  } catch (error) {
    console.error('Call start failed:', error.message);
  }
};

// Example: Ending a call
const endCall = async (outcome, notes) => {
  try {
    const completedCall = await callService.endCall(outcome, notes);
    console.log('Call ended:', completedCall);
  } catch (error) {
    console.error('Call end failed:', error.message);
  }
};
```

### 6. Offline Support

Data synchronization is handled automatically:

```javascript
// Initialize sync service with options
const syncOptions = {
  autoSync: true,
  syncInterval: 30000, // 30 seconds
  conflictResolution: 'server-wins'
};

const syncService = new SyncService(apiClient, storageManager, syncOptions);

// Initialize synchronization
await syncService.init();

// Check sync status
const status = await syncService.getSyncStatus();
console.log('Sync status:', status);
```

## Benefits of Shared Code

1. **Single Source of Truth**: Models and business logic only need to be defined once
2. **Consistency**: Behavior is identical across platforms
3. **Reduced Duplication**: No need to reimplement logic for each platform
4. **Easier Maintenance**: Changes only need to be made in one place
5. **Offline Support**: Built-in synchronization capabilities

## Platform-Specific Considerations

While most code is shared, some platform-specific considerations exist:

### Web Application

For the web application, use the browser-native storage and fetch APIs:

```javascript
// In the web application
import { Lead } from '../shared/models/Lead';
import { LeadService } from '../shared/services/LeadService';

// Use browser-native APIs
const apiClient = {
  async makeRequest(endpoint, options) {
    const response = await fetch(endpoint, options);
    return response.json();
  },
  // ... implement other API methods
};

const storageManager = {
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  get: (key) => {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  remove: (key) => localStorage.removeItem(key)
};

// Initialize service with web adapters
const leadService = new LeadService(apiClient, storageManager);
```

### React Native

For React Native, use the provided adapters that handle platform-specific storage and networking:

```javascript
// Already implemented in ReactNativeAdapter.js
```

## Testing

When testing shared code, ensure tests run in both web and React Native environments:

```javascript
// Example test for Lead model
describe('Lead Model', () => {
  test('validation requires company name', () => {
    const invalidLead = new Lead({
      globalLead: { companyName: '' }
    });
    
    expect(() => invalidLead.validate()).toThrow();
  });
});
```