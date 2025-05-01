import { pgTable, serial, text, varchar, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
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

// Global leads table (shared lead data)
export const globalLeads = pgTable('global_leads', {
  id: serial('id').primaryKey(),
  companyName: varchar('company_name', { length: 100 }).notNull(),
  contactName: varchar('contact_name', { length: 100 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
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

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  userLeads: many(userLeads),
  calls: many(calls),
}));

export const globalLeadsRelations = relations(globalLeads, ({ many }) => ({
  userLeads: many(userLeads),
}));

export const userLeadsRelations = relations(userLeads, ({ one, many }) => ({
  user: one(users, { fields: [userLeads.userId], references: [users.id] }),
  globalLead: one(globalLeads, { fields: [userLeads.globalLeadId], references: [globalLeads.id] }),
  calls: many(calls),
}));

export const callsRelations = relations(calls, ({ one }) => ({
  user: one(users, { fields: [calls.userId], references: [users.id] }),
  userLead: one(userLeads, { fields: [calls.userLeadId], references: [userLeads.id] }),
}));

// Export the combined schema
export default {
  users,
  globalLeads,
  userLeads,
  calls,
  usersRelations,
  globalLeadsRelations,
  userLeadsRelations,
  callsRelations,
};
