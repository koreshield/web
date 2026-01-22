import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index, integer, boolean, jsonb, decimal } from "drizzle-orm/pg-core";
import { users, organizations } from "./auth-schema";

// Firewall Configurations
export const firewallConfigs = pgTable(
  "firewall_configs",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .unique()
      .references(() => organizations.id, { onDelete: "cascade" }),
    sensitivity: text("sensitivity").notNull().default("medium"), // low, medium, high
    defaultAction: text("default_action").notNull().default("block"), // allow, block, warn
    blocklist: jsonb("blocklist").notNull().default([]), // Array of blocked terms/patterns
    allowlist: jsonb("allowlist").notNull().default([]), // Array of allowed patterns
    enabledProviders: jsonb("enabled_providers").notNull().default(["openai"]), // Array of enabled LLM providers
    customRules: jsonb("custom_rules").notNull().default([]), // Custom security rules
    rateLimitEnabled: boolean("rate_limit_enabled").notNull().default(false),
    rateLimitRequests: integer("rate_limit_requests").notNull().default(100),
    rateLimitWindow: integer("rate_limit_window").notNull().default(60), // seconds
    logLevel: text("log_level").notNull().default("info"), // debug, info, warn, error
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("firewall_configs_organizationId_idx").on(table.organizationId),
  ],
);

// API Provider Configurations
export const apiProviders = pgTable(
  "api_providers",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // openai, anthropic, google, etc.
    name: text("name").notNull(), // Display name
    apiKey: text("api_key"), // Encrypted API key
    baseUrl: text("base_url"), // Custom base URL if needed
    models: jsonb("models").notNull().default([]), // Available models
    rateLimit: integer("rate_limit"), // Requests per minute
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("api_providers_organizationId_idx").on(table.organizationId),
    index("api_providers_provider_idx").on(table.provider),
  ],
);

// Security Events/Logs
export const securityEvents = pgTable(
  "security_events",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "set null" }),
    eventType: text("event_type").notNull(), // attack_detected, request_blocked, request_allowed, config_changed
    severity: text("severity").notNull(), // low, medium, high, critical
    provider: text("provider"), // LLM provider used
    model: text("model"), // Model that was called
    promptLength: integer("prompt_length"), // Length of the prompt
    confidence: decimal("confidence", { precision: 3, scale: 2 }), // Detection confidence 0.00-1.00
    attackType: text("attack_type"), // Type of attack detected
    actionTaken: text("action_taken").notNull(), // blocked, allowed, warned
    ipAddress: text("ip_address"), // Client IP
    userAgent: text("user_agent"), // Client user agent
    requestId: text("request_id"), // Unique request identifier
    details: jsonb("details").notNull().default({}), // Additional event details
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("security_events_organizationId_idx").on(table.organizationId),
    index("security_events_userId_idx").on(table.userId),
    index("security_events_eventType_idx").on(table.eventType),
    index("security_events_severity_idx").on(table.severity),
    index("security_events_createdAt_idx").on(table.createdAt),
  ],
);

// Analytics/Metrics
export const firewallMetrics = pgTable(
  "firewall_metrics",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull(), // Date for the metrics
    totalRequests: integer("total_requests").notNull().default(0),
    blockedRequests: integer("blocked_requests").notNull().default(0),
    allowedRequests: integer("allowed_requests").notNull().default(0),
    attacksDetected: integer("attacks_detected").notNull().default(0),
    avgResponseTime: integer("avg_response_time"), // Average response time in ms
    topAttackTypes: jsonb("top_attack_types").notNull().default({}), // Most common attack types
    providerUsage: jsonb("provider_usage").notNull().default({}), // Usage by provider
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("firewall_metrics_organizationId_idx").on(table.organizationId),
    index("firewall_metrics_date_idx").on(table.date),
  ],
);

// Relations
export const firewallConfigsRelations = relations(firewallConfigs, ({ one }) => ({
  organization: one(organizations, {
    fields: [firewallConfigs.organizationId],
    references: [organizations.id],
  }),
}));

export const apiProvidersRelations = relations(apiProviders, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiProviders.organizationId],
    references: [organizations.id],
  }),
}));

export const securityEventsRelations = relations(securityEvents, ({ one }) => ({
  organization: one(organizations, {
    fields: [securityEvents.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [securityEvents.userId],
    references: [users.id],
  }),
}));

export const firewallMetricsRelations = relations(firewallMetrics, ({ one }) => ({
  organization: one(organizations, {
    fields: [firewallMetrics.organizationId],
    references: [organizations.id],
  }),
}));