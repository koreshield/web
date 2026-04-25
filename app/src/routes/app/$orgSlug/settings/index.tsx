import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$orgSlug/settings/")({
  component: () => {
    const {orgSlug  } = useParams({from:"/app/$orgSlug/settings"})
    return (
      <Navigate
        to="/app/$orgSlug/settings/profile"
        params={{
          orgSlug
        }}
      />
    );
  },
});
