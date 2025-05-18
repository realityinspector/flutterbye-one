/**
 * Refactoring Validation Script
 * 
 * This script tests the refactored components to ensure they work correctly.
 * Run this script after loading all refactored components to verify functionality.
 */

(function() {
  // Flag to track overall test status
  let allTestsPassed = true;
  
  // Test results container
  const results = {
    core: {},
    services: {},
    components: {},
    integration: {}
  };
  
  console.log('🧪 Starting refactoring validation tests...');
  
  /**
   * Utility function to run a test and record the result
   */
  function runTest(category, name, testFn) {
    try {
      console.log(`Testing ${category}.${name}...`);
      const result = testFn();
      results[category][name] = { success: true, result };
      console.log(`✅ ${category}.${name} passed`);
      return true;
    } catch (error) {
      results[category][name] = { success: false, error: error.message };
      console.error(`❌ ${category}.${name} failed: ${error.message}`);
      allTestsPassed = false;
      return false;
    }
  }
  
  // Test Core Layer
  console.log('\n📊 Testing Core Layer');
  
  // Test Lead Model
  runTest('core', 'LeadModel.creation', () => {
    const lead = new Lead({
      globalLead: { companyName: 'Test Company' }
    });
    
    if (!(lead instanceof Lead)) {
      throw new Error('Failed to create Lead instance');
    }
    
    return true;
  });
  
  runTest('core', 'LeadModel.getters', () => {
    const lead = new Lead({
      globalLead: {
        companyName: 'Test Company',
        contactName: 'John Doe',
        phoneNumber: '+1234567890',
        email: 'john@example.com'
      },
      status: 'new',
      priority: 3
    });
    
    if (lead.getDisplayName() !== 'Test Company') {
      throw new Error('getDisplayName() returned incorrect value');
    }
    
    if (lead.getContactName() !== 'John Doe') {
      throw new Error('getContactName() returned incorrect value');
    }
    
    if (lead.getPhoneNumber() !== '+1234567890') {
      throw new Error('getPhoneNumber() returned incorrect value');
    }
    
    if (lead.getEmail() !== 'john@example.com') {
      throw new Error('getEmail() returned incorrect value');
    }
    
    return true;
  });
  
  runTest('core', 'LeadModel.validation', () => {
    // Test with valid data
    const validLead = new Lead({
      globalLead: { companyName: 'Valid Company' },
      status: 'new',
      priority: 3
    });
    
    const isValid = validLead.validate();
    if (!isValid) {
      throw new Error('Valid lead failed validation');
    }
    
    // Test with invalid data (should throw)
    let errorThrown = false;
    try {
      const invalidLead = new Lead({
        globalLead: { companyName: '' }, // Empty company name
        status: 'invalid-status', // Invalid status
        priority: 10 // Invalid priority
      });
      invalidLead.validate();
    } catch (error) {
      errorThrown = true;
    }
    
    if (!errorThrown) {
      throw new Error('Invalid lead passed validation');
    }
    
    return true;
  });
  
  // Test Call Model
  runTest('core', 'CallModel.creation', () => {
    const call = new Call({
      leadId: 1,
      startTime: new Date(),
      status: 'active'
    });
    
    if (!(call instanceof Call)) {
      throw new Error('Failed to create Call instance');
    }
    
    return true;
  });
  
  runTest('core', 'CallModel.duration', () => {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 60000); // 1 minute later
    
    const call = new Call({
      leadId: 1,
      startTime,
      endTime,
      status: 'completed'
    });
    
    const duration = call.calculateDuration();
    
    // Duration should be close to 60 seconds
    if (duration < 58 || duration > 62) {
      throw new Error(`Duration calculation incorrect: ${duration}`);
    }
    
    return true;
  });
  
  // Test Storage Manager
  runTest('core', 'StorageManager.basicOps', () => {
    // Create a test namespace to avoid conflicts
    const testStorage = new StorageManager('test-namespace');
    
    // Test set and get
    testStorage.set('test-key', { value: 'test-value' });
    const value = testStorage.get('test-key');
    
    if (!value || value.value !== 'test-value') {
      throw new Error('StorageManager get/set failed');
    }
    
    // Test remove
    testStorage.remove('test-key');
    const removedValue = testStorage.get('test-key');
    
    if (removedValue !== null) {
      throw new Error('StorageManager remove failed');
    }
    
    return true;
  });
  
  // Test Service Layer
  console.log('\n📊 Testing Service Layer');
  
  // Test Lead Service (with mocked API client)
  runTest('services', 'LeadService.mockCreation', () => {
    // Create a mock API client
    const mockApiClient = {
      createLead: (data) => Promise.resolve({ success: true, data: { id: 123, ...data } }),
      getLeads: () => Promise.resolve({ success: true, data: [] }),
      getLead: (id) => Promise.resolve({ success: true, data: { id } })
    };
    
    // Create a mock storage manager
    const mockStorage = new StorageManager('test-services');
    
    // Create the lead service
    const leadService = new LeadService(mockApiClient, mockStorage);
    
    if (!leadService) {
      throw new Error('Failed to create LeadService instance');
    }
    
    return true;
  });
  
  // Test Call Service (with mocked API client)
  runTest('services', 'CallService.mockCreation', () => {
    // Create a mock API client
    const mockApiClient = {
      createCall: (data) => Promise.resolve({ success: true, data: { id: 456, ...data } }),
      getCalls: () => Promise.resolve({ success: true, data: [] }),
      updateCall: (id, data) => Promise.resolve({ success: true, data: { id, ...data } })
    };
    
    // Create a mock storage manager
    const mockStorage = new StorageManager('test-services');
    
    // Create the call service
    const callService = new CallService(mockApiClient, mockStorage);
    
    if (!callService) {
      throw new Error('Failed to create CallService instance');
    }
    
    return true;
  });
  
  // Test UI Components
  console.log('\n📊 Testing UI Components');
  
  // Test Lead Card
  runTest('components', 'LeadCard.render', () => {
    const lead = new Lead({
      id: 1,
      globalLead: {
        companyName: 'Test Company',
        contactName: 'John Doe',
        phoneNumber: '+1234567890',
        email: 'test@example.com'
      },
      status: 'new',
      priority: 3
    });
    
    const leadCard = new LeadCard(lead);
    const html = leadCard.render();
    
    if (!html || typeof html !== 'string') {
      throw new Error('LeadCard.render() failed to return HTML string');
    }
    
    if (!html.includes('Test Company')) {
      throw new Error('LeadCard HTML does not contain company name');
    }
    
    if (!html.includes('John Doe')) {
      throw new Error('LeadCard HTML does not contain contact name');
    }
    
    return true;
  });
  
  // Test Call Tracker
  runTest('components', 'CallTracker.render', () => {
    // Create a mock call service
    const mockCallService = {
      startCall: () => Promise.resolve({ id: 1, status: 'active' }),
      getCurrentCallDuration: () => 0,
      hasActiveCall: () => false
    };
    
    const callTracker = new CallTracker(1, mockCallService);
    const html = callTracker.render();
    
    if (!html || typeof html !== 'string') {
      throw new Error('CallTracker.render() failed to return HTML string');
    }
    
    if (!html.includes('Start a Call')) {
      throw new Error('CallTracker HTML does not contain expected text');
    }
    
    return true;
  });
  
  // Test Modal Manager
  runTest('components', 'ModalManager.creation', () => {
    const modalManager = new ModalManager();
    
    if (!modalManager) {
      throw new Error('Failed to create ModalManager instance');
    }
    
    // Check if container was created
    if (!modalManager.container) {
      throw new Error('ModalManager did not create container');
    }
    
    return true;
  });
  
  // Integration Tests
  console.log('\n📊 Testing Integration Points');
  
  // Test LeadCard with LeadService
  runTest('integration', 'LeadCardWithLeadService', () => {
    // Create a lead
    const lead = new Lead({
      id: 1,
      globalLead: { companyName: 'Integration Test Company' },
      status: 'new',
      priority: 3
    });
    
    // Create a mock lead service
    const mockLeadService = {
      update: (id, data) => Promise.resolve({ ...lead, ...data }),
      delete: (id) => Promise.resolve(true)
    };
    
    // Create a lead card with callbacks that use the service
    const leadCard = new LeadCard(lead, {
      onEdit: async (lead) => await mockLeadService.update(lead.id, { priority: 4 }),
      onDelete: async (lead) => await mockLeadService.delete(lead.id)
    });
    
    // Should render without errors
    const html = leadCard.render();
    
    if (!html.includes('Integration Test Company')) {
      throw new Error('Integration failed: LeadCard does not render lead from service');
    }
    
    return true;
  });
  
  // Test CallTracker with CallService
  runTest('integration', 'CallTrackerWithCallService', () => {
    // Create a mock call service
    const mockCallService = {
      activeCall: null,
      startCall: () => {
        mockCallService.activeCall = { id: 1, status: 'active', startTime: new Date() };
        return Promise.resolve(mockCallService.activeCall);
      },
      endCall: () => {
        mockCallService.activeCall.status = 'completed';
        mockCallService.activeCall.endTime = new Date();
        return Promise.resolve(mockCallService.activeCall);
      },
      hasActiveCall: () => !!mockCallService.activeCall && mockCallService.activeCall.status === 'active',
      getActiveCall: () => mockCallService.activeCall,
      getCurrentCallDuration: () => 30,
      onTimerUpdate: () => {}
    };
    
    // Create a call tracker
    const callTracker = new CallTracker(1, mockCallService);
    
    // Should render without errors
    const html = callTracker.render();
    
    if (!html.includes('Start Call')) {
      throw new Error('Integration failed: CallTracker does not render properly with CallService');
    }
    
    return true;
  });
  
  // Test complete flow simulation
  runTest('integration', 'CompleteFlowSimulation', () => {
    // This is a simulated flow test that would validate the entire sequence
    // In a real end-to-end test, we'd actually interact with DOM elements
    
    // The test is simplified here since we can't interact with the DOM directly
    
    // Create mocked services
    const mockApiClient = {
      getLeads: () => Promise.resolve({ success: true, data: [] }),
      getLead: () => Promise.resolve({ success: true, data: {} }),
      createLead: (data) => Promise.resolve({ success: true, data: { id: 999, ...data } })
    };
    
    const mockStorage = new StorageManager('test-flow');
    
    // Create services
    const leadService = new LeadService(mockApiClient, mockStorage);
    const callService = new CallService(mockApiClient, mockStorage);
    
    // Simulate creating a lead
    const newLead = {
      globalLead: {
        companyName: 'Flow Test Company',
        contactName: 'Jane Smith',
        phoneNumber: '+9876543210'
      },
      status: 'new',
      priority: 4
    };
    
    // This would be an async operation in a real test
    // leadService.create(newLead).then(...)
    
    // For our test, we'll just check if the services are properly constructed
    if (!leadService || !callService) {
      throw new Error('Failed to create services for flow test');
    }
    
    return true;
  });
  
  // Print final results
  console.log('\n📝 Test Results Summary:');
  
  // Count results
  let passed = 0;
  let failed = 0;
  
  Object.keys(results).forEach(category => {
    Object.keys(results[category]).forEach(test => {
      if (results[category][test].success) {
        passed++;
      } else {
        failed++;
      }
    });
  });
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  
  if (allTestsPassed) {
    console.log('\n🎉 All tests passed! Refactoring validation complete.');
  } else {
    console.log('\n⚠️ Some tests failed. Review the errors above and fix the issues.');
  }
  
  return {
    allTestsPassed,
    results,
    passed,
    failed,
    total: passed + failed
  };
})();