import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy redirect: /$orgSlug/tokens → /app/$orgSlug/tokens
export const Route = createFileRoute("/$orgSlug/tokens")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/app/$orgSlug/tokens", params: { orgSlug: params.orgSlug }, replace: true });
  },
  component: () => null,
});
