/**
 * Web Search Service
 * Provides a specialized web search capability through OpenRouter
 */

const { openRouterService } = require('./openRouter');
const { aiStorageService } = require('./aiStorage');
const { getLeadGenerationPrompt, extractLeadsFromResponse } = require('./leadPromptTemplate');

/**
 * Web Search service for making web searches through OpenRouter
 */
class WebSearchService {
  /**
   * Generate leads based on a natural language description
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
      // Use our templated prompt for lead generation
      const prompt = getLeadGenerationPrompt(description);

      // Set up search options
      const leadOptions = {
        model,
        // No system prompt needed as prompt template handles it
        temperature: options.temperature || (config && config.temperature) || 0.5,
        maxTokens: options.maxTokens || (config && config.maxTokens) || 3000,
        webSearch: true,
        userId: options.userId,
        configId: options.configId || (config && config.id),
        metadata: {
          leadGeneration: true,
          criteria: description,
          searchType: 'lead_gen',
        },
        response_format: { type: 'json_object' },
        additional_instructions: 'Return valid JSON only. After your initial summary, use the precise JSON format requested. Format the JSON as a proper array of objects with strict adherence to the schema.',
      };

      // Call OpenRouter with web search capabilities and full prompt
      const result = await openRouterService.webSearchChatCompletion(prompt, leadOptions);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Lead generation failed',
        };
      }

      // Parse the response to extract leads and summary
      let leads = [];
      let summary = '';
      try {
        // Log the raw response for debugging (truncated for clarity)
        console.log('AI Response for lead generation (truncated):', 
          result.data.text ? result.data.text.substring(0, 100) + '...' : 'No text in response');
        
        // Use our lead extraction utility
        const extracted = extractLeadsFromResponse(result.data.text);
        leads = extracted.leads || [];
        summary = extracted.summary || 'Lead generation complete';
        
        // Log extraction results
        console.log(`Extracted ${leads.length} leads from AI response`);
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
