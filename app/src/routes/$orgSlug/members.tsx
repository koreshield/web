import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy redirect: /$orgSlug/members → /app/$orgSlug/members
export const Route = createFileRoute("/$orgSlug/members")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/app/$orgSlug/members", params: { orgSlug: params.orgSlug }, replace: true });
  },
  component: () => null,
});
