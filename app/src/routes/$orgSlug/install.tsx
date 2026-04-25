import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy redirect: /$orgSlug/install → /app/$orgSlug/install
export const Route = createFileRoute("/$orgSlug/install")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/app/$orgSlug/install", params: { orgSlug: params.orgSlug }, replace: true });
  },
  component: () => null,
});
