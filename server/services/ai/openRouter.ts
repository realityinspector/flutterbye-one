/**
 * OpenRouter Service
 * Provides an interface to interact with OpenRouter API
 * supporting both standard chat completions and web search capabilities
 */

import OpenAI from 'openai';
import fetch from 'node-fetch';
import { AiConfig, AiInteraction, NewAiInteraction } from '../../../shared/db/zod-schema';
import { db } from '../../db';
import { aiInteractions } from '../../../shared/db/schema';
import { eq } from 'drizzle-orm';

// Constants
const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'openai/gpt-4o';
const DEFAULT_WEB_SEARCH_MODEL = 'openai/gpt-4o:online';

// Types for OpenRouter options
interface OpenRouterOptions {
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  webSearch?: boolean;
  userId?: number;
  configId?: number;
  metadata?: Record<string, any>;
}

interface WebSearchResults {
  query: string;
  results: Array<{
    title: string;
    url: string;
    content: string;
  }>;
}

/**
 * OpenRouter service class for handling LLM interactions
 */
export class OpenRouterService {
  private client: OpenAI;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      console.error('OpenRouter API key is missing');
    }

    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: OPENROUTER_API_BASE,
      defaultHeaders: {
        'HTTP-Referer': 'https://crm-ai-assistant.replit.app',
        'X-Title': 'CRM AI Assistant',
      },
    });
  }

  /**
   * Send a prompt to OpenRouter for completion with optional web search
   */
  async chatCompletion(
    prompt: string,
    options: OpenRouterOptions = {}
  ): Promise<{ success: boolean; data?: any; error?: string; interactionId?: number }> {
    try {
      const startTime = Date.now();
      const model = options.webSearch
        ? options.model || DEFAULT_WEB_SEARCH_MODEL
        : options.model || DEFAULT_MODEL;

      // Create a database record for this interaction
      const interactionData: NewAiInteraction = {
        userId: options.userId,
        configId: options.configId,
        model,
        prompt,
        usedWebSearch: options.webSearch || false,
        status: 'processing',
        metadata: options.metadata || {},
      };

      // Insert interaction into database
      const [interaction] = await db
        .insert(aiInteractions)
        .values(interactionData)
        .returning();

      console.log(`Created AI interaction #${interaction.id}`);

      // Prepare messages array
      const messages: Array<OpenAI.ChatCompletionMessageParam> = [];

      // Add system prompt if provided
      if (options.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt,
        });
      }

      // Add user message
      messages.push({
        role: 'user',
        content: prompt,
      });

      // Make the API request
      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
        response_format: { type: 'text' },
      });

      const completionText = response.choices[0]?.message?.content;
      const duration = Date.now() - startTime;

      // Update the interaction in the database with results
      await db
        .update(aiInteractions)
        .set({
          response: completionText || '',
          status: 'completed',
          duration,
          tokenCount: response.usage?.total_tokens || 0,
          updatedAt: new Date(),
        })
        .where(eq(aiInteractions.id, interaction.id));

      return {
        success: true,
        data: {
          text: completionText,
          model,
          usage: response.usage,
        },
        interactionId: interaction.id,
      };
    } catch (error) {
      console.error('OpenRouter chat completion error:', error);
      return {
        success: false,
        error: error.message || 'Unknown error in OpenRouter chat completion',
      };
    }
  }

  /**
   * Specialized method for completions that require web search
   */
  async webSearchChatCompletion(
    prompt: string,
    options: OpenRouterOptions = {}
  ): Promise<{ success: boolean; data?: any; error?: string; interactionId?: number }> {
    try {
      // Force web search model
      const webSearchOptions = {
        ...options,
        webSearch: true,
        model: options.model || DEFAULT_WEB_SEARCH_MODEL,
      };

      return await this.chatCompletion(prompt, webSearchOptions);
    } catch (error) {
      console.error('Web search chat completion error:', error);
      return {
        success: false,
        error: error.message || 'Unknown error in web search chat completion',
      };
    }
  }

  /**
   * Get a configuration for a specific ID or the default configuration
   */
  async getConfig(configId?: number): Promise<AiConfig | null> {
    try {
      if (configId) {
        // Fetch specific config
        const [config] = await db.query.aiConfigs.findMany({
          where: (aiConfigs, { eq }) => eq(aiConfigs.id, configId),
          limit: 1,
        });
        // Ensure fallbackModels is properly typed
        if (config) {
          return {
            ...config,
            fallbackModels: Array.isArray(config.fallbackModels) ? config.fallbackModels : null
          };
        }
        return null;
      } else {
        // Get default active config
        const [config] = await db.query.aiConfigs.findMany({
          where: (aiConfigs, { eq }) => eq(aiConfigs.isActive, true),
          orderBy: (aiConfigs, { asc }) => [asc(aiConfigs.id)],
          limit: 1,
        });
        // Ensure fallbackModels is properly typed
        if (config) {
          return {
            ...config,
            fallbackModels: Array.isArray(config.fallbackModels) ? config.fallbackModels : null
          };
        }
        return null;
      }
    } catch (error) {
      console.error('Error fetching AI config:', error);
      return null;
    }
  }

  /**
   * Get interaction by ID
   */
  async getInteraction(interactionId: number): Promise<AiInteraction | null> {
    try {
      const [interaction] = await db.query.aiInteractions.findMany({
        where: (aiInteractions, { eq }) => eq(aiInteractions.id, interactionId),
        limit: 1,
      });

      if (interaction) {
        // Ensure status is properly typed
        const validStatus = ['pending', 'processing', 'completed', 'failed'];
        const status = validStatus.includes(interaction.status) 
          ? interaction.status as 'pending' | 'processing' | 'completed' | 'failed'
          : 'pending';

        return {
          ...interaction,
          status,
          metadata: interaction.metadata || {},
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching AI interaction:', error);
      return null;
    }
  }
}

// Export singleton instance
export const openRouterService = new OpenRouterService();
