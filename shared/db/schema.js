// This file provides CommonJS compatibility for the schema
const { pgTable, serial, text, varchar, integer, timestamp, boolean, unique } = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');

// Users table
const users = pgTable('users', {
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
const globalLeads = pgTable('global_leads', {
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
const userLeads = pgTable('user_leads', {
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
const calls = pgTable('calls', {
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

// Organizations table
const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organization members table
const organizationMembers = pgTable('organization_members', {
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

// Define relations
const usersRelations = relations(users, ({ many }) => ({
  userLeads: many(userLeads),
  calls: many(calls),
  createdOrganizations: many(organizations),
  organizationMemberships: many(organizationMembers),
}));

const globalLeadsRelations = relations(globalLeads, ({ many }) => ({
  userLeads: many(userLeads),
}));

const userLeadsRelations = relations(userLeads, ({ one, many }) => ({
  user: one(users, { fields: [userLeads.userId], references: [users.id] }),
  globalLead: one(globalLeads, { fields: [userLeads.globalLeadId], references: [globalLeads.id] }),
  calls: many(calls),
}));

const callsRelations = relations(calls, ({ one }) => ({
  user: one(users, { fields: [calls.userId], references: [users.id] }),
  userLead: one(userLeads, { fields: [calls.userLeadId], references: [userLeads.id] }),
}));

const organizationsRelations = relations(organizations, ({ one, many }) => ({
  creator: one(users, { fields: [organizations.createdBy], references: [users.id] }),
  members: many(organizationMembers),
}));

const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, { fields: [organizationMembers.organizationId], references: [organizations.id] }),
  user: one(users, { fields: [organizationMembers.userId], references: [users.id] }),
}));

module.exports = {
  users,
  globalLeads,
  userLeads,
  calls,
  organizations,
  organizationMembers,
  usersRelations,
  globalLeadsRelations,
  userLeadsRelations,
  callsRelations,
  organizationsRelations,
  organizationMembersRelations,
};
