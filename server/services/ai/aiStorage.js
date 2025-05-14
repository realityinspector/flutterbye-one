/**
 * AI Storage Service
 * Handles database operations for AI-related data
 */

const { db, pool } = require('../../db');
// Keep Drizzle imports for reference but use raw SQL
const { eq, desc, and, isNull } = require('drizzle-orm');
const {
  aiConfigs,
  aiInteractions,
  aiTools,
  aiToolExecutions,
} = require('../../../shared/db/schema');

/**
 * AI Storage service for database operations
 */
class AiStorageService {
  // AI Config methods
  async createConfig(data) {
    const [config] = await db.insert(aiConfigs).values(data).returning();
    return config;
  }

  async getConfig(id) {
    const [config] = await db
      .select()
      .from(aiConfigs)
      .where(eq(aiConfigs.id, id));
    return config || null;
  }

  async getActiveConfig() {
    try {
      const query = 'SELECT * FROM ai_configs WHERE is_active = true ORDER BY id LIMIT 1';
      const result = await pool.query(query);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching active AI config:', error);
      return null;
    }
  }

  async updateConfig(id, data) {
    const [config] = await db
      .update(aiConfigs)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(aiConfigs.id, id))
      .returning();
    return config || null;
  }

  async listConfigs(limit = 20, offset = 0) {
    return db
      .select()
      .from(aiConfigs)
      .orderBy(desc(aiConfigs.updatedAt))
      .limit(limit)
      .offset(offset);
  }

  // AI Interaction methods
  async createInteraction(data) {
    // Skip ORM and directly use raw SQL which is more reliable for this case
    try {
      // Create interaction with raw SQL which handles nulls better
      const query = `
        INSERT INTO ai_interactions
        (user_id, config_id, model, prompt, response, used_web_search, status, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `;
      
      const values = [
        data.userId || null,
        data.configId || null,
        data.model,
        data.prompt,
        data.response || null,
        data.usedWebSearch || false,
        data.status || 'processing',
        data.metadata ? JSON.stringify(data.metadata) : '{}'
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating AI interaction:', error);
      throw error;
    }
  }

  async getInteraction(id) {
    const [interaction] = await db
      .select()
      .from(aiInteractions)
      .where(eq(aiInteractions.id, id));
    return interaction || null;
  }

  async updateInteraction(id, data) {
    try {
      // Use raw SQL for updates as well
      let setClause = [];
      let queryParams = [];
      let paramIndex = 1;
      
      // Build SET clause dynamically
      for (const [key, value] of Object.entries(data)) {
        // Convert camelCase to snake_case for SQL
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        setClause.push(`${snakeKey} = $${paramIndex}`);
        queryParams.push(value === undefined ? null : value);
        paramIndex++;
      }
      
      // Always update the updated_at timestamp
      setClause.push(`updated_at = NOW()`);
      
      const query = `
        UPDATE ai_interactions
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      queryParams.push(id);
      
      const result = await pool.query(query, queryParams);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error updating interaction ${id}:`, error);
      throw error;
    }
  }

  async listInteractions(
    userId,
    limit = 20,
    offset = 0
  ) {
    const query = db.select().from(aiInteractions).orderBy(desc(aiInteractions.createdAt));

    if (userId) {
      query.where(eq(aiInteractions.userId, userId));
    }

    return query.limit(limit).offset(offset);
  }

  // AI Tool methods
  async createTool(data) {
    const [tool] = await db.insert(aiTools).values(data).returning();
    return tool;
  }

  async getTool(id) {
    const [tool] = await db.select().from(aiTools).where(eq(aiTools.id, id));
    return tool || null;
  }

  async getToolByName(name) {
    const [tool] = await db.select().from(aiTools).where(eq(aiTools.name, name));
    return tool || null;
  }

  async updateTool(id, data) {
    const [tool] = await db
      .update(aiTools)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(aiTools.id, id))
      .returning();
    return tool || null;
  }

  async listTools(activeOnly = true) {
    const query = db.select().from(aiTools);

    if (activeOnly) {
      query.where(eq(aiTools.isActive, true));
    }

    return query.orderBy(aiTools.name);
  }

  // AI Tool Execution methods
  async createToolExecution(data) {
    const [execution] = await db.insert(aiToolExecutions).values(data).returning();
    return execution;
  }

  async getToolExecution(id) {
    const [execution] = await db
      .select()
      .from(aiToolExecutions)
      .where(eq(aiToolExecutions.id, id));
    return execution || null;
  }

  async updateToolExecution(id, data) {
    const [execution] = await db
      .update(aiToolExecutions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(aiToolExecutions.id, id))
      .returning();
    return execution || null;
  }

  async listToolExecutionsForInteraction(interactionId) {
    return db
      .select()
      .from(aiToolExecutions)
      .where(eq(aiToolExecutions.interactionId, interactionId))
      .orderBy(aiToolExecutions.createdAt);
  }
}

// Export singleton instance
const aiStorageService = new AiStorageService();

module.exports = { aiStorageService };
