import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy redirect: /$orgSlug/settings/organization → /app/$orgSlug/settings/organization
export const Route = createFileRoute("/$orgSlug/settings/organization")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/app/$orgSlug/settings/organization", params: { orgSlug: params.orgSlug }, replace: true });
  },
  component: () => null,
});
