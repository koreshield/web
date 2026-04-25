import { createRouter as createTanstackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const router = createTanstackRouter({
  routeTree,
  scrollRestoration: true,
});

export function createRouter() {
  return router;
}

export function getRouter() {
  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}