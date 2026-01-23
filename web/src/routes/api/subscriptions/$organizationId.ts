import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "../../../db";
import { subscriptions } from "../../../db/subscription-schema";
import { eq, count } from "drizzle-orm";
import { auth } from "../../../lib/auth";
import { members } from "../../../db/auth-schema";

export const Route = createFileRoute("/api/subscriptions/$organizationId")({
  server: {
    handlers: {
      GET: async ({
        request,
        params,
      }: {
        request: Request;
        params: { organizationId: string };
      }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
          });
        }

        const { organizationId } = params;

        try {
          // Get subscription
          const [subscription] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.organizationId, organizationId))
            .limit(1);

          const [memberCount] = await db
            .select({ value: count() })
            .from(members)
            .where(eq(members.organizationId, organizationId));

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
