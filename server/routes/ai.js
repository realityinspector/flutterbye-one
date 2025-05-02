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
