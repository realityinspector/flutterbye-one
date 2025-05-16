import { GlobalLead, UserLead, Call, Organization } from '../shared/db/zod-schema';

// Extended type with global lead relationship
export interface UserLeadWithRelations extends UserLead {
  globalLead: GlobalLead;
}

// Extended type with organization relationship
export interface UserLeadWithOrganization extends UserLeadWithRelations {
  organization?: Organization | null;
  isShared?: boolean;
}

// Extended call type with relationships
export interface CallWithRelations extends Call {
  userLead?: UserLeadWithRelations;
}