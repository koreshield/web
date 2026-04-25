import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/logout")({
  server: {
    handlers: {
      POST: async () => {
        return new Response("Logged out successfully", {
          status: 200,
          headers: {
            "Set-Cookie": "admin_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0",
          },
        });
      },
    },
  },
});
