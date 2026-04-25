import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy redirect: /$orgSlug/requests → /app/$orgSlug/requests
export const Route = createFileRoute("/$orgSlug/requests")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/app/$orgSlug/requests", params: { orgSlug: params.orgSlug }, replace: true });
  },
  component: () => null,
});
