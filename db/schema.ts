import { sql } from 'drizzle-orm';
import { check, index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(), name: text('name').notNull(), createdAt: text('created_at').notNull(),
  intakeEnabled: integer('intake_enabled').notNull().default(1), aiEnabled: integer('ai_enabled').notNull().default(0),
  budgetLimitMicrousd: integer('budget_limit_microusd').notNull().default(0),
  budgetSpentMicrousd: integer('budget_spent_microusd').notNull().default(0),
  budgetReservedMicrousd: integer('budget_reserved_microusd').notNull().default(0),
  retentionDays: integer('retention_days').notNull().default(30), settingsVersion: integer('settings_version').notNull().default(1),
}, t => [check('organization_budget_nonnegative', sql`${t.budgetLimitMicrousd} >= 0 AND ${t.budgetSpentMicrousd} >= 0 AND ${t.budgetReservedMicrousd} >= 0`), check('organization_retention', sql`${t.retentionDays} BETWEEN 1 AND 365`)]);

export const memberships = sqliteTable('memberships', {
  orgId: text('org_id').notNull().references(() => organizations.id), userId: text('user_id').notNull(),
  displayName: text('display_name').notNull(), rolesJson: text('roles_json').notNull(), active: integer('active').notNull().default(1),
  createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, t => [primaryKey({columns: [t.orgId, t.userId]}), uniqueIndex('membership_identity').on(t.userId)]);

export const criteriaVersions = sqliteTable('criteria_versions', {
  id: text('id').primaryKey(), orgId: text('org_id').notNull().references(() => organizations.id),
  version: integer('version').notNull(), text: text('text').notNull(), createdAt: text('created_at').notNull(), authorId: text('author_id').notNull(),
}, t => [uniqueIndex('criteria_org_version').on(t.orgId, t.version)]);

export const intakeSessions = sqliteTable('intake_sessions', {
  id: text('id').primaryKey(), orgId: text('org_id').notNull().references(() => organizations.id), ownerId: text('owner_id').notNull(),
  criteriaId: text('criteria_id').notNull().references(() => criteriaVersions.id), mode: text('mode').notNull().default('demo'),
  state: text('state').notNull().default('draft'), version: integer('version').notNull().default(1),
  participantChars: integer('participant_chars').notNull().default(0), questionCount: integer('question_count').notNull().default(0),
  questionReady: integer('question_ready').notNull().default(0), aiCalls: integer('ai_calls').notNull().default(0),
  leaseToken: text('lease_token'), leaseUntil: text('lease_until'), mutationToken: text('mutation_token'),
  expiresAt: text('expires_at').notNull(), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, t => [index('sessions_org_owner').on(t.orgId, t.ownerId), check('session_demo_only', sql`${t.mode} = 'demo'`), check('session_chars', sql`${t.participantChars} BETWEEN 0 AND 10000`), check('session_questions', sql`${t.questionCount} BETWEEN 0 AND 8`), check('session_version', sql`${t.version} >= 1`)]);

export const cases = sqliteTable('cases', {
  id: text('id').primaryKey(), orgId: text('org_id').notNull().references(() => organizations.id),
  sessionId: text('session_id').notNull().references(() => intakeSessions.id), ownerId: text('owner_id').notNull(),
  criteriaId: text('criteria_id').notNull().references(() => criteriaVersions.id), mode: text('mode').notNull().default('demo'),
  title: text('title').notNull(), status: text('status').notNull().default('RECEBIDO'), version: integer('version').notNull().default(1),
  analysisError: text('analysis_error'), leaseToken: text('lease_token'), leaseUntil: text('lease_until'), mutationToken: text('mutation_token'),
  createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, t => [uniqueIndex('case_session').on(t.sessionId), index('cases_org_created').on(t.orgId, t.createdAt, t.id), check('case_demo_only', sql`${t.mode} = 'demo'`), check('case_version', sql`${t.version} >= 1`)]);

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(), orgId: text('org_id').notNull().references(() => organizations.id),
  sessionId: text('session_id').notNull().references(() => intakeSessions.id, {onDelete:'cascade'}),
  role: text('role').notNull(), content: text('content').notNull(), sequence: integer('sequence').notNull(), createdAt: text('created_at').notNull(),
}, t => [uniqueIndex('message_session_sequence').on(t.sessionId, t.sequence), index('messages_org_session').on(t.orgId, t.sessionId), check('message_role', sql`${t.role} IN ('user','assistant')`)]);

export const analyses = sqliteTable('analyses', {
  id: text('id').primaryKey(), orgId: text('org_id').notNull().references(() => organizations.id),
  caseId: text('case_id').notNull().references(() => cases.id, {onDelete:'cascade'}), version: integer('version').notNull(),
  dataJson: text('data_json').notNull(), model: text('model').notNull(), promptVersion: text('prompt_version').notNull(),
  schemaVersion: text('schema_version').notNull(), criteriaVersion: integer('criteria_version').notNull(), createdAt: text('created_at').notNull(),
}, t => [uniqueIndex('analysis_case_version').on(t.caseId, t.version)]);

export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey(), orgId: text('org_id').notNull().references(() => organizations.id),
  caseId: text('case_id').notNull().references(() => cases.id, {onDelete:'cascade'}), authorId: text('author_id').notNull(),
  authorName: text('author_name').notNull(), decision: text('decision').notNull(), notes: text('notes').notNull(),
  correctedAnalysisJson: text('corrected_analysis_json'), caseVersion: integer('case_version').notNull(), createdAt: text('created_at').notNull(),
}, t => [uniqueIndex('review_case_version').on(t.caseId, t.caseVersion)]);

