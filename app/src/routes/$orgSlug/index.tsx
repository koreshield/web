import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy redirect: /$orgSlug → /app/$orgSlug
export const Route = createFileRoute("/$orgSlug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/app/$orgSlug", params: { orgSlug: params.orgSlug }, replace: true });
  },
  component: () => null,
});
