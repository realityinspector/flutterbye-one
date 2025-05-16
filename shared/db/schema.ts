import { pgTable, serial, text, varchar, integer, timestamp, boolean, jsonb, real, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  companyName: varchar('company_name', { length: 100 }),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  hasCompletedSetup: boolean('has_completed_setup').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organizations table
export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organization members table
export const organizationMembers = pgTable('organization_members', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => {
  return {
    unqOrgUser: unique().on(table.organizationId, table.userId),
  };
});

// Global leads table (shared lead data)
export const globalLeads = pgTable('global_leads', {
  id: serial('id').primaryKey(),
  companyName: varchar('company_name', { length: 100 }).notNull(),
  contactName: varchar('contact_name', { length: 100 }),
  phoneNumber: varchar('phone_number', { length: 20 }),
  email: varchar('email', { length: 100 }),
  address: varchar('address', { length: 200 }),
  city: varchar('city', { length: 50 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 20 }),
  industry: varchar('industry', { length: 50 }),
  website: varchar('website', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User-specific leads table
export const userLeads = pgTable('user_leads', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  globalLeadId: integer('global_lead_id').notNull().references(() => globalLeads.id),
  status: varchar('status', { length: 20 }).notNull().default('new'),
  priority: integer('priority').notNull().default(5),
  notes: text('notes'),
  lastContactedAt: timestamp('last_contacted_at'),
  reminderDate: timestamp('reminder_date'),
  organizationId: integer('organization_id').references(() => organizations.id),
  isShared: boolean('is_shared').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Call records table
export const calls = pgTable('calls', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  userLeadId: integer('user_lead_id').notNull().references(() => userLeads.id, { onDelete: 'cascade' }),
  callDate: timestamp('call_date').notNull(),
  duration: integer('duration'),
  outcome: varchar('outcome', { length: 20 }),
  notes: text('notes'),
  reminderDate: timestamp('reminder_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// AI Assistant configurations table
export const aiConfigs = pgTable('ai_configs', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  defaultModel: varchar('default_model', { length: 100 }).notNull(),
  webSearchModel: varchar('web_search_model', { length: 100 }).notNull().default('openai/gpt-4o:online'),
  fallbackModels: jsonb('fallback_models'),
  systemPrompt: text('system_prompt'),
  maxTokens: integer('max_tokens').default(2000),
  temperature: real('temperature').default(0.7),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// AI Model requests and responses table
export const aiInteractions = pgTable('ai_interactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  configId: integer('config_id').references(() => aiConfigs.id, { onDelete: 'set null' }),
  model: varchar('model', { length: 100 }).notNull(),
  prompt: text('prompt').notNull(),
  response: text('response'),
  usedWebSearch: boolean('used_web_search').default(false),
  searchQuery: text('search_query'),
  searchResults: jsonb('search_results'),
  tokenCount: integer('token_count'),
  duration: integer('duration'),  // milliseconds
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  error: text('error'),
  metadata: jsonb('metadata'),  // For any additional data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// AI Tool definitions for tool calling
export const aiTools = pgTable('ai_tools', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description').notNull(),
  parameters: jsonb('parameters').notNull(),  // JSON Schema of parameters
  handlerFunction: varchar('handler_function', { length: 100 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// AI Tool executions
export const aiToolExecutions = pgTable('ai_tool_executions', {
  id: serial('id').primaryKey(),
  interactionId: integer('interaction_id').references(() => aiInteractions.id, { onDelete: 'cascade' }).notNull(),
  toolId: integer('tool_id').references(() => aiTools.id, { onDelete: 'set null' }),
  arguments: jsonb('arguments').notNull(),
  result: jsonb('result'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  error: text('error'),
  duration: integer('duration'),  // milliseconds
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  userLeads: many(userLeads),
  calls: many(calls),
  aiInteractions: many(aiInteractions),
  createdOrganizations: many(organizations, { relationName: 'creator' }),
  memberOfOrganizations: many(organizationMembers, { relationName: 'user' }),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  creator: one(users, { fields: [organizations.createdBy], references: [users.id] }),
  members: many(organizationMembers),
  leads: many(userLeads),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, { fields: [organizationMembers.organizationId], references: [organizations.id] }),
  user: one(users, { fields: [organizationMembers.userId], references: [users.id] }),
}));

export const globalLeadsRelations = relations(globalLeads, ({ many }) => ({
  userLeads: many(userLeads),
}));

export const userLeadsRelations = relations(userLeads, ({ one, many }) => ({
  user: one(users, { fields: [userLeads.userId], references: [users.id] }),
  globalLead: one(globalLeads, { fields: [userLeads.globalLeadId], references: [globalLeads.id] }),
  organization: one(organizations, { fields: [userLeads.organizationId], references: [organizations.id] }),
  calls: many(calls),
}));

export const callsRelations = relations(calls, ({ one }) => ({
  user: one(users, { fields: [calls.userId], references: [users.id] }),
  userLead: one(userLeads, { fields: [calls.userLeadId], references: [userLeads.id] }),
}));

export const aiConfigsRelations = relations(aiConfigs, ({ many }) => ({
  aiInteractions: many(aiInteractions),
}));

export const aiInteractionsRelations = relations(aiInteractions, ({ one, many }) => ({
  user: one(users, { fields: [aiInteractions.userId], references: [users.id] }),
  config: one(aiConfigs, { fields: [aiInteractions.configId], references: [aiConfigs.id] }),
  toolExecutions: many(aiToolExecutions),
}));

export const aiToolsRelations = relations(aiTools, ({ many }) => ({
  toolExecutions: many(aiToolExecutions),
}));

export const aiToolExecutionsRelations = relations(aiToolExecutions, ({ one }) => ({
  interaction: one(aiInteractions, { fields: [aiToolExecutions.interactionId], references: [aiInteractions.id] }),
  tool: one(aiTools, { fields: [aiToolExecutions.toolId], references: [aiTools.id] }),
}));

// Export the combined schema
export default {
  users,
  organizations,
  organizationMembers,
  globalLeads,
  userLeads,
  calls,
  aiConfigs,
  aiInteractions,
  aiTools,
  aiToolExecutions,
  usersRelations,
  organizationsRelations,
  organizationMembersRelations,
  globalLeadsRelations,
  userLeadsRelations,
  callsRelations,
  aiConfigsRelations,
  aiInteractionsRelations,
  aiToolsRelations,
  aiToolExecutionsRelations,
};
