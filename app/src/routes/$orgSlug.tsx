import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy redirect: /:orgSlug → /app/:orgSlug
// Kept for backwards compatibility with any existing bookmarks or links.
export const Route = createFileRoute("/$orgSlug")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/app/$orgSlug",
      params: { orgSlug: params.orgSlug },
      replace: true,
    });
  },
  component: () => null,
});
