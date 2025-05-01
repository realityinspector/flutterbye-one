import { UserLead as BaseUserLead, GlobalLead, User, Call } from '../../shared/db/zod-schema';

// Re-export the types
export type { Call, User, GlobalLead };

// Extended UserLead type to include the joined globalLead
export interface UserLeadWithRelations extends BaseUserLead {
  globalLead?: GlobalLead;
}

// Extended Call type to include the joined userLead
export interface CallWithRelations extends Call {
  userLead?: UserLeadWithRelations;
  user?: User;
}
