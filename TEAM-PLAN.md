# Team Lead Sharing Implementation Plan

## Overview
This document outlines the implementation plan for adding team sharing capabilities to the WalkNTalk CRM application. The goal is to enable users to create organizations/teams, add other users to their teams, and share leads between team members.

## Current Architecture
- The application currently has individual user leads stored in `userLeads` table
- Each user lead references a global lead in the `globalLeads` table
- When a user creates a lead, it's stored as a personal lead

## Implementation Checklist

### 1. Database Schema Updates

- [ ] Create new `organizations` table in shared/db/schema.ts:
  ```typescript
  // Organizations table
  export const organizations = pgTable('organizations', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    createdBy: integer('created_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  });
  ```

- [ ] Create `organizationMembers` junction table:
  ```typescript
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
  ```

- [ ] Add organization fields to `userLeads` table:
  ```typescript
  // Update userLeads table to add organization reference and isShared flag
  // in shared/db/schema.ts
  export const userLeads = pgTable('user_leads', {
    // ... existing fields
    organizationId: integer('organization_id').references(() => organizations.id),
    isShared: boolean('is_shared').default(false),
    // ... existing fields
  });
  ```

- [ ] Add relations for organizations in shared/db/schema.ts:
  ```typescript
  export const organizationsRelations = relations(organizations, ({ one, many }) => ({
    creator: one(users, { fields: [organizations.createdBy], references: [users.id] }),
    members: many(organizationMembers),
    leads: many(userLeads),
  }));

  export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
    organization: one(organizations, { fields: [organizationMembers.organizationId], references: [organizations.id] }),
    user: one(users, { fields: [organizationMembers.userId], references: [users.id] }),
  }));
  ```

- [ ] Update userLeads relations:
  ```typescript
  export const userLeadsRelations = relations(userLeads, ({ one, many }) => ({
    // ... existing relations
    organization: one(organizations, { fields: [userLeads.organizationId], references: [organizations.id] }),
    // ... existing relations
  }));
  ```

### 2. Zod Schema Updates

- [ ] Create Zod schema definitions for organizations in shared/db/zod-schema.ts:
  ```typescript
  // Organization schemas
  export const insertOrganizationSchema = createInsertSchema(organizations, {
    name: z.string().min(2).max(100),
    description: z.string().optional(),
  });
  
  export const selectOrganizationSchema = createSelectSchema(organizations);
  
  export const insertOrganizationMemberSchema = createInsertSchema(organizationMembers, {
    role: z.enum(['admin', 'member']),
  });
  
  export const selectOrganizationMemberSchema = createSelectSchema(organizationMembers);
  
  // Update userLead schemas to include organization fields
  export const insertUserLeadSchema = createInsertSchema(userLeads, {
    // existing fields...
    organizationId: z.number().optional(),
    isShared: z.boolean().optional(),
  });
  
  // Add type definitions
  export type Organization = z.infer<typeof selectOrganizationSchema>;
  export type NewOrganization = z.infer<typeof insertOrganizationSchema>;
  export type OrganizationMember = z.infer<typeof selectOrganizationMemberSchema>;
  export type NewOrganizationMember = z.infer<typeof insertOrganizationMemberSchema>;
  ```

### 3. Backend API Endpoints Implementation

- [ ] Create organization routes:
  - [ ] `POST /api/organizations` - Create a new organization
  - [ ] `GET /api/organizations` - List user's organizations 
  - [ ] `GET /api/organizations/:id` - Get organization details
  - [ ] `PUT /api/organizations/:id` - Update organization
  - [ ] `DELETE /api/organizations/:id` - Delete organization

- [ ] Create organization members routes:
  - [ ] `POST /api/organizations/:id/members` - Add user to organization
  - [ ] `GET /api/organizations/:id/members` - List organization members
  - [ ] `DELETE /api/organizations/:id/members/:userId` - Remove member from organization

- [ ] Update lead routes:
  - [ ] Modify `POST /api/leads` to accept `organizationId` and `isShared` fields
  - [ ] Update `GET /api/leads` to fetch both personal leads and team leads
  - [ ] Implement filter for team vs. personal leads

### 3. Frontend Implementation

- [ ] Create organization UI components:
  - [ ] Organization creation form
  - [ ] Organization list view
  - [ ] Organization detail view with member management
  - [ ] User invitation interface

- [ ] Update lead creation UI:
  - [ ] Add "Save to team" option in lead creation form
  - [ ] Display organization dropdown when "Save to team" is selected
  - [ ] Update lead list to show team/personal indicator

- [ ] Update lead detail view:
  - [ ] Show organization information for shared leads
  - [ ] Add UI for changing lead from personal to team and vice versa

### 4. Authentication and Permission Updates

- [ ] Implement organization-based permissions:
  - [ ] Check if user is part of organization when accessing team leads
  - [ ] Allow organization admins to modify team leads
  - [ ] Enforce role-based permissions within organizations

### 5. Utility Functions

- [ ] Create helper functions for organization management:
  - [ ] `isUserInOrganization(userId, organizationId)`
  - [ ] `getUserOrganizations(userId)`
  - [ ] `getOrganizationMembers(organizationId)`

### 6. Testing

- [ ] Test organization creation and management:
  - [ ] Create organizations
  - [ ] Add/remove members
  - [ ] Update organization details

- [ ] Test lead sharing:
  - [ ] Create personal leads
  - [ ] Create team leads
  - [ ] Convert personal leads to team leads
  - [ ] Verify leads appear correctly for team members

- [ ] Test permissions:
  - [ ] Verify non-members cannot access team leads
  - [ ] Verify role-based permissions within teams

### 7. Documentation

- [ ] Update API documentation with new endpoints
- [ ] Create user documentation for team features
- [ ] Document database schema changes

## Technical Implementation Details

### Lead Sharing Logic

1. When creating a lead, user can choose to save to personal or to team.
2. If saving to team, the lead will be created with `organizationId` set and `isShared` flag set to true.
3. When fetching leads, the API will combine:
   - User's personal leads (`userId = currentUser.id AND organizationId IS NULL`)
   - All team leads from organizations the user is a member of (`organizationId IN (user's organizations) AND isShared = true`)

### Organization Membership Flow

1. User creates an organization and becomes its admin
2. Admin can add users by their username or email (must be registered in the system)
3. Added users can view and interact with all team leads

### Data Update Handling

- All team leads will be globally accessible to team members
- No check-out or parallel update management required (per requirements)
- Last update wins in case of parallel edits

## Post-Implementation Monitoring

- [ ] Track usage of team vs. personal leads feature
- [ ] Gather user feedback on team collaboration
- [ ] Monitor for any permission issues or data access problems

## Future Enhancements (Not in Current Scope)

- Activity feed showing team member actions
- Lead assignment between team members
- Record locking during edits
- Team-level analytics