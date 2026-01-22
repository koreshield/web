DROP TABLE "domains" CASCADE;--> statement-breakpoint
DROP TABLE "subdomains" CASCADE;--> statement-breakpoint
DROP TABLE "tunnels" CASCADE;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD COLUMN "default_sensitivity" text DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD COLUMN "default_action" text DEFAULT 'block' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD COLUMN "alert_webhook_url" text;--> statement-breakpoint
ALTER TABLE "organization_settings" DROP COLUMN "full_capture_enabled";