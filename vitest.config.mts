import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    // "server-only" ships with Next.js and cannot be resolved by Vitest, so its
    // side-effect import is redirected to an inert Node builtin. Tests only: the
    // Next build still applies the real guard.
    alias: { "server-only": "node:module" },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
