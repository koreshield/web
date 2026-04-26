import { pgTable, text, timestamp, boolean, jsonb, integer, uuid, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Firewall Configurations Table
export const firewallConfigs = pgTable("firewall_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  sensitivity: text("sensitivity").notNull().default("medium"), // low, medium, high
  defaultAction: text("default_action").notNull().default("block"), // allow, warn, block
  features: jsonb("features").notNull().default({
    sanitization: true,
    detection: true,
    policyEnforcement: true,
  }),
  customRules: jsonb("custom_rules").default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// API Providers Table
export const apiProviders = pgTable("api_providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // openai, anthropic, gemini, etc.
  displayName: text("display_name").notNull(),
  baseUrl: text("base_url").notNull(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  config: jsonb("config").default({}), // Additional provider-specific config
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  nameIdx: index("api_providers_name_idx").on(table.name),
}));

// Security Events Table (for logging attacks/detections)
export const securityEvents = pgTable("security_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  eventType: text("event_type").notNull(), // injection_attempt, sanitization, block, allow, etc.
  severity: text("severity").notNull().default("medium"), // low, medium, high, critical
  provider: text("provider"), // openai, anthropic, etc.
  endpoint: text("endpoint"), // /chat/completions, etc.
  userId: text("user_id"), // If available from request
  sessionId: text("session_id"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  originalPrompt: text("original_prompt"), // The raw input
  sanitizedPrompt: text("sanitized_prompt"), // After sanitization
  detectedPatterns: jsonb("detected_patterns").default([]), // Array of detected attack patterns
  actionTaken: text("action_taken").notNull(), // blocked, allowed, sanitized, warned
  confidence: integer("confidence"), // 0-100 confidence score
  metadata: jsonb("metadata").default({}), // Additional context
  firewallConfigId: uuid("firewall_config_id").references(() => firewallConfigs.id),
}, (table) => ({
  timestampIdx: index("security_events_timestamp_idx").on(table.timestamp),
  eventTypeIdx: index("security_events_event_type_idx").on(table.eventType),
  severityIdx: index("security_events_severity_idx").on(table.severity),
  providerIdx: index("security_events_provider_idx").on(table.provider),
}));

// Firewall Metrics Table (for analytics/dashboard)
export const firewallMetrics = pgTable("firewall_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metricType: text("metric_type").notNull(), // requests_total, attacks_blocked, sanitizations, etc.
  value: integer("value").notNull(),
  provider: text("provider"),
  timeRange: text("time_range").notNull(), // hour, day, week, month
  metadata: jsonb("metadata").default({}),
}, (table) => ({
  timestampIdx: index("firewall_metrics_timestamp_idx").on(table.timestamp),
  metricTypeIdx: index("firewall_metrics_metric_type_idx").on(table.metricType),
  timeRangeIdx: index("firewall_metrics_time_range_idx").on(table.timeRange),
}));

// Alert Rules Table
export const alertRules = pgTable("alert_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  condition: jsonb("condition").notNull(), // Alert condition logic
  threshold: integer("threshold"),
  timeWindow: text("time_window"), // 1h, 24h, 7d, etc.
  severity: text("severity").notNull().default("medium"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  notificationChannels: jsonb("notification_channels").default([]), // email, slack, webhook, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Alert History Table
export const alertHistory = pgTable("alert_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  alertRuleId: uuid("alert_rule_id").references(() => alertRules.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  message: text("message").notNull(),
  severity: text("severity").notNull(),
  metadata: jsonb("metadata").default({}),
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at"),
});

// Relations
export const firewallConfigsRelations = relations(firewallConfigs, ({ many }) => ({
  securityEvents: many(securityEvents),
}));

export const apiProvidersRelations = relations(apiProviders, (_helpers) => ({
  // Add relations if needed
}));

export const securityEventsRelations = relations(securityEvents, ({ one }) => ({
  firewallConfig: one(firewallConfigs, {
    fields: [securityEvents.firewallConfigId],
    references: [firewallConfigs.id],
  }),
}));

export const firewallMetricsRelations = relations(firewallMetrics, (_helpers) => ({
  // Add relations if needed
}));

export const alertRulesRelations = relations(alertRules, ({ many }) => ({
  alertHistory: many(alertHistory),
}));

export const alertHistoryRelations = relations(alertHistory, ({ one }) => ({
  alertRule: one(alertRules, {
    fields: [alertHistory.alertRuleId],
    references: [alertRules.id],
  }),
}));