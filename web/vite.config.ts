import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import mdx from "fumadocs-mdx/vite";
import * as MdxConfig from "./source.config";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: ["./tsconfig.json", "./tsconfig.app.json"],
    }),
    tanstackStart(),
    nitro(),
    viteReact(),
    tailwindcss(),
    mdx(MdxConfig),
  ],
  server: {
    allowedHosts: true,
  },
});
