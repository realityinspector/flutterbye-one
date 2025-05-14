/**
 * AI Routes
 * Endpoints for AI services including OpenRouter integration
 */

const express = require('express');
const { openRouterService, aiStorageService, webSearchService } = require('../services/ai');
const { authenticateJWT } = require('../auth');

const router = express.Router();

// Middleware to authenticate requests
router.use(authenticateJWT);

/**
 * Get AI configurations
 */
router.get('/configs', async (req, res) => {
  try {
    const configs = await aiStorageService.listConfigs();
    return res.json({ success: true, data: configs });
  } catch (error) {
    console.error('Error fetching AI configs:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch AI configurations' });
  }
});

/**
 * Get specific AI configuration
 */
router.get('/configs/:id', async (req, res) => {
  try {
    const config = await aiStorageService.getConfig(parseInt(req.params.id));
    if (!config) {
      return res.status(404).json({ success: false, message: 'AI configuration not found' });
    }
    return res.json({ success: true, data: config });
  } catch (error) {
    console.error('Error fetching AI config:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch AI configuration' });
  }
});

/**
 * Create AI configuration
 */
router.post('/configs', async (req, res) => {
  try {
    // Require admin role for creating configurations
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
    }

    const config = await aiStorageService.createConfig(req.body);
    return res.json({ success: true, data: config });
  } catch (error) {
    console.error('Error creating AI config:', error);
    return res.status(500).json({ success: false, message: 'Failed to create AI configuration' });
  }
});

/**
 * Update AI configuration
 */
router.put('/configs/:id', async (req, res) => {
  try {
    // Require admin role for updating configurations
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
    }

    const config = await aiStorageService.updateConfig(parseInt(req.params.id), req.body);
    if (!config) {
      return res.status(404).json({ success: false, message: 'AI configuration not found' });
    }
    return res.json({ success: true, data: config });
  } catch (error) {
    console.error('Error updating AI config:', error);
    return res.status(500).json({ success: false, message: 'Failed to update AI configuration' });
  }
});

/**
 * Chat completion endpoint
 */
router.post('/chat', async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    // Add user ID to options
    const chatOptions = {
      ...options,
      userId: req.user.id,
    };

    const result = await openRouterService.chatCompletion(prompt, chatOptions);
    return res.json(result);
  } catch (error) {
    console.error('Error in chat completion:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process chat completion request'
    });
  }
});

/**
 * Web search endpoint
 */
router.post('/search', async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    // Add user ID to options
    const searchOptions = {
      ...options,
      userId: req.user.id,
    };

    const result = await webSearchService.search(query, searchOptions);
    return res.json(result);
  } catch (error) {
    console.error('Error in web search:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process web search request'
    });
  }
});

/**
 * Web search endpoint for contact lookup
 * Optimized for finding contact information for leads
 */
router.post('/webSearch', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    // Configure search options for contact information lookup
    const searchOptions = {
      userId: req.user.id,
      metadata: { purpose: 'contact_lookup' },
      model: 'openai/gpt-4o:online', // Use best available model for contact searching
      systemPrompt: 'You are a research assistant helping to find accurate contact information for businesses and individuals. Prioritize finding names of key decision makers, direct phone numbers, and email addresses. Keep your responses concise and focused on factual information. Include sources for verification.'
    };

    // Perform search and analysis
    const rawSearchResults = await webSearchService.search(query, searchOptions);
    
    // Format and return the results
    return res.json({
      success: true,
      summary: rawSearchResults.summary || 'No results found',
      sources: rawSearchResults.sources || [],
      metadata: {
        searchId: rawSearchResults.searchId,
        query,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in contact web search:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process web search for contact information'
    });
  }
});

/**
 * Generate leads based on natural language description
 */
router.post('/leads/generate', async (req, res) => {
  try {
    const { description, options = {}, previousLeads = [], fetchMoreLeads = false } = req.body;
    
    if (!description) {
      return res.status(400).json({ success: false, message: 'Lead description is required' });
    }

    // Add user ID and other parameters to options
    const leadOptions = {
      ...options,
      userId: req.user.id,
      previousLeads,
      fetchMoreLeads
    };

    const result = await webSearchService.generateLeads(description, leadOptions);
    return res.json(result);
  } catch (error) {
    console.error('Error in lead generation:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate leads'
    });
  }
});

