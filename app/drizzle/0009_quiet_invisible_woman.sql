CREATE TABLE "api_providers" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"provider" text NOT NULL,
	"name" text NOT NULL,
	"api_key" text,
	"base_url" text,
	"models" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rate_limit" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firewall_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"sensitivity" text DEFAULT 'medium' NOT NULL,
	"default_action" text DEFAULT 'block' NOT NULL,
	"blocklist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allowlist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"enabled_providers" jsonb DEFAULT '["openai"]'::jsonb NOT NULL,
	"custom_rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rate_limit_enabled" boolean DEFAULT false NOT NULL,
	"rate_limit_requests" integer DEFAULT 100 NOT NULL,
	"rate_limit_window" integer DEFAULT 60 NOT NULL,
	"log_level" text DEFAULT 'info' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "firewall_configs_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "firewall_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"total_requests" integer DEFAULT 0 NOT NULL,
	"blocked_requests" integer DEFAULT 0 NOT NULL,
	"allowed_requests" integer DEFAULT 0 NOT NULL,
	"attacks_detected" integer DEFAULT 0 NOT NULL,
	"avg_response_time" integer,
	"top_attack_types" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"provider_usage" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"user_id" text,
	"event_type" text NOT NULL,
	"severity" text NOT NULL,
	"provider" text,
	"model" text,
	"prompt_length" integer,
	"confidence" numeric(3, 2),
	"attack_type" text,
	"action_taken" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"request_id" text,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_providers" ADD CONSTRAINT "api_providers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firewall_configs" ADD CONSTRAINT "firewall_configs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firewall_metrics" ADD CONSTRAINT "firewall_metrics_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_providers_organizationId_idx" ON "api_providers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "api_providers_provider_idx" ON "api_providers" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "firewall_configs_organizationId_idx" ON "firewall_configs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "firewall_metrics_organizationId_idx" ON "firewall_metrics" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "firewall_metrics_date_idx" ON "firewall_metrics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "security_events_organizationId_idx" ON "security_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "security_events_userId_idx" ON "security_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "security_events_eventType_idx" ON "security_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "security_events_severity_idx" ON "security_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "security_events_createdAt_idx" ON "security_events" USING btree ("created_at");