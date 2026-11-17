import type { AiProvider } from './ai-contract.ts';
export interface VerifiedIdentity { id: string; displayName: string }
export interface ServerContext {
  db: D1Database;
  identity: VerifiedIdentity|null;
  provider: AiProvider;
  config: {
    bootstrapAdminId?: string;
    aiApproved: boolean;
    maxBudgetMicrousd: number;
    sessionTtlHours: number;
    realIntakeEnabled: false;
  };
}
