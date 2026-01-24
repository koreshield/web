import { createStartHandler } from "@tanstack/react-start/server";
import { createRouter } from "./router";

export default createStartHandler({
  createRouter,
  getRouterManifest: () => import("./routeTree.gen"),
})({
  // Add any server-specific configuration here
});