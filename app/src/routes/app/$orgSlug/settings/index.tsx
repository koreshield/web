import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";

function SettingsRedirect() {
  const { orgSlug } = useParams({ from: "/app/$orgSlug/settings" });
  return (
    <Navigate
      to="/app/$orgSlug/settings/profile"
      params={{ orgSlug }}
    />
  );
}

export const Route = createFileRoute("/app/$orgSlug/settings/")({
  component: SettingsRedirect,
});
