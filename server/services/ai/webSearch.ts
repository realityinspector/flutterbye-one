/**
 * Web Search Service
 * Provides a specialized web search capability through OpenRouter
 */

import { openRouterService } from './openRouter';
import { aiStorageService } from './aiStorage';

// Types for search options
export interface WebSearchOptions {
  userId?: number;
  configId?: number;
  maxResults?: number;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// Types for search results
export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchResponse {
  success: boolean;
  query: string;
  results?: WebSearchResult[];
  summary?: string;
  interactionId?: number;
  error?: string;
}

/**
 * Web Search service for making web searches through OpenRouter
 */
export class WebSearchService {
  /**
   * Perform a web search using OpenRouter
   */
  async search(query: string, options: WebSearchOptions = {}): Promise<WebSearchResponse> {
    try {
      // Get configuration if specified
      let config = null;
      if (options.configId) {
        config = await aiStorageService.getConfig(options.configId);
      } else {
        config = await aiStorageService.getActiveConfig();
      }

      const model = options.model || config?.webSearchModel || 'openai/gpt-4o:online';
      const systemPrompt = `You are a helpful web search assistant. 
      You have access to search the web for up-to-date information. 
      First search for information related to the user's query, 
      then provide a detailed but concise response based on the search results.
      Always cite your sources with URLs when providing information.`;

      // Set up search options
      const searchOptions = {
        model,
        systemPrompt,
        temperature: options.temperature || config?.temperature || 0.5,
        maxTokens: options.maxTokens || config?.maxTokens || 2000,
        webSearch: true,
        userId: options.userId,
        configId: options.configId || config?.id,
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
    interactionId: number,
    followUpQuery: string,
    options: WebSearchOptions = {}
  ): Promise<WebSearchResponse> {
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
      const prompt = `Based on the previous search:

Original query: ${interaction.prompt}

Search results: ${interaction.response}

I'd like to know more about: ${followUpQuery}`;

      const systemPrompt = `You are a helpful web search assistant analyzing previous search results. 
      Based on the original search query and results, provide a detailed answer to the user's follow-up question. 
      If you don't have enough information from the previous results, indicate what additional information might be needed.`;

      const model = options.model || config?.webSearchModel || 'openai/gpt-4o:online';

      // Set up search options
      const analyzeOptions = {
        model,
        systemPrompt,
        temperature: options.temperature || config?.temperature || 0.5,
        maxTokens: options.maxTokens || config?.maxTokens || 2000,
        webSearch: true,  // Enable web search if needed for follow-up
        userId: options.userId || interaction.userId,
        configId: options.configId || interaction.configId || config?.id,
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
export const webSearchService = new WebSearchService();
