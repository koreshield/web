import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "../../../db";
import { users, organizations, securityEvents, subscriptions } from "../../../db/schema";
import { redis } from "../../../lib/redis";
import { hashToken } from "../../../lib/hash";
import { sql, count, gte, desc, eq } from "drizzle-orm";

export const Route = createFileRoute("/api/admin/charts")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authHeader = request.headers.get("authorization") || "";
        const token = authHeader.startsWith("Bearer ")
          ? authHeader.slice("Bearer ".length)
          : "";

        if (!token) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tokenKey = `admin:token:${hashToken(token)}`;
        const exists = await redis.get(tokenKey);
        if (!exists) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        try {
          const now = new Date();

          // User signups over time (last 30 days, daily)
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          const userSignups = await db
            .select({
              date: sql<string>`DATE(${users.createdAt})`.as("date"),
              count: count(),
            })
            .from(users)
            .where(gte(users.createdAt, thirtyDaysAgo))
            .groupBy(sql`DATE(${users.createdAt})`)
            .orderBy(sql`DATE(${users.createdAt})`);

          // Organization growth (last 30 days, daily)
          const orgGrowth = await db
            .select({
              date: sql<string>`DATE(${organizations.createdAt})`.as("date"),
              count: count(),
            })
            .from(organizations)
            .where(gte(organizations.createdAt, thirtyDaysAgo))
            .groupBy(sql`DATE(${organizations.createdAt})`)
            .orderBy(sql`DATE(${organizations.createdAt})`);

          // Subscription changes over time (last 30 days)
          const subChanges = await db
            .select({
              date: sql<string>`DATE(${subscriptions.updatedAt})`.as("date"),
              plan: subscriptions.plan,
              count: count(),
            })
            .from(subscriptions)
            .where(gte(subscriptions.updatedAt, thirtyDaysAgo))
            .groupBy(sql`DATE(${subscriptions.updatedAt})`, subscriptions.plan)
            .orderBy(sql`DATE(${subscriptions.updatedAt})`);

          // Security event severity distribution
          const severityDist = await db
            .select({
              severity: securityEvents.severity,
              count: count(),
            })
            .from(securityEvents)
            .groupBy(securityEvents.severity);

          // Security events over time (last 7 days)
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const securityActivity = await db
            .select({
              date: sql<string>`DATE(${securityEvents.timestamp})`.as("date"),
              actionTaken: securityEvents.actionTaken,
              count: count(),
            })
            .from(securityEvents)
            .where(gte(securityEvents.timestamp, sevenDaysAgo))
            .groupBy(sql`DATE(${securityEvents.timestamp})`, securityEvents.actionTaken)
            .orderBy(sql`DATE(${securityEvents.timestamp})`);

          // User verification status
          const verificationStatus = await db
            .select({
              verified: users.emailVerified,
              count: count(),
            })
            .from(users)
            .groupBy(users.emailVerified);

          // Subscription status breakdown
          const subStatus = await db
            .select({
              status: subscriptions.status,
              count: count(),
            })
            .from(subscriptions)
            .groupBy(subscriptions.status);

          // Top organizations by security events
          const topOrgsByActivity = await db
            .select({
              provider: securityEvents.provider,
              count: count(),
            })
            .from(securityEvents)
            .where(gte(securityEvents.timestamp, thirtyDaysAgo))
            .groupBy(securityEvents.provider)
            .orderBy(desc(count()))
            .limit(10);

          // Cumulative user growth
          const cumulativeUsers = await db
            .select({
              date: sql<string>`DATE(${users.createdAt})`.as("date"),
              count: count(),
            })
            .from(users)
            .groupBy(sql`DATE(${users.createdAt})`)
            .orderBy(sql`DATE(${users.createdAt})`);

          let cumulative = 0;
          const cumulativeGrowth = cumulativeUsers.map((row) => {
            cumulative += row.count;
            return { date: row.date, total: cumulative };
          });

          return Response.json({
            userSignups,
            orgGrowth,
            subChanges,
            severityDist,
            securityActivity,
            verificationStatus,
            subStatus,
            topOrgsByActivity,
            cumulativeGrowth: cumulativeGrowth.slice(-90), // Last 90 days
          });
        } catch (error) {
          console.error("Admin charts error:", error);
          return Response.json({ error: "Failed to fetch chart data" }, { status: 500 });
        }
      },
    },
  },
});
