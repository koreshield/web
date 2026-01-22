import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { domains, tunnels } from "../../db/app-schema";

export const Route = createFileRoute("/internal/domain-check")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const domain = url.searchParams.get("domain");

        if (!domain) {
          return json({ error: "Domain required" }, { status: 400 });
        }

        // Check if it's a subdomain of koreshield.com
        if (domain.endsWith(".koreshield.com")) {
          // Extract subdomain
          const subdomain = domain.replace(".koreshield.com", "");

          // Check if tunnel exists with this subdomain (url)
          const tunnel = await getDb().query.tunnels.findFirst({
            where: eq(tunnels.url, subdomain),
          });

          if (tunnel) {
            return json({ allowed: true });
          }
        }

        // Check if it's a custom domain
        const customDomain = await getDb().query.domains.findFirst({
          where: eq(domains.domain, domain),
        });

        if (customDomain) {
          return json({ allowed: true });
        }

        return json({ error: "Domain not allowed" }, { status: 403 });
      },
    },
  },
});
