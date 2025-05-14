/**
 * Test script for testing the enhanced lead generation functionality
 * with the "more leads" and "no_more_records_available" features
 */

// Import our services
const { webSearchService } = require('../server/services/ai/webSearch');

async function main() {
  try {
    console.log('Testing enhanced lead generation with "more leads" functionality...');
    
    // Test Case 1: Tech Startups
    await testLeadGeneration(
      'Find tech startups in Boston that focus on artificial intelligence and have less than 50 employees',
      'Tech startups'
    );
    
    // Test Case 2: Yoga Studios (previously problematic case)
    await testLeadGeneration(
      'Find yoga studios in Santa Monica, California',
      'Yoga studios'
    );
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Test script error:', error);
  }
}

/**
 * Test lead generation for a specific criteria
 * @param {string} criteria - Search criteria
 * @param {string} testName - Name for the test
 */
async function testLeadGeneration(criteria, testName) {
  console.log(`\n=== Testing Lead Generation: ${testName} ===`);
  
  // First call: Get initial leads
  console.log('\n--- Testing initial lead generation ---');
  const result1 = await webSearchService.generateLeads(criteria, {
    temperature: 0.5,
    maxTokens: 3000
  });
  
  if (result1.success) {
    console.log('Initial lead generation succeeded!');
    console.log(`Generated ${result1.leads.length} leads`);
    console.log('First lead example:', JSON.stringify(result1.leads[0], null, 2).substring(0, 300) + '...');
    console.log('No more records available:', result1.no_more_records_available);
    console.log('Interaction ID:', result1.interactionId);
  } else {
    console.error('Initial lead generation failed:', result1.error);
    return;
  }
  
  // Pause to avoid potential rate limiting
  console.log('\nPausing for 5 seconds before requesting more leads...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Second call: Get more leads, passing the previous leads
  console.log('\n--- Testing "more leads" generation ---');
  const result2 = await webSearchService.generateLeads(criteria, {
    previousLeads: result1.leads,
    fetchMoreLeads: true,
    temperature: 0.5,
    maxTokens: 4000
  });
  
  if (result2.success) {
    console.log('"More leads" generation succeeded!');
    console.log(`Generated ${result2.leads.length} additional leads`);
    if (result2.leads.length > 0) {
      console.log('New lead example:', JSON.stringify(result2.leads[0], null, 2).substring(0, 300) + '...');
    }
    console.log('No more records available:', result2.no_more_records_available);
    console.log('Interaction ID:', result2.interactionId);
    
    // Check for duplicate leads
    const companyNames1 = result1.leads.map(lead => lead.companyName);
    const companyNames2 = result2.leads.map(lead => lead.companyName);
    
    const duplicates = companyNames1.filter(name => companyNames2.includes(name));
    
    if (duplicates.length > 0) {
      console.warn('Warning: Found duplicate companies in the second batch:', duplicates);
    } else {
      console.log('No duplicate companies found between batches!');
    }
  } else {
    console.error('"More leads" generation failed:', result2.error);
  }
}

// Run the test
main();