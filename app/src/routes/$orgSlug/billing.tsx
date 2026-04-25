import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy redirect: /$orgSlug/billing → /app/$orgSlug/billing
export const Route = createFileRoute("/$orgSlug/billing")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/app/$orgSlug/billing", params: { orgSlug: params.orgSlug }, replace: true });
  },
  component: () => null,
});
