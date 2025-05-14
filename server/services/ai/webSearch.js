/**
 * Web Search Service
 * Provides a specialized web search capability through OpenRouter or OpenAI
 */

const { openRouterService } = require('./openRouter');
const { generateLeadsWithWebSearch } = require('./openai');
const { aiStorageService } = require('./aiStorage');
const { getLeadGenerationPrompt, extractLeadsFromResponse } = require('./leadPromptTemplate');

/**
 * Web Search service for making web searches through OpenRouter
 */
class WebSearchService {
  /**
   * Generate leads based on a natural language description
   * @param {string} description - Natural language description of leads to find
   * @param {Object} options - Options for lead generation
   * @param {Array} options.previousLeads - Previously returned leads (for "more leads" functionality)
   * @param {boolean} options.fetchMoreLeads - Set to true to fetch more leads beyond the initial set
   */
  async generateLeads(description, options = {}) {
    try {
      // Get configuration if specified
      let config = null;
      if (options.configId) {
        config = await aiStorageService.getConfig(options.configId);
      } else {
        config = await aiStorageService.getActiveConfig();
      }

      const model = options.model || (config && config.webSearchModel) || 'openai/gpt-4o:online';
      
      // Use our templated prompt for lead generation with appropriate parameters
      const prompt = getLeadGenerationPrompt(
        description, 
        options.previousLeads || [], 
        options.fetchMoreLeads || false
      );

      // Set up search options
      const leadOptions = {
        model,
        // No system prompt needed as prompt template handles it
        temperature: options.temperature || (config && config.temperature) || 0.5,
        // Increase max tokens for when fetching more leads
        maxTokens: options.maxTokens || (config && config.maxTokens) || (options.fetchMoreLeads ? 4000 : 3000),
        webSearch: true,
        userId: options.userId,
        configId: options.configId || (config && config.id),
        metadata: {
          leadGeneration: true,
          criteria: description,
          searchType: 'lead_gen',
          fetchingMoreLeads: options.fetchMoreLeads || false,
          previousLeadsCount: options.previousLeads ? options.previousLeads.length : 0,
        },
        response_format: { type: 'json_object' },
        additional_instructions: 'Return valid JSON only. After your initial summary, use the precise JSON format requested. Format the JSON as a proper array of objects with strict adherence to the schema.',
      };

      let result;
      
      // Create interaction record first to have a record regardless of which service is used
      const interactionData = {
        configId: leadOptions.configId,
        model: process.env.OPENAI_API_KEY ? 'openai/gpt-4o' : 'openai/gpt-4o:online',
        prompt: prompt,
        usedWebSearch: true,
        status: 'processing',
        metadata: leadOptions.metadata
      };
      
      // Record the interaction in our storage
      const interaction = await aiStorageService.createInteraction(interactionData);
      let responseText;
      
      // Try to use OpenAI first if API key is available
      if (process.env.OPENAI_API_KEY) {
        console.log('Using OpenAI for lead generation...');
        try {
          // Use our OpenAI implementation with web search
          responseText = await generateLeadsWithWebSearch(prompt, leadOptions);
          
          // Set result with OpenAI response
          result = {
            success: true,
            data: { text: responseText },
            interactionId: interaction.id
          };
        } catch (openaiError) {
          console.error('OpenAI lead generation failed, falling back to OpenRouter:', openaiError);
          // Fall back to OpenRouter if OpenAI fails
          result = await openRouterService.webSearchChatCompletion(prompt, leadOptions);
        }
      } else {
        // Use OpenRouter as fallback
        console.log('Using OpenRouter for lead generation...');
        result = await openRouterService.webSearchChatCompletion(prompt, leadOptions);
      }
      
      // Update the interaction with the response
      if (result.success) {
        await aiStorageService.updateInteraction(interaction.id, {
          response: result.data.text,
          status: 'completed'
        });
      } else {
        await aiStorageService.updateInteraction(interaction.id, {
          error: result.error || 'Lead generation failed',
          status: 'error'
        });
      }

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Lead generation failed',
        };
      }

      // Parse the response to extract leads and summary
      let leads = [];
      let summary = '';
      let no_more_records_available = false;
      
      try {
        // Log the raw response for debugging (truncated for clarity)
        console.log('AI Response for lead generation (truncated):', 
          result.data.text ? result.data.text.substring(0, 100) + '...' : 'No text in response');
        
        // Use our lead extraction utility
        const extracted = extractLeadsFromResponse(result.data.text);
        leads = extracted.leads || [];
        summary = extracted.summary || 'Lead generation complete';
        no_more_records_available = extracted.no_more_records_available || false;
        
        // Log extraction results
        console.log(`Extracted ${leads.length} leads from AI response`);
        console.log(`No more records available: ${no_more_records_available}`);
        
        if (leads.length > 0) {
          console.log('First lead example:', JSON.stringify(leads[0]).substring(0, 150) + '...');
        }
      } catch (parseError) {
        console.error('Error extracting leads from response:', parseError);
        
        // Return detailed error information
        return {
          success: false,
          error: 'Failed to parse lead generation results',
          rawText: result.data.text ? result.data.text.substring(0, 300) + '...' : 'No text received',
        };
      }

