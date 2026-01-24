import { createStartHandler } from "@tanstack/react-start/client";
import { createRouter } from "./router";

export default createStartHandler({
  createRouter,
  getRouterManifest: () => import("./routeTree.gen"),
})({
  // Add any client-specific configuration here
});