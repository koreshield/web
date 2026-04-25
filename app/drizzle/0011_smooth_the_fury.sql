CREATE TABLE "alert_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_rule_id" uuid,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"message" text NOT NULL,
	"severity" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "alert_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"condition" jsonb NOT NULL,
	"threshold" integer,
	"time_window" text,
	"severity" text DEFAULT 'medium' NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"notification_channels" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"base_url" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firewall_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sensitivity" text DEFAULT 'medium' NOT NULL,
	"default_action" text DEFAULT 'block' NOT NULL,
	"features" jsonb DEFAULT '{"sanitization":true,"detection":true,"policyEnforcement":true}'::jsonb NOT NULL,
	"custom_rules" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firewall_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metric_type" text NOT NULL,
	"value" integer NOT NULL,
	"provider" text,
	"time_range" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"event_type" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"provider" text,
	"endpoint" text,
	"user_id" text,
	"session_id" text,
	"ip_address" text,
	"user_agent" text,
	"original_prompt" text,
	"sanitized_prompt" text,
	"detected_patterns" jsonb DEFAULT '[]'::jsonb,
	"action_taken" text NOT NULL,
	"confidence" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"firewall_config_id" uuid
);
--> statement-breakpoint
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_alert_rule_id_alert_rules_id_fk" FOREIGN KEY ("alert_rule_id") REFERENCES "public"."alert_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_firewall_config_id_firewall_configs_id_fk" FOREIGN KEY ("firewall_config_id") REFERENCES "public"."firewall_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_providers_name_idx" ON "api_providers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "firewall_metrics_timestamp_idx" ON "firewall_metrics" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "firewall_metrics_metric_type_idx" ON "firewall_metrics" USING btree ("metric_type");--> statement-breakpoint
CREATE INDEX "firewall_metrics_time_range_idx" ON "firewall_metrics" USING btree ("time_range");--> statement-breakpoint
CREATE INDEX "security_events_timestamp_idx" ON "security_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "security_events_event_type_idx" ON "security_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "security_events_severity_idx" ON "security_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "security_events_provider_idx" ON "security_events" USING btree ("provider");