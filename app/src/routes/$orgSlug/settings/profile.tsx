import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy redirect: /$orgSlug/settings/profile → /app/$orgSlug/settings/profile
export const Route = createFileRoute("/$orgSlug/settings/profile")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/app/$orgSlug/settings/profile", params: { orgSlug: params.orgSlug }, replace: true });
  },
  component: () => null,
});
