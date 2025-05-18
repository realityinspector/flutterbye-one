# Integration Testing Guide for FlutterBye CRM

This document provides guidance on how to test the refactored FlutterBye CRM application to ensure all components work together correctly.

## Testing Strategy

The testing strategy follows the layered architecture of the application:

1. **Unit Tests**: Testing individual components in isolation
2. **Integration Tests**: Testing interactions between components
3. **End-to-End Tests**: Testing complete user flows

## Prerequisites

- A modern web browser with developer tools (Chrome, Firefox, Safari)
- Access to the FlutterBye CRM application
- Valid test user credentials

## Manual Testing Procedures

### 1. Core Layer Testing

#### API Client Testing

1. Open the browser's Developer Tools (F12)
2. Navigate to the Network tab
3. Perform the following actions and verify the correct API calls are made:
   - Log in to the application
   - View leads list
   - View call history
   - Create a new lead
   - Update an existing lead

#### Data Models Testing

1. Open the browser's Developer Tools (F12)
2. Navigate to the Console tab
3. Execute the following commands and verify the results:

```javascript
// Test Lead model
const testLead = new Lead({
  globalLead: { companyName: 'Test Company' }
});
console.log(testLead.getDisplayName()); // Should output "Test Company"

// Test validation
try {
  const invalidLead = new Lead({});
  invalidLead.validate();
} catch (error) {
  console.log(error.message); // Should show validation error
}

// Test Call model
const testCall = new Call({
  startTime: new Date(),
  endTime: new Date(Date.now() + 60000)
});
console.log(testCall.calculateDuration()); // Should output duration in seconds
```

#### Storage Manager Testing

```javascript
// Test storage
storageManager.set('test-key', { value: 'test' });
console.log(storageManager.get('test-key')); // Should output { value: 'test' }
storageManager.remove('test-key');
console.log(storageManager.get('test-key')); // Should output null
```

### 2. Service Layer Testing

#### Lead Service Testing

1. Test creating a lead:
   - Navigate to the Leads page
   - Click "Add Lead"
   - Fill in the form and submit
   - Verify the lead appears in the list

2. Test updating a lead:
   - Click the "Edit" button on a lead card
   - Modify the details and save
   - Verify the changes are reflected

3. Test deleting a lead:
   - Click the "Delete" button on a lead card
   - Confirm the deletion
   - Verify the lead is removed from the list

#### Call Service Testing

1. Test starting a call:
   - Click the "Call" button on a lead card
   - Verify the call timer starts
   - Verify the call UI shows "Call in Progress"

2. Test ending a call:
   - Click "End Call" on an active call
   - Fill in the outcome and notes
   - Verify the call is marked as completed
   - Verify the lead is marked as contacted

3. Test call history:
   - Navigate to the Calls page
   - Verify previous calls are displayed with correct information

### 3. UI Components Testing

#### Lead Card Testing

1. Verify the lead card displays all lead information correctly
2. Test the priority stars functionality:
   - Click on different star ratings
   - Verify the priority updates correctly

3. Test responsive behavior:
   - Resize the browser window
   - Verify the lead card adapts to different screen sizes

#### Call Tracker Testing

1. Verify the call tracker displays the correct UI states:
   - Initial state (before call)
   - Active call state
   - Completed call state
   - Canceled call state

2. Test the timer functionality:
   - Start a call
   - Verify the timer increments correctly

3. Test accessibility:
   - Use a screen reader to navigate the call tracker
   - Verify all actions are announced correctly

#### Modal Manager Testing

1. Test creating modals:
   - Click actions that open modals (e.g., edit lead)
   - Verify the modal displays correctly

2. Test focus management:
   - Open a modal
   - Verify focus is trapped inside the modal
   - Close the modal
   - Verify focus returns to the triggering element

3. Test keyboard navigation:
   - Open a modal
   - Use Tab key to navigate through focusable elements
   - Verify Tab cycles through the modal's elements

### 4. Page Controllers Testing

#### Dashboard Controller Testing

1. Verify the dashboard loads with correct data:
   - Recent leads
   - Recent calls
   - Statistics

2. Test refresh functionality:
   - Click the refresh button
   - Verify data is reloaded

#### Leads Controller Testing

1. Test filtering and sorting:
   - Apply different filters (status, search term)
   - Change sorting options
   - Verify the lead list updates accordingly

2. Test pagination:
   - Navigate through lead pages
   - Verify correct leads are displayed

#### Calls Controller Testing

1. Test date range filtering:
   - Set different date ranges
   - Verify only calls within the range are displayed

2. Test lead filtering:
   - Select a specific lead
   - Verify only calls to that lead are displayed

## Automated Testing

To set up automated tests, consider using:

1. **Jest** for unit testing JavaScript code
2. **Testing Library** for component testing
3. **Cypress** for end-to-end testing

Example setup for a unit test of the Lead model:

```javascript
// lead-model.test.js
describe('Lead Model', () => {
  test('getDisplayName returns company name', () => {
    const lead = new Lead({
      globalLead: { companyName: 'Test Company' }
    });
    expect(lead.getDisplayName()).toBe('Test Company');
  });
  
  test('validate throws error for missing company name', () => {
    const lead = new Lead({
      globalLead: { companyName: '' }
    });
    expect(() => lead.validate()).toThrow();
  });
});
```

## Troubleshooting Common Testing Issues

1. **API Connection Issues**:
   - Check network connectivity
   - Verify API endpoint URLs
   - Check authentication token validity

2. **Data Inconsistencies**:
   - Clear browser cache and local storage
   - Verify the API responses match expected formats
   - Check for data transformation issues

3. **UI Rendering Issues**:
   - Verify CSS is loaded correctly
   - Check for JavaScript console errors
   - Test on different browsers to identify browser-specific issues

## Regression Testing Checklist

Before releasing updates, verify:

1. Authentication flows work correctly
2. Lead management operations (create, read, update, delete)
3. Call tracking functionality
4. Data persistence and synchronization
5. Responsive design across device sizes
6. Accessibility compliance
7. Error handling and recovery

By following this testing guide, you can ensure the refactored FlutterBye CRM application works correctly and maintains its quality through future changes.