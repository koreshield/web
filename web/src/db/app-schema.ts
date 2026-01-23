import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index, integer, boolean } from "drizzle-orm/pg-core";
import { users, organizations } from "./auth-schema";

// API Keys for authentication with KoreShield
export const authTokens = pgTable(
  "auth_tokens",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    name: text("name").notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("auth_tokens_organizationId_idx").on(table.organizationId),
    index("auth_tokens_userId_idx").on(table.userId),
  ],
);

export const organizationSettings = pgTable(
  "organization_settings",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .unique()
      .references(() => organizations.id, { onDelete: "cascade" }),
    defaultSensitivity: text("default_sensitivity").notNull().default("medium"), // low, medium, high
    defaultAction: text("default_action").notNull().default("block"), // allow, warn, block
    alertWebhookUrl: text("alert_webhook_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("organization_settings_organizationId_idx").on(table.organizationId),
  ],
);

export const authTokensRelations = relations(authTokens, ({ one }) => ({
  organization: one(organizations, {
    fields: [authTokens.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [authTokens.userId],
    references: [users.id],
  }),
}));

export const organizationSettingsRelations = relations(organizationSettings, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationSettings.organizationId],
    references: [organizations.id],
  }),
}));

export const usersAppRelations = relations(users, ({ many }) => ({
  authTokens: many(authTokens),
}));

export const organizationsAppRelations = relations(
  organizations,
  ({ many, one }) => ({
    authTokens: many(authTokens),
    settings: one(organizationSettings),
  }),
);
