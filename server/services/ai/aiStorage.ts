/**
 * AI Storage Service
 * Handles database operations for AI-related data
 */

import { db } from '../../db';
import { eq, desc, and, isNull } from 'drizzle-orm';
import {
  aiConfigs,
  aiInteractions,
  aiTools,
  aiToolExecutions,
} from '../../../shared/db/schema';
import {
  AiConfig,
  NewAiConfig,
  AiInteraction,
  NewAiInteraction,
  AiTool,
  NewAiTool,
  AiToolExecution,
  NewAiToolExecution,
} from '../../../shared/db/zod-schema';

/**
 * AI Storage service for database operations
 */
export class AiStorageService {
  // AI Config methods
  async createConfig(data: NewAiConfig): Promise<AiConfig> {
    const [config] = await db.insert(aiConfigs).values(data).returning();
    return config;
  }

  async getConfig(id: number): Promise<AiConfig | null> {
    const [config] = await db
      .select()
      .from(aiConfigs)
      .where(eq(aiConfigs.id, id));
    return config || null;
  }

  async getActiveConfig(): Promise<AiConfig | null> {
    const [config] = await db
      .select()
      .from(aiConfigs)
      .where(eq(aiConfigs.isActive, true))
      .orderBy(aiConfigs.id)
      .limit(1);
    return config || null;
  }

  async updateConfig(id: number, data: Partial<AiConfig>): Promise<AiConfig | null> {
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

  async listConfigs(limit: number = 20, offset: number = 0): Promise<AiConfig[]> {
    return db
      .select()
      .from(aiConfigs)
      .orderBy(desc(aiConfigs.updatedAt))
      .limit(limit)
      .offset(offset);
  }

  // AI Interaction methods
  async createInteraction(data: NewAiInteraction): Promise<AiInteraction> {
    const [interaction] = await db.insert(aiInteractions).values(data).returning();
    return interaction;
  }

  async getInteraction(id: number): Promise<AiInteraction | null> {
    const [interaction] = await db
      .select()
      .from(aiInteractions)
      .where(eq(aiInteractions.id, id));
    return interaction || null;
  }

  async updateInteraction(id: number, data: Partial<AiInteraction>): Promise<AiInteraction | null> {
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
    userId?: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<AiInteraction[]> {
    const query = db.select().from(aiInteractions).orderBy(desc(aiInteractions.createdAt));

    if (userId) {
      query.where(eq(aiInteractions.userId, userId));
    }

    return query.limit(limit).offset(offset);
  }

  // AI Tool methods
  async createTool(data: NewAiTool): Promise<AiTool> {
    const [tool] = await db.insert(aiTools).values(data).returning();
    return tool;
  }

  async getTool(id: number): Promise<AiTool | null> {
    const [tool] = await db.select().from(aiTools).where(eq(aiTools.id, id));
    return tool || null;
  }

  async getToolByName(name: string): Promise<AiTool | null> {
    const [tool] = await db.select().from(aiTools).where(eq(aiTools.name, name));
    return tool || null;
  }

  async updateTool(id: number, data: Partial<AiTool>): Promise<AiTool | null> {
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

  async listTools(activeOnly: boolean = true): Promise<AiTool[]> {
    const query = db.select().from(aiTools);

    if (activeOnly) {
      query.where(eq(aiTools.isActive, true));
    }

    return query.orderBy(aiTools.name);
  }

  // AI Tool Execution methods
  async createToolExecution(data: NewAiToolExecution): Promise<AiToolExecution> {
    const [execution] = await db.insert(aiToolExecutions).values(data).returning();
    return execution;
  }

  async getToolExecution(id: number): Promise<AiToolExecution | null> {
    const [execution] = await db
      .select()
      .from(aiToolExecutions)
      .where(eq(aiToolExecutions.id, id));
    return execution || null;
  }

  async updateToolExecution(id: number, data: Partial<AiToolExecution>): Promise<AiToolExecution | null> {
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

  async listToolExecutionsForInteraction(interactionId: number): Promise<AiToolExecution[]> {
    return db
      .select()
      .from(aiToolExecutions)
      .where(eq(aiToolExecutions.interactionId, interactionId))
      .orderBy(aiToolExecutions.createdAt);
  }
}

// Export singleton instance
export const aiStorageService = new AiStorageService();