      // Return the lead generation results
      return {
        success: true,
        leads,
        sources: leads.flatMap(lead => lead.sources || []), // Aggregate sources from all leads
        summary,
        interactionId: result.interactionId,
        no_more_records_available
      };
    } catch (error) {
      console.error('Lead generation error:', error);
      return {
        success: false,
        error: error.message || 'An error occurred during lead generation',
      };
    }
  }

  /**
   * Perform a web search using OpenRouter
   */
  async search(query, options = {}) {
    try {
      // Get configuration if specified
      let config = null;
      if (options.configId) {
        config = await aiStorageService.getConfig(options.configId);
      } else {
        config = await aiStorageService.getActiveConfig();
      }

      const model = options.model || (config && config.webSearchModel) || 'openai/gpt-4o:online';
      const systemPrompt = `You are a helpful web search assistant. 
      You have access to search the web for up-to-date information. 
      First search for information related to the user's query, 
      then provide a detailed but concise response based on the search results.
      Always cite your sources with URLs when providing information.`;

      // Set up search options
      const searchOptions = {
        model,
        systemPrompt,
        temperature: options.temperature || (config && config.temperature) || 0.5,
        maxTokens: options.maxTokens || (config && config.maxTokens) || 2000,
        webSearch: true,
        userId: options.userId,
        configId: options.configId || (config && config.id),
        metadata: {
          originalQuery: query,
          searchType: 'web',
        },
      };

      // Call OpenRouter with web search capabilities
      const result = await openRouterService.webSearchChatCompletion(query, searchOptions);

      if (!result.success) {
        return {
          success: false,
          query,
          error: result.error || 'Web search failed',
        };
      }

      // Return the search results
      return {
        success: true,
        query,
        summary: result.data?.text || '',
        interactionId: result.interactionId,
      };
    } catch (error) {
      console.error('Web search error:', error);
      return {
        success: false,
        query,
        error: error.message || 'An error occurred during the web search',
      };
    }
  }

  /**
   * Analyze a search result with follow-up questions
   */
  async analyzeSearchResult(
    interactionId,
    followUpQuery,
    options = {}
  ) {
    try {
      // Get the original interaction
      const interaction = await aiStorageService.getInteraction(interactionId);
      if (!interaction) {
        return {
          success: false,
          query: followUpQuery,
          error: 'Original search interaction not found',
        };
      }

      // Get configuration
      let config = null;
      if (options.configId) {
        config = await aiStorageService.getConfig(options.configId);
      } else if (interaction.configId) {
        config = await aiStorageService.getConfig(interaction.configId);
      } else {
        config = await aiStorageService.getActiveConfig();
      }

      // Construct a prompt that includes the original search and response
      const prompt = `Based on the previous search:\n\nOriginal query: ${interaction.prompt}\n\nSearch results: ${interaction.response}\n\nI'd like to know more about: ${followUpQuery}`;

      const systemPrompt = `You are a helpful web search assistant analyzing previous search results. 
      Based on the original search query and results, provide a detailed answer to the user's follow-up question. 
      If you don't have enough information from the previous results, indicate what additional information might be needed.`;

      const model = options.model || (config && config.webSearchModel) || 'openai/gpt-4o:online';

      // Set up search options
      const analyzeOptions = {
        model,
        systemPrompt,
        temperature: options.temperature || (config && config.temperature) || 0.5,
        maxTokens: options.maxTokens || (config && config.maxTokens) || 2000,
        webSearch: true,  // Enable web search if needed for follow-up
        userId: options.userId || interaction.userId,
        configId: options.configId || interaction.configId || (config && config.id),
        metadata: {
          originalInteractionId: interaction.id,
          originalQuery: interaction.prompt,
          followUpQuery: followUpQuery,
          analysisType: 'followup',
        },
      };

      // Call OpenRouter with web search capabilities
      const result = await openRouterService.webSearchChatCompletion(prompt, analyzeOptions);

      if (!result.success) {
        return {
          success: false,
          query: followUpQuery,
          error: result.error || 'Analysis failed',
        };
      }

      // Return the analysis results
      return {
        success: true,
        query: followUpQuery,
        summary: result.data?.text || '',
        interactionId: result.interactionId,
      };
    } catch (error) {
      console.error('Search analysis error:', error);
      return {
        success: false,
        query: followUpQuery,
        error: error.message || 'An error occurred during the analysis',
      };
    }
  }
}

// Export singleton instance
const webSearchService = new WebSearchService();

module.exports = { webSearchService };
