/**
 * Test script for OpenRouter integration
 */

// Import our services
const { openRouterService } = require('../server/services/ai/openRouter');
const { webSearchService } = require('../server/services/ai/webSearch');

async function main() {
  try {
    console.log('Testing OpenRouter integration with our service...');
    console.log('OpenRouter API Key:', process.env.OPENROUTER_API_KEY ? 'Present (hidden)' : 'Missing');
    
    console.log('Using our OpenRouter service implementation...');
    
    // Test web search capabilities
    console.log('\n--- Testing standard chat completion ---');
    const result1 = await openRouterService.chatCompletion(
      'How would you describe the OpenRouter API in 2-3 sentences?',
      {
        model: 'openai/gpt-4o',
        temperature: 0.5,
        maxTokens: 150
      }
    );
    
    if (result1.success) {
      console.log('Standard completion succeeded!');
      console.log('Response:', result1.data.text);
      console.log('Interaction ID:', result1.interactionId);
      console.log('Token usage:', result1.data.usage);
    } else {
      console.error('Standard completion failed:', result1.error);
    }
    
    // Test web search capabilities
    console.log('\n--- Testing web search capabilities ---');
    const result2 = await openRouterService.webSearchChatCompletion(
      'What are the latest features of OpenRouter as of May 2025?',
      {
        temperature: 0.7,
        maxTokens: 300
      }
    );
    
    if (result2.success) {
      console.log('Web search completion succeeded!');
      console.log('Response:', result2.data.text);
      console.log('Interaction ID:', result2.interactionId);
      console.log('Token usage:', result2.data.usage);
    } else {
      console.error('Web search completion failed:', result2.error);
    }
    
    // Test lead generation capabilities
    console.log('\n--- Testing lead generation ---');
    try {
      const result3 = await webSearchService.generateLeads(
        'Find tech startups in Boston that focus on artificial intelligence and have less than 50 employees',
        {
          temperature: 0.3,
          maxTokens: 3000
        }
      );
      
      if (result3.success) {
        console.log('Lead generation succeeded!');
        console.log(`Generated ${result3.leads.length} leads`);
        if (result3.leads.length > 0) {
          console.log('Example lead:', JSON.stringify(result3.leads[0], null, 2));
        }
        console.log('Sources:', result3.sources);
        console.log('Interaction ID:', result3.interactionId);
      } else {
        console.error('Lead generation failed:', result3.error);
      }
    } catch (error) {
      console.error('Lead generation error:', error.message);
    }
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('\nTest failed with exception:', error);
  }
}

// Run the test
main();
