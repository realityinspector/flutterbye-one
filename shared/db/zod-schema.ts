import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { users, globalLeads, userLeads, calls } from './schema';

// User schemas
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email().min(5).max(100),
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(255),
  fullName: z.string().min(2).max(100),
  companyName: z.string().max(100).nullable().optional(),
  role: z.enum(['admin', 'user']).default('user'),
  hasCompletedSetup: z.boolean().default(false),
});

export const selectUserSchema = createSelectSchema(users, {
  email: z.string().email().min(5).max(100),
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(255),
  fullName: z.string().min(2).max(100),
  companyName: z.string().max(100).nullable().optional(),
  role: z.string().transform(val => val as 'admin' | 'user'),
  hasCompletedSetup: z.boolean(),
});

export const userLoginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(255),
});

export const userUpdateSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().min(5).max(100).optional(),
  companyName: z.string().max(100).nullable().optional(),
  password: z.string().min(8).max(255).optional(),
  hasCompletedSetup: z.boolean().optional(),
});

// Global lead schemas
export const insertGlobalLeadSchema = createInsertSchema(globalLeads, {
  companyName: z.string().min(2).max(100),
  contactName: z.string().min(2).max(100),
  phoneNumber: z.string().min(5).max(20),
  email: z.string().email().max(100).nullable().optional(),
  address: z.string().max(200).nullable().optional(),
  city: z.string().max(50).nullable().optional(),
  state: z.string().max(50).nullable().optional(),
  zipCode: z.string().max(20).nullable().optional(),
  industry: z.string().max(50).nullable().optional(),
  website: z.string().max(100).nullable().optional(),
});

export const selectGlobalLeadSchema = createSelectSchema(globalLeads, {
  companyName: z.string().min(2).max(100),
  contactName: z.string().min(2).max(100),
  phoneNumber: z.string().min(5).max(20),
  email: z.string().email().max(100).nullable().optional(),
  address: z.string().max(200).nullable().optional(),
  city: z.string().max(50).nullable().optional(),
  state: z.string().max(50).nullable().optional(),
  zipCode: z.string().max(20).nullable().optional(),
  industry: z.string().max(50).nullable().optional(),
  website: z.string().max(100).nullable().optional(),
});

// User lead schemas
export const insertUserLeadSchema = createInsertSchema(userLeads, {
  userId: z.number().int().positive(),
  globalLeadId: z.number().int().positive(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).default('new'),
  priority: z.number().int().min(1).max(10).default(5),
  notes: z.string().nullable().optional(),
  lastContactedAt: z.date().nullable().optional(),
  reminderDate: z.date().nullable().optional(),
});

export const selectUserLeadSchema = createSelectSchema(userLeads, {
  userId: z.number().int().positive(),
  globalLeadId: z.number().int().positive(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
  priority: z.number().int().min(1).max(10),
  notes: z.string().nullable().optional(),
  lastContactedAt: z.date().nullable().optional(),
  reminderDate: z.date().nullable().optional(),
});

// Call schemas
export const insertCallSchema = createInsertSchema(calls, {
  userId: z.number().int().positive(),
  userLeadId: z.number().int().positive(),
  callDate: z.date(),
  duration: z.number().int().nonnegative().optional(),
  outcome: z.enum(['interested', 'not_interested', 'callback', 'voicemail', 'no_answer', 'completed', 'left_message']).optional(),
  notes: z.string().nullable().optional(),
  reminderDate: z.date().nullable().optional(),
});

export const selectCallSchema = createSelectSchema(calls, {
  userId: z.number().int().positive(),
  userLeadId: z.number().int().positive(),
  callDate: z.date(),
  duration: z.number().int().nonnegative().nullable().optional(),
  outcome: z.enum(['interested', 'not_interested', 'callback', 'voicemail', 'no_answer', 'completed', 'left_message']).nullable().optional(),
  notes: z.string().nullable().optional(),
  reminderDate: z.date().nullable().optional(),
});

// Type definitions from schemas
export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;

export type GlobalLead = z.infer<typeof selectGlobalLeadSchema>;
export type NewGlobalLead = z.infer<typeof insertGlobalLeadSchema>;

export type UserLead = z.infer<typeof selectUserLeadSchema>;
export type NewUserLead = z.infer<typeof insertUserLeadSchema>;

export type Call = z.infer<typeof selectCallSchema>;
export type NewCall = z.infer<typeof insertCallSchema>;

// Export all schema types
export default {
  user: {
    insert: insertUserSchema,
    select: selectUserSchema,
    login: userLoginSchema,
    update: userUpdateSchema,
  },
  globalLead: {
    insert: insertGlobalLeadSchema,
    select: selectGlobalLeadSchema,
  },
  userLead: {
    insert: insertUserLeadSchema,
    select: selectUserLeadSchema,
  },
  call: {
    insert: insertCallSchema,
    select: selectCallSchema,
  },
};
