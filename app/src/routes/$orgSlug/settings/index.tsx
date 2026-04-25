import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy redirect: /$orgSlug/settings → /app/$orgSlug/settings
export const Route = createFileRoute("/$orgSlug/settings")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/app/$orgSlug/settings", params: { orgSlug: params.orgSlug }, replace: true });
  },
  component: () => null,
});
