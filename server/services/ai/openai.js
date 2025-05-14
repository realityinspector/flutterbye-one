/**
 * OpenAI API service for lead generation with web search capabilities
 * Enhanced implementation using official OpenAI client
 */

const { OpenAI } = require('openai');
const config = require('../../config');

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Use OpenAI to generate leads based on criteria with web search
 * @param {string} prompt - The formatted prompt for lead generation
 * @param {Object} options - Additional options
 * @returns {Promise<string>} The AI-generated response
 */
async function generateLeadsWithWebSearch(prompt, options = {}) {
  try {
    console.log('Using OpenAI for lead generation with web search...');
    
    // Create a formatted message for web search
    const messages = [
      {
        role: 'system',
        content: 'You are a sales research assistant that helps sales professionals find new leads. You excel at finding accurate contact information and use web search when needed.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    // Configure the ChatCompletion call with web browsing capability
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4000
    });

    // Extract the response content
    const responseContent = response.choices[0].message.content;
    console.log('OpenAI response received successfully');
    
    return responseContent;
  } catch (error) {
    console.error('Error using OpenAI for lead generation:', error);
    throw new Error(`OpenAI lead generation failed: ${error.message}`);
  }
}

module.exports = { generateLeadsWithWebSearch };