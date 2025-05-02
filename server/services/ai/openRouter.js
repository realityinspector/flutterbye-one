/**
 * OpenRouter Service
 * Provides an interface to interact with OpenRouter API
 * supporting both standard chat completions and web search capabilities
 */

// Import OpenAI dynamically since it's an ESM module
let OpenAI;
try {
  // This will be replaced with a dynamic import in the constructor
  OpenAI = null;
} catch (error) {
  console.error('Failed to import OpenAI:', error);
}

const { aiInteractions } = require('../../../shared/db/schema');
const { eq } = require('drizzle-orm');

// Import directly from db.js to ensure we're using the same database connection
const { db, pool } = require('../../db');

// Constants
const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'openai/gpt-4o';
const DEFAULT_WEB_SEARCH_MODEL = 'openai/gpt-4o:online';

/**
 * OpenRouter service class for handling LLM interactions
 */
class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      console.error('OpenRouter API key is missing');
    }

    // Delay initialization of the OpenAI client until first use
    this.client = null;
    this.clientPromise = this.initializeClient();
  }

  async initializeClient() {
    try {
      // Dynamically import the OpenAI module
      const { default: OpenAIModule } = await import('openai');
      OpenAI = OpenAIModule;
      
      this.client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: OPENROUTER_API_BASE,
        defaultHeaders: {
          'HTTP-Referer': 'https://crm-ai-assistant.replit.app',
          'X-Title': 'CRM AI Assistant',
        },
      });
      
      return this.client;
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      throw error;
    }
  }

  /**
   * Get the OpenAI client, initializing it if needed
   */
  async getClient() {
    if (!this.client) {
      await this.clientPromise;
    }
    return this.client;
  }

  /**
   * Send a prompt to OpenRouter for completion with optional web search
   */
  async chatCompletion(prompt, options = {}) {
    try {
      const client = await this.getClient();
      const startTime = Date.now();
      const model = options.webSearch
        ? options.model || DEFAULT_WEB_SEARCH_MODEL
        : options.model || DEFAULT_MODEL;

      // Create a database record for this interaction
      const interactionData = {
        userId: options.userId,
        configId: options.configId,
        model,
        prompt,
        usedWebSearch: options.webSearch || false,
        status: 'processing',
        metadata: options.metadata || {},
      };

      console.log('Inserting interaction with data:', JSON.stringify(interactionData));
      
      // Insert into the database using raw SQL query
      const insertQuery = `
        INSERT INTO ai_interactions 
        (model, prompt, used_web_search, status, metadata, user_id, config_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `;
      
      const insertResult = await pool.query(insertQuery, [
        interactionData.model,
        interactionData.prompt,
        interactionData.usedWebSearch,
        interactionData.status,
        interactionData.metadata,
        interactionData.userId,
        interactionData.configId
      ]);
      
      const interaction = insertResult.rows[0];

      console.log(`Created AI interaction #${interaction.id}`);

      // Prepare messages array
      const messages = [];

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
      const requestOptions = {
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
      };
      
      // Set response format if specified
      if (options.response_format) {
        requestOptions.response_format = options.response_format;
      } else {
        requestOptions.response_format = { type: 'text' };
      }
      
      const response = await client.chat.completions.create(requestOptions);

      const completionText = response.choices[0]?.message?.content;
      const duration = Date.now() - startTime;

      // Update the interaction in the database with results
      console.log(`Updating interaction #${interaction.id} with completion data in database`);
      
      // Use raw SQL query for update instead of Drizzle ORM
      const updateQuery = `
        UPDATE ai_interactions 
        SET response = $1, status = $2, duration = $3, token_count = $4, updated_at = NOW()
        WHERE id = $5
      `;
      
      await pool.query(updateQuery, [
        completionText || '',
        'completed',
        duration,
        response.usage?.total_tokens || 0,
        interaction.id
      ]);

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
  async webSearchChatCompletion(prompt, options = {}) {
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
  async getConfig(configId) {
    try {
      let query;
      let params = [];
      
      if (configId) {
        // Fetch specific config
        query = 'SELECT * FROM ai_configs WHERE id = $1 LIMIT 1';
        params = [configId];
      } else {
        // Get default active config
        query = 'SELECT * FROM ai_configs WHERE is_active = true ORDER BY id ASC LIMIT 1';
      }
      
      const result = await pool.query(query, params);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching AI config:', error);
      return null;
    }
  }

  /**
   * Get interaction by ID
   */
  async getInteraction(interactionId) {
    try {
      const query = 'SELECT * FROM ai_interactions WHERE id = $1 LIMIT 1';
      const result = await pool.query(query, [interactionId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching AI interaction:', error);
      return null;
    }
  }
}

// Export singleton instance
const openRouterService = new OpenRouterService();

module.exports = { openRouterService };
