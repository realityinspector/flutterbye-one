# FLUTTERBYE CRM System Engineering Documentation

## System Architecture Overview

This document provides a comprehensive overview of the FLUTTERBYE CRM system architecture, mapping functionalities across backend, frontend, middleware, and identifying potential issues or mismatches.

## Backend Functionalities

| Feature | Endpoint | Description | Implementation |
|---------|----------|-------------|----------------|
| **Leads Management** | `/api/leads` | CRUD operations for leads with team sharing | `server/routes/leads.js` |
| | `/api/leads/:id` | Get, update, delete specific lead | `server/routes/leads.js` |
| **Organizations** | `/api/organizations` | CRUD operations for team organizations | `server/routes/organizations.js` |
| | `/api/organizations/:id` | Get, update, delete specific organization | `server/routes/organizations.js` |
| **Organization Members** | `/api/organizations/:orgId/members` | Manage team members in organizations | `server/routes/organization-members.js` |
| | `/api/organizations/:orgId/members/:memberId` | Update or remove specific member | `server/routes/organization-members.js` |
| **Analytics** | `/api/analytics/dashboard` | Dashboard metrics | `server/routes/index.js` |
| | `/api/analytics/user-performance` | User performance metrics (admin only) | `server/routes/index.js` |
| | `/api/analytics/call-outcomes` | Call outcomes distribution | `server/routes/index.js` |
| **AI Services** | `/api/ai/chat` | Chat completion with AI | `server/routes/ai.js` |
| | `/api/ai/search` | Web search capabilities | `server/routes/ai.js` |
| | `/api/ai/webSearch` | Contact lookup optimization | `server/routes/ai.js` |
| | `/api/ai/leads/generate` | AI-assisted lead generation | `server/routes/ai.js` |
| | `/api/ai/leads/create` | Create leads from AI-generated data | `server/routes/ai.js` |
| | `/api/ai/configs` | AI configuration management | `server/routes/ai.js` |
| **Authentication** | `/api/auth/login` (implied) | User authentication | `server/auth.js` |

## Frontend Functionalities

| Feature | Component/Hook | Description | Implementation |
|---------|----------------|-------------|----------------|
| **Leads Management** | `useLeads` hook | Fetch, create, update, delete leads | `src/hooks/useLeads.ts` |
| | `LeadCard` | Display lead information | `src/components/LeadCard.jsx` |
| | `LeadForm` | Create and edit lead details | `src/components/LeadForm.jsx` |
| **Call Tracking** | `useCalls` hook | Track and manage call records | `src/hooks/useCalls.ts` |
| | `CallItem` | Display call information | `src/components/CallItem.jsx` |
| | `NewCallFAB` | Create new call records | `src/components/NewCallFAB.tsx` |
| **Lead Generation** | `FindLeadsForm` | Interface for finding new leads | `src/components/LeadGeneration/FindLeadsForm.jsx` |
| | `LeadApprovalList` | Review and approve generated leads | `src/components/LeadGeneration/LeadApprovalList.jsx` |
| **Team Management** | `TeamLeadOptions` | Manage team lead sharing | `src/components/TeamLeadOptions.jsx` |
| | `OrganizationDetails` | Manage organization details | `src/screens/OrganizationDetails.tsx` |
| **User Setup** | `AdminSetupForm` | Admin account setup | `src/components/AdminSetupForm.jsx` |
| | `UserSetupForm` | User account setup | `src/components/UserSetupForm.jsx` |
| **API Client** | `APIClient` | Client-side API interaction layer | `public/js/core/api-client.js` |

## Middleware and System Configuration

| Component | Description | Implementation |
|-----------|-------------|----------------|
| **Authentication** | JWT-based authentication | `server/auth.js` |
| **Database** | Drizzle ORM for database operations | `server/db.js`, `shared/db/schema.js` |
| **API Interceptor** | Client-side API request interception | `public/js/api-interceptor.js` |
| **API Validator** | Client-side validation of API responses | `public/js/api-validator.js` |
| **Storage Management** | Client-side storage utilities | `public/js/core/storage-manager.js` |
| **API Adapter** | Adapter pattern for API compatibility | `public/js/core/api-adapter.js` |
| **Zod Schema** | Shared schema validation | `shared/db/zod-schema.ts` |
| **Web Search** | Integration with web search services | `server/services/ai/webSearch.js` |
| **OpenRouter** | Integration with OpenRouter AI services | `server/services/ai/openRouter.js` |

## Unexposed, Wrongly Routed, or Mismatched Systems

| Issue Type | Component | Description | Recommended Action |
|------------|-----------|-------------|-------------------|
| **Missing Implementation** | Calls API | `useCalls.ts` attempts to use endpoints not fully implemented in backend | Implement missing `/calls` endpoints in backend |
| **Endpoint Mismatch** | Auth Endpoint | Frontend uses `/api/auth/login` but implementation details aren't clear | Verify auth implementation matches client expectations |
| **Route Registration** | AI Routes | AI routes don't appear to be registered in `routes/index.js` | Add AI routes registration to main routes handler |
| **Missing Endpoint** | Lead Calls | Frontend tries to access `/leads/:id/calls` which isn't implemented | Implement endpoint for fetching calls for a specific lead |
| **Schema Consistency** | Lead Types | Potential mismatch between frontend and backend types | Ensure consistent schema between client and server |
| **Missing Frontend** | AI Capabilities | Limited frontend components for AI services | Develop UI components for AI lead generation features |
| **Unused Backend** | AI Configs | Backend supports AI configuration but no UI exists for it | Create admin interface for AI configuration |
| **API Path Mismatch** | Dashboard Check | Client makes `/dashboard-check` request but endpoint not visible in backend | Add or correct dashboard authentication check endpoint |

This document serves as a reference for engineers working on the FLUTTERBYE CRM system. It should be regularly updated as the system evolves to maintain an accurate representation of the system architecture. 