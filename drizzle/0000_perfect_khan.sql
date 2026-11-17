CREATE TABLE `ai_operations` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`resource_id` text NOT NULL,
	`kind` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "operation_attempt_limit" CHECK("ai_operations"."attempts" BETWEEN 0 AND 3)
);
--> statement-breakpoint
CREATE INDEX `operation_org_resource` ON `ai_operations` (`org_id`,`resource_id`);--> statement-breakpoint
CREATE TABLE `ai_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`resource_id` text,
	`operation_id` text,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`reserved_microusd` integer NOT NULL,
	`cost_microusd` integer DEFAULT 0 NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`usage_estimated` integer DEFAULT 1 NOT NULL,
	`model` text,
	`provider_request_id` text,
	`duration_ms` integer,
	`error_code` text,
	`created_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `usage_org_resource` ON `ai_usage` (`org_id`,`resource_id`);--> statement-breakpoint
CREATE TABLE `analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`case_id` text NOT NULL,
	`version` integer NOT NULL,
	`data_json` text NOT NULL,
	`model` text NOT NULL,
	`prompt_version` text NOT NULL,
	`schema_version` text NOT NULL,
	`criteria_version` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `analysis_case_version` ON `analyses` (`case_id`,`version`);--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`resource_id` text,
	`request_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_org_resource` ON `audit_events` (`org_id`,`resource_id`);--> statement-breakpoint
CREATE TABLE `cases` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`session_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`criteria_id` text NOT NULL,
	`mode` text DEFAULT 'demo' NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'RECEBIDO' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`analysis_error` text,
	`lease_token` text,
	`lease_until` text,
	`mutation_token` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`session_id`) REFERENCES `intake_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`criteria_id`) REFERENCES `criteria_versions`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "case_demo_only" CHECK("cases"."mode" = 'demo'),
	CONSTRAINT "case_version" CHECK("cases"."version" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `case_session` ON `cases` (`session_id`);--> statement-breakpoint
CREATE INDEX `cases_org_created` ON `cases` (`org_id`,`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `criteria_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`version` integer NOT NULL,
	`text` text NOT NULL,
	`created_at` text NOT NULL,
	`author_id` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `criteria_org_version` ON `criteria_versions` (`org_id`,`version`);--> statement-breakpoint
CREATE TABLE `idempotency` (
	`org_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`key` text NOT NULL,
	`action` text NOT NULL,
	`payload_hash` text NOT NULL,
	`token` text NOT NULL,
	`resource_id` text,
	`state` text NOT NULL,
	`status_code` integer,
	`response_json` text,
	`created_at` text NOT NULL,
	`lease_until` text NOT NULL,
	PRIMARY KEY(`org_id`, `actor_id`, `key`),
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idempotency_org_resource` ON `idempotency` (`org_id`,`resource_id`);--> statement-breakpoint
CREATE TABLE `intake_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`criteria_id` text NOT NULL,
	`mode` text DEFAULT 'demo' NOT NULL,
	`state` text DEFAULT 'draft' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`participant_chars` integer DEFAULT 0 NOT NULL,
	`question_count` integer DEFAULT 0 NOT NULL,
	`question_ready` integer DEFAULT 0 NOT NULL,
	`ai_calls` integer DEFAULT 0 NOT NULL,
	`lease_token` text,
	`lease_until` text,
	`mutation_token` text,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`criteria_id`) REFERENCES `criteria_versions`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "session_demo_only" CHECK("intake_sessions"."mode" = 'demo'),
	CONSTRAINT "session_chars" CHECK("intake_sessions"."participant_chars" BETWEEN 0 AND 10000),
	CONSTRAINT "session_questions" CHECK("intake_sessions"."question_count" BETWEEN 0 AND 8),
	CONSTRAINT "session_version" CHECK("intake_sessions"."version" >= 1)
);
--> statement-breakpoint
CREATE INDEX `sessions_org_owner` ON `intake_sessions` (`org_id`,`owner_id`);--> statement-breakpoint
CREATE TABLE `memberships` (
	`org_id` text NOT NULL,
	`user_id` text NOT NULL,
	`display_name` text NOT NULL,
	`roles_json` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`org_id`, `user_id`),
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `membership_identity` ON `memberships` (`user_id`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`session_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`sequence` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`session_id`) REFERENCES `intake_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "message_role" CHECK("messages"."role" IN ('user','assistant'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `message_session_sequence` ON `messages` (`session_id`,`sequence`);--> statement-breakpoint
CREATE INDEX `messages_org_session` ON `messages` (`org_id`,`session_id`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	`intake_enabled` integer DEFAULT 1 NOT NULL,
	`ai_enabled` integer DEFAULT 0 NOT NULL,
	`budget_limit_microusd` integer DEFAULT 0 NOT NULL,
	`budget_spent_microusd` integer DEFAULT 0 NOT NULL,
	`budget_reserved_microusd` integer DEFAULT 0 NOT NULL,
	`retention_days` integer DEFAULT 30 NOT NULL,
	`settings_version` integer DEFAULT 1 NOT NULL,
	CONSTRAINT "organization_budget_nonnegative" CHECK("organizations"."budget_limit_microusd" >= 0 AND "organizations"."budget_spent_microusd" >= 0 AND "organizations"."budget_reserved_microusd" >= 0),
	CONSTRAINT "organization_retention" CHECK("organizations"."retention_days" BETWEEN 1 AND 365)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`case_id` text NOT NULL,
	`author_id` text NOT NULL,
	`author_name` text NOT NULL,
	`decision` text NOT NULL,
	`notes` text NOT NULL,
	`corrected_analysis_json` text,
	`case_version` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `review_case_version` ON `reviews` (`case_id`,`case_version`);