export const auditEvents = sqliteTable('audit_events', {
  id: text('id').primaryKey(), orgId: text('org_id').notNull().references(() => organizations.id),
  actorId: text('actor_id'), action: text('action').notNull(), resourceId: text('resource_id'), requestId: text('request_id').notNull(), createdAt: text('created_at').notNull(),
}, t => [index('audit_org_resource').on(t.orgId, t.resourceId)]);

export const aiOperations = sqliteTable('ai_operations', {
  id: text('id').primaryKey(), orgId: text('org_id').notNull().references(() => organizations.id),
  resourceId: text('resource_id').notNull(), kind: text('kind').notNull(), attempts: integer('attempts').notNull().default(0),
}, t => [index('operation_org_resource').on(t.orgId, t.resourceId), check('operation_attempt_limit', sql`${t.attempts} BETWEEN 0 AND 3`)]);

export const aiUsage = sqliteTable('ai_usage', {
  id: text('id').primaryKey(), orgId: text('org_id').notNull().references(() => organizations.id),
  resourceId: text('resource_id'), operationId: text('operation_id'), kind: text('kind').notNull(), status: text('status').notNull(),
  reservedMicrousd: integer('reserved_microusd').notNull(), costMicrousd: integer('cost_microusd').notNull().default(0),
  inputTokens: integer('input_tokens').notNull().default(0), outputTokens: integer('output_tokens').notNull().default(0),
  usageEstimated: integer('usage_estimated').notNull().default(1), model: text('model'), providerRequestId: text('provider_request_id'),
  durationMs: integer('duration_ms'), errorCode: text('error_code'), createdAt: text('created_at').notNull(), completedAt: text('completed_at'),
}, t => [index('usage_org_resource').on(t.orgId, t.resourceId)]);

export const idempotency = sqliteTable('idempotency', {
  orgId: text('org_id').notNull().references(() => organizations.id), actorId: text('actor_id').notNull(), key: text('key').notNull(),
  action: text('action').notNull(), payloadHash: text('payload_hash').notNull(), token: text('token').notNull(),
  resourceId: text('resource_id'), state: text('state').notNull(), statusCode: integer('status_code'), responseJson: text('response_json'),
  createdAt: text('created_at').notNull(), leaseUntil: text('lease_until').notNull(),
}, t => [primaryKey({columns:[t.orgId,t.actorId,t.key]}), index('idempotency_org_resource').on(t.orgId,t.resourceId)]);
