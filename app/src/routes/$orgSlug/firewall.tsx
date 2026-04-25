import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy redirect: /$orgSlug/firewall → /app/$orgSlug/firewall
export const Route = createFileRoute("/$orgSlug/firewall")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/app/$orgSlug/firewall", params: { orgSlug: params.orgSlug }, replace: true });
  },
  component: () => null,
});
