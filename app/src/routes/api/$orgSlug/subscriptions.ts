import { createFileRoute } from "@tanstack/react-router";
import { eq, count } from "drizzle-orm";

import { getDb } from "../../../db";
import { subscriptions } from "../../../db/subscription-schema";
import { members } from "../../../db/auth-schema";
import { requireOrgFromSlug } from "../../../lib/org";

export const Route = createFileRoute("/api/$orgSlug/subscriptions")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const orgResult = await requireOrgFromSlug(request, params.orgSlug);
        if ("error" in orgResult) return orgResult.error;
        const { organization } = orgResult;

        const organizationId = organization.id;

        try {
          const [subscription] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.organizationId, organizationId))
            .limit(1);

          const [memberCount] = await Promise.all([
            db
              .select({ value: count() })
              .from(members)
              .where(eq(members.organizationId, organizationId)),
          ]);

          return new Response(
            JSON.stringify({
              subscription: subscription || null,
              usage: {
                members: Number(memberCount?.value ?? 0),
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (error) {
          console.error("Error fetching subscription:", error);
          return new Response(
            JSON.stringify({ error: "Failed to fetch subscription" }),
            { status: 500 },
          );
        }
      },
    },
  },
});