/**
 * Create leads from AI-generated lead data
 */
router.post('/leads/create', async (req, res) => {
  try {
    const { leads = [], interactionId } = req.body;
    
    if (!leads.length) {
      return res.status(400).json({ success: false, message: 'Lead data is required' });
    }

    // Validate the interaction if provided
    if (interactionId) {
      const interaction = await aiStorageService.getInteraction(parseInt(interactionId));
      if (!interaction) {
        return res.status(404).json({ success: false, message: 'Interaction not found' });
      }
      
      // Check if the user owns this interaction
      if (interaction.userId && interaction.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to interaction' });
      }
    }

    // Import services needed to create leads
    const { db } = require('../db');
    const { globalLeads, userLeads } = require('../../shared/db/schema');
    
    // Create leads
    const createdLeads = [];
    const { pool } = require('../db');
    
    for (const lead of leads) {
      // Create global lead record using raw SQL
      const globalLeadQuery = `
        INSERT INTO global_leads 
        (company_name, contact_name, phone_number, email, industry, website, address, city, state, zip_code, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *
      `;
      
      const globalLeadValues = [
        lead.companyName || 'Unknown Company',
        lead.contactName || null,
        lead.phoneNumber || null,
        lead.email || null,
        lead.industry || null,
        lead.website || null,
        lead.address || null,
        lead.city || null,
        lead.state || null,
        lead.zipCode || null
      ];
      
      const globalLeadResult = await pool.query(globalLeadQuery, globalLeadValues);
      const globalLead = globalLeadResult.rows[0];
      
      // Create user-specific lead record using raw SQL
      const userLeadQuery = `
        INSERT INTO user_leads
        (user_id, global_lead_id, status, priority, notes, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `;
      
      const userLeadValues = [
        req.user.id,
        globalLead.id,
        'new',
        5, // Default medium priority
        lead.description || ''
      ];
      
      const userLeadResult = await pool.query(userLeadQuery, userLeadValues);
      const userLead = userLeadResult.rows[0];
      
      // Combine data for response
      createdLeads.push({
        ...userLead,
        globalLead
      });
    }
    
    // Return success response with created leads
    return res.status(201).json({ 
      success: true, 
      message: `Successfully created ${createdLeads.length} leads`, 
      data: createdLeads 
    });
  } catch (error) {
    console.error('Error creating leads from AI data:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create leads from AI data'
    });
  }
});

/**
 * Analyze search results with follow-up questions
 */
router.post('/search/analyze', async (req, res) => {
  try {
    const { interactionId, followUpQuery, options = {} } = req.body;
    
    if (!interactionId || !followUpQuery) {
      return res.status(400).json({ 
        success: false, 
        message: 'Interaction ID and follow-up query are required' 
      });
    }

    // Add user ID to options
    const analyzeOptions = {
      ...options,
      userId: req.user.id,
    };

    const result = await webSearchService.analyzeSearchResult(
      parseInt(interactionId),
      followUpQuery,
      analyzeOptions
    );
    
    return res.json(result);
  } catch (error) {
    console.error('Error in search analysis:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process search analysis request'
    });
  }
});

/**
 * Get AI interactions for user
 */
router.get('/interactions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const interactions = await aiStorageService.listInteractions(req.user.id, limit, offset);
    return res.json({ success: true, data: interactions });
  } catch (error) {
    console.error('Error fetching AI interactions:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch AI interactions' });
  }
});

/**
 * Get specific AI interaction
 */
router.get('/interactions/:id', async (req, res) => {
  try {
    const interaction = await aiStorageService.getInteraction(parseInt(req.params.id));
    
    if (!interaction) {
      return res.status(404).json({ success: false, message: 'AI interaction not found' });
    }
    
    // Check if user has access to this interaction
    if (interaction.userId && interaction.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to interaction' });
    }
    
    return res.json({ success: true, data: interaction });
  } catch (error) {
    console.error('Error fetching AI interaction:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch AI interaction' });
  }
});

module.exports = router;
