/**
 * AI Storage Service
 * Handles database operations for AI-related data
 */

const { db } = require('../../db');
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
    const [config] = await db
      .select()
      .from(aiConfigs)
      .where(eq(aiConfigs.isActive, true))
      .orderBy(aiConfigs.id)
      .limit(1);
    return config || null;
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
    const [interaction] = await db.insert(aiInteractions).values(data).returning();
    return interaction;
  }

  async getInteraction(id) {
    const [interaction] = await db
      .select()
      .from(aiInteractions)
      .where(eq(aiInteractions.id, id));
    return interaction || null;
  }

  async updateInteraction(id, data) {
    const [interaction] = await db
      .update(aiInteractions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(aiInteractions.id, id))
      .returning();
    return interaction || null;
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
