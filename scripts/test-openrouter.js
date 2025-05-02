/**
 * Test script for OpenRouter integration
 */

// Import our service
const { openRouterService } = require('../server/services/ai/openRouter');

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
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('\nTest failed with exception:', error);
  }
}

// Run the test
main();